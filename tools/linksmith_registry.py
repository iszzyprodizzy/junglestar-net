#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html
import json
import posixpath
import re
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEALTH = ROOT / "assets/data/site-health.json"
REGISTRY = ROOT / "assets/data/linksmith-registry.json"

HTML_FILES = sorted(ROOT.glob("*.html")) + sorted((ROOT / "arcade").glob("*.html"))

A_TAG = re.compile(r"<a\b[^>]*>", re.I | re.S)
HREF = re.compile(r"""\bhref\s*=\s*(["'])(.*?)\1""", re.I | re.S)
LINK_ID = re.compile(r"""\bdata-linksmith-id\s*=""", re.I)
STRIP_TAGS = re.compile(r"<[^>]+>")

INVALID_MARKERS = ("PASTE_", "TODO", "REPLACE_ME")


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def stable_id(destination: str) -> str:
    digest = hashlib.sha256(destination.encode("utf-8")).hexdigest()[:16].upper()
    return "LINK-" + digest


def canonical_destination(source: Path, href: str) -> str:
    value = href.strip()

    if value.startswith(("http://", "https://", "mailto:", "tel:")):
        return value

    if not value or value == "#":
        return value

    parsed = urllib.parse.urlsplit(value)

    if parsed.scheme:
        return value

    source_rel = source.relative_to(ROOT).as_posix()

    if value.startswith("#"):
        path = "/" + source_rel
        return urllib.parse.urlunsplit(("", "", path, "", parsed.fragment))

    base_dir = posixpath.dirname("/" + source_rel)
    target_path = posixpath.normpath(
        posixpath.join(base_dir, parsed.path or posixpath.basename(source_rel))
    )

    if not target_path.startswith("/"):
        target_path = "/" + target_path

    return urllib.parse.urlunsplit(
        ("", "", target_path, parsed.query, parsed.fragment)
    )


def link_type(destination: str, used_on: list[str]) -> str:
    low = destination.casefold()
    host = urllib.parse.urlsplit(destination).netloc.casefold()

    if "square" in host or "square.link" in low or "squareup" in host:
        return "SQUARE"

    if "youtube.com" in host or "youtu.be" in host:
        return "YOUTUBE"

    if "suno.com" in host:
        return "SUNO"

    if "printify" in host:
        return "PRINTIFY"

    if "printful" in host:
        return "PRINTFUL"

    if any(
        name in host
        for name in (
            "instagram.com",
            "facebook.com",
            "tiktok.com",
            "x.com",
            "twitter.com",
            "linkedin.com",
        )
    ):
        return "SOCIAL"

    joined = " ".join(used_on).casefold()

    if not urllib.parse.urlsplit(destination).scheme and not destination.startswith("mailto:"):
        return "INTERNAL_PAGE"

    if "game" in low or "arcade" in low or "games" in joined:
        return "GAME"

    if "book" in low or "amazon" in host or "publishing" in joined:
        return "BOOK"

    if "music" in low or "spotify" in host or "music" in joined:
        return "MUSIC"

    if "radio" in low or "radio" in joined:
        return "RADIO"

    if "sponsor" in low or "sponsor" in joined:
        return "SPONSOR"

    if "donate" in low or "donate" in joined:
        return "DONATE"

    return "OTHER"


def project_for(pages: list[str]) -> str:
    lowered = " ".join(pages).casefold()

    if "music" in lowered or "radio" in lowered:
        return "JUNGLE STAR MUSIC / ANIMAL RADIO"

    if "games" in lowered or "arcade" in lowered:
        return "JUNGLE STAR GAMES"

    if "publishing" in lowered or "book" in lowered:
        return "JUNGLE STAR PUBLISHING"

    if "coffee" in lowered:
        return "JUNGLE STAR COFFEE"

    if "sponsor" in lowered or "donate" in lowered:
        return "JUNGLE STAR SPONSORSHIP"

    return "JUNGLESTAR.NET"


