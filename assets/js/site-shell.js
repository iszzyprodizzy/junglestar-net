const siteNav = `
<header class="site-header">
  <a class="brand" href="index.html">Jungle Star</a>
  <button class="nav-toggle" aria-label="Toggle menu">Menu</button>
  <nav class="nav">
    <a href="index.html">Home</a>
    <a href="academy.html">Academy</a>
    <a href="resources.html">Resources</a>
    <a href="archive.html">Archive</a>
    <a href="games.html">Games</a>
    <a href="donate.html">Donate</a>
    <a href="sponsor.html">Sponsor</a>
    <a href="shop.html">Shop</a>
    <a href="coffee.html">Coffee</a>
    <a href="publishing.html">Publishing</a>
    <a href="tech.html">Tech</a>
    <a href="music.html">Music</a>
    <a href="radio.html">Radio</a>
    <a href="consulting.html">Consulting</a>
    <a href="start.html">Start Here</a>
  </nav>
</header>
`;

const siteFooter = `
<footer class="site-footer">
  <p><strong>The future is not coming. We are building it.</strong></p>
  <p>Email: <a href="mailto:IsaacBark@gmail.com">IsaacBark@gmail.com</a> | Social: @IszzyProdizzy / @JungleStarKids</p>
  <p><a href="privacy.html">Privacy</a></p>
</footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  const headerSlot = document.querySelector("[data-site-header]");
  const footerSlot = document.querySelector("[data-site-footer]");

  if (headerSlot) headerSlot.innerHTML = siteNav;
  if (footerSlot) footerSlot.innerHTML = siteFooter;
});