document.addEventListener("DOMContentLoaded", async () => {
  const placements = document.querySelectorAll("[data-content-placement]");
  if (!placements.length) return;

  try {
    const response = await fetch("assets/data/site-content.json");
    if (!response.ok) throw new Error(`content registry returned ${response.status}`);
    const registry = await response.json();

    placements.forEach((placement) => {
      const content = registry.content[placement.dataset.contentPlacement];
      if (!content) return;
      placement.innerHTML = `
        <h3>${content.title}</h3>
        <p>${content.description}</p>
        <a class="btn" href="${content.destination}" target="_blank" rel="noopener">${content.action}</a>
      `;
    });
  } catch (error) {
    console.error("Canonical site content could not be loaded.", error);
  }
});