def health_index() -> tuple[dict, dict]:
    report = json.loads(HEALTH.read_text(encoding="utf-8"))

    external = report.get("external_results") or {}
    issues = report.get("issues") or []

    issue_map: dict[str, list[dict]] = {}

    for row in issues:
        dest = str(row.get("destination") or "")
        issue_map.setdefault(dest, []).append(row)

    return external, issue_map


def classify_status(destination: str, external: dict, issue_map: dict) -> str:
    if (
        not destination
        or destination == "#"
        or any(marker.casefold() in destination.casefold() for marker in INVALID_MARKERS)
    ):
        return "PLACEHOLDER"

    issues = issue_map.get(destination, [])

    if any(
        str(row.get("type") or "").startswith("broken")
        for row in issues
    ):
        return "BROKEN"

    if destination.startswith(("http://", "https://")):
        state = external.get(destination)

        if state is None:
            return "UNKNOWN"

        return "CURRENT" if bool(state.get("ok")) else "BROKEN"

    if destination.startswith("mailto:"):
        return "CURRENT" if "@" in destination else "BROKEN"

    return "CURRENT"


def visible_title(tag: str, destination: str) -> str:
    end = tag.find(">")
    if end < 0:
        return destination

    return destination


def scan_records() -> tuple[list[dict], dict[Path, str]]:
    external, issue_map = health_index()

    records: dict[str, dict] = {}
    rewritten: dict[Path, str] = {}

    for page in HTML_FILES:
        raw = page.read_text(encoding="utf-8")
        source_name = page.relative_to(ROOT).as_posix()

        def replace_tag(match: re.Match) -> str:
            tag = match.group(0)
            href_match = HREF.search(tag)

            if not href_match:
                return tag

            href = href_match.group(2)
            destination = canonical_destination(page, href)
            link_id = stable_id(destination + "\n" + ("PLACEHOLDER" if destination in {"", "#"} else ""))

            row = records.setdefault(
                link_id,
                {
                    "id": link_id,
                    "title": destination or "(empty destination)",
                    "destination": destination,
                    "type": "",
                    "project": "",
                    "status": "",
                    "last_check": "",
                    "used_on": [],
                    "original_variants": [],
                },
            )

            if source_name not in row["used_on"]:
                row["used_on"].append(source_name)

            if href not in row["original_variants"]:
                row["original_variants"].append(href)

            if not LINK_ID.search(tag):
                tag = tag[:-1] + f' data-linksmith-id="{html.escape(link_id, quote=True)}">'

            return tag

        rewritten[page] = A_TAG.sub(replace_tag, raw)

    stamp = now()

    for row in records.values():
        row["used_on"].sort()
        row["type"] = link_type(row["destination"], row["used_on"])
        row["project"] = project_for(row["used_on"])
        row["status"] = classify_status(row["destination"], external, issue_map)
        row["last_check"] = stamp

    return sorted(records.values(), key=lambda x: (x["type"], x["destination"])), rewritten


def ensure_runtime_script(page: Path, text: str) -> str:
    source = (
        "assets/js/linksmith.js"
        if page.parent == ROOT
        else "../assets/js/linksmith.js"
    )

    marker = f'<script src="{source}"></script>'

    if marker in text:
        return text

    if "</body>" in text:
        return text.replace("</body>", marker + "</body>", 1)

    return text + "\n" + marker + "\n"


def main() -> None:
    records, rewritten = scan_records()

    for page, text in rewritten.items():
        page.write_text(
            ensure_runtime_script(page, text),
            encoding="utf-8",
            newline="\n",
        )

    payload = {
        "schema": "junglestar-linksmith-registry-v1",
        "generated_at": now(),
        "canonical_record_count": len(records),
        "records": records,
    }

    REGISTRY.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    duplicates_eliminated = sum(
        max(0, len(row["used_on"]) - 1)
        for row in records
    )

    statuses = {}
    types = {}

    for row in records:
        statuses[row["status"]] = statuses.get(row["status"], 0) + 1
        types[row["type"]] = types.get(row["type"], 0) + 1

    print(json.dumps({
        "canonical_records": len(records),
        "duplicate_page_references_deduped": duplicates_eliminated,
        "statuses": statuses,
        "types": types,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
