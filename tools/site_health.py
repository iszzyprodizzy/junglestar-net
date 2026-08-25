#!/usr/bin/env python3
"""Bounded, deterministic SiteSmith/LinkSmith health scan for JungleStar.net."""

from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ORIGIN = "https://junglestar.net/"
INVALID_MARKERS = ("PASTE_", "TODO", "REPLACE_ME")


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        key = "href" if tag in {"a", "link"} else "src" if tag in {"script", "img"} else None
        if key and values.get(key):
            self.links.append(values[key])


def parse_page(path: Path) -> LinkParser:
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def shared_shell_links() -> list[str]:
    shell = (ROOT / "assets/js/site-shell.js").read_text(encoding="utf-8")
    return re.findall(r'href="([^"]*)"', shell)


def local_target(source: Path, href: str) -> tuple[Path, str]:
    parsed = urllib.parse.urlsplit(href)
    relative = parsed.path or source.name
    target = (source.parent / relative).resolve()
    if relative.endswith("/"):
        target /= "index.html"
    return target, parsed.fragment


def verify_external(url: str) -> tuple[bool, int | None, str]:
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "JungleStar-LinkSmith/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return response.status < 400, response.status, response.geturl()
    except urllib.error.HTTPError as error:
        if error.code in {403, 405, 429}:
            try:
                request = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0 JungleStar-LinkSmith/1.0"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    return response.status < 400, response.status, response.geturl()
            except urllib.error.HTTPError as get_error:
                return get_error.code in {403, 429}, get_error.code, get_error.geturl()
            except urllib.error.URLError:
                return False, None, url
        return False, error.code, error.geturl()
    except urllib.error.URLError:
        return False, None, url


def scan(verify_public: bool) -> dict:
    pages = sorted(ROOT.glob("*.html")) + sorted((ROOT / "arcade").glob("*.html"))
    page_parsers = {page: parse_page(page) for page in pages}
    occurrences: list[tuple[Path, str]] = []
    for page, parser in page_parsers.items():
        occurrences.extend((page, href.strip()) for href in parser.links)
    occurrences.extend((ROOT / "assets/js/site-shell.js", href.strip()) for href in shared_shell_links())

    issues: list[dict] = []
    classifications = {"internal": 0, "external": 0, "email": 0}
    external_cache: dict[str, tuple[bool, int | None, str]] = {}
    broken = 0
    invalid = 0

    for source, href in occurrences:
        source_name = source.relative_to(ROOT).as_posix()
        if not href or href == "#" or any(marker in href for marker in INVALID_MARKERS):
            invalid += 1
            issues.append({"type": "missing_or_invalid", "source": source_name, "destination": href or "(empty)"})
            continue
        if href.startswith("mailto:"):
            classifications["email"] += 1
            if not re.fullmatch(r"mailto:[^@\s]+@[^@\s]+\.[^@\s]+", href):
                invalid += 1
                issues.append({"type": "missing_or_invalid", "source": source_name, "destination": href})
            continue
        parsed = urllib.parse.urlsplit(href)
        if parsed.scheme in {"http", "https"}:
            classifications["external"] += 1
            if verify_public:
                external_cache.setdefault(href, verify_external(href))
                ok, status, final_url = external_cache[href]
                if not ok:
                    broken += 1
                    issues.append({"type": "broken_external", "source": source_name, "destination": href, "status": status, "final_url": final_url})
            continue
        if parsed.scheme:
            invalid += 1
            issues.append({"type": "missing_or_invalid", "source": source_name, "destination": href})
            continue

        classifications["internal"] += 1
        base_source = source if source.suffix == ".html" else ROOT / "index.html"
        target, fragment = local_target(base_source, href)
        if not target.exists():
            broken += 1
            issues.append({"type": "broken_internal", "source": source_name, "destination": href})
        elif fragment and target.suffix == ".html":
            target_parser = page_parsers.get(target) or parse_page(target)
            if fragment not in target_parser.ids:
                broken += 1
                issues.append({"type": "broken_fragment", "source": source_name, "destination": href})

    registry = json.loads((ROOT / "assets/data/site-content.json").read_text(encoding="utf-8"))
    placement_counts: dict[str, int] = {}
    for placement in registry["placements"]:
        content_id = placement["content_id"]
        placement_counts[content_id] = placement_counts.get(content_id, 0) + 1
        if content_id not in registry["content"]:
            invalid += 1
            issues.append({"type": "unknown_content_identity", "source": placement["page"], "destination": content_id})
    repeated = sum(1 for count in placement_counts.values() if count > 1)

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return {
        "schema": "junglestar-site-health-v1",
        "scope": "root HTML, arcade HTML, shared site shell, canonical content registry",
        "public_origin": PUBLIC_ORIGIN,
        "last_verified": now,
        "summary": {
            "pages_found": len(pages),
            "links_checked": len(occurrences),
            "broken_links": broken,
            "repeated_content_identities": repeated,
            "missing_invalid_destinations": invalid,
            "internal_links": classifications["internal"],
            "external_links": classifications["external"],
            "email_links": classifications["email"]
        },
        "content_identity_references": placement_counts,
        "external_results": {url: {"ok": value[0], "status": value[1], "final_url": value[2]} for url, value in external_cache.items()},
        "issues": issues
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-public", action="store_true", help="Skip external HTTP verification")
    args = parser.parse_args()
    report = scan(not args.no_public)
    destination = ROOT / "assets/data/site-health.json"
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], sort_keys=True))


if __name__ == "__main__":
    main()
