document.addEventListener("DOMContentLoaded", async () => {
  const status = document.querySelector("[data-health-status]");
  const metrics = document.querySelector("[data-health-metrics]");
  const issues = document.querySelector("[data-health-issues]");

  try {
    const response = await fetch("assets/data/site-health.json", {cache: "no-store"});
    if (!response.ok) throw new Error(`health receipt returned ${response.status}`);
    const report = await response.json();
    const labels = [
      ["pages_found", "Pages Found"],
      ["links_checked", "Links Checked"],
      ["broken_links", "Broken Links"],
      ["repeated_content_identities", "Repeated Content Identities"],
      ["missing_invalid_destinations", "Missing / Invalid Destinations"]
    ];

    metrics.innerHTML = labels.map(([key, label]) => `
      <article class="health-metric"><span>${label}</span><strong>${report.summary[key]}</strong></article>
    `).join("");
    status.textContent = `Last verified: ${report.last_verified}`;
    issues.innerHTML = report.issues.length
      ? report.issues.map((issue) => `<li><strong>${issue.type}</strong> — ${issue.source}: ${issue.destination}</li>`).join("")
      : "<li>No issues found in this bounded scan.</li>";
  } catch (error) {
    status.textContent = "Site Health receipt is unavailable.";
    issues.innerHTML = `<li>${error.message}</li>`;
  }
});
