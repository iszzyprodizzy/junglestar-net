
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (navToggle && nav) navToggle.addEventListener('click', () => nav.classList.toggle('open'));

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    document.querySelectorAll('.resource').forEach(card => {
      card.style.display = (type === 'all' || card.dataset.type === type) ? '' : 'none';
    });
  });
});
