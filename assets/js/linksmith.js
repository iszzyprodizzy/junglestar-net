(() => {
  const registryPath = location.pathname.includes("/arcade/")
    ? "../assets/data/linksmith-registry.json"
    : "assets/data/linksmith-registry.json";

  async function loadRegistry() {
    const response = await fetch(registryPath, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`LinkSmith registry HTTP ${response.status}`);
    }

    return response.json();
  }

  function recordMap(payload) {
    return new Map(
      (payload.records || []).map(record => [record.id, record])
    );
  }

  function applyLinks(records) {
    document.querySelectorAll("[data-linksmith-id]").forEach(node => {
      const id = node.dataset.linksmithId;
      const record = records.get(id);

      if (!record) {
        node.dataset.linksmithStatus = "MISSING_RECORD";
        return;
      }

      node.dataset.linksmithStatus = record.status || "UNKNOWN";

      if (node.tagName === "A" && record.destination) {
        node.setAttribute("href", record.destination);
      }
    });
  }

  function renderDashboard(payload) {
    const root = document.getElementById("linksmithDashboard");

    if (!root) return;

    const rows = payload.records || [];

    root.innerHTML = rows.map(record => `
      <article class="card">
        <h2>${escapeHtml(record.title || record.id)}</h2>
        <p><strong>ID</strong><br><code>${escapeHtml(record.id)}</code></p>
        <p><strong>DESTINATION</strong><br><code>${escapeHtml(record.destination)}</code></p>
        <p>
          <strong>TYPE</strong> ${escapeHtml(record.type)}
          &nbsp; · &nbsp;
          <strong>STATUS</strong> ${escapeHtml(record.status)}
        </p>
        <p><strong>PROJECT</strong><br>${escapeHtml(record.project)}</p>
        <p><strong>LAST CHECK</strong><br>${escapeHtml(record.last_check)}</p>
        <details>
          <summary>USED ON ${record.used_on.length} PAGE(S)</summary>
          <ul>
            ${record.used_on.map(page => `<li>${escapeHtml(page)}</li>`).join("")}
          </ul>
        </details>
        ${record.destination && record.status !== "PLACEHOLDER"
          ? `<p><a class="button" href="${escapeAttr(record.destination)}" target="_blank" rel="noopener">OPEN DESTINATION</a></p>`
          : ""}
      </article>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const payload = await loadRegistry();
      const records = recordMap(payload);
      applyLinks(records);
      renderDashboard(payload);

      document.documentElement.dataset.linksmith = "READY";
    } catch (error) {
      console.error("LinkSmith:", error);
      document.documentElement.dataset.linksmith = "BLOCKED";
    }
  });
})();
