
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


// JUNGLE_STAR_PUBLIC_SHOT_CLOCK
(() => {
  const root = document.querySelector('[data-public-shot-clock]');
  if (!root) return;

  const setText = (selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  };
  const present = value =>
    value !== null && value !== undefined && value !== '' &&
    value !== 'UNRECONCILED_HISTORY';

  const number = (value, digits = 1) =>
    present(value) && !Number.isNaN(Number(value))
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits
        })
      : 'Reconciling';

  fetch('assets/data/founder-shot-clock.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`shot-clock HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      const required = [
        'START_DATE','CURRENT_DATE','SHOT_CLOCK_DAY','MICRO_PROMPT_LEDGER',
        'FOUNDER_RELAY_MINUTES','FOUNDER_RELAY_HOURS','FOUNDER_RELAY_DAYS',
        'MODELED_OPPORTUNITY_VALUE','CASH_LOSS_CLAIM','HUMAN_TROPHIES_COMPLETED',
        'MACHINE_OWNED_RESULTS','PACKAGES_COMPLETED','FOUNDER_FAILURE_RELAY',
        'FOUNDER_SAYS_NEXT','LAST_REAL_HUMAN_RESULT'
      ];
      const missing = required.filter(key => !(key in data));
      if (missing.length) throw new Error(`public accountability contract missing: ${missing.join(', ')}`);
      if (data.CASH_LOSS_CLAIM !== 'NO') throw new Error('dishonest opportunity labeling blocked');

      setText('[data-shot-day]', number(data.SHOT_CLOCK_DAY, 0));
      setText('[data-shot-date]', data.CURRENT_DATE);
      setText('[data-relay-hours]', number(data.FOUNDER_RELAY_HOURS, 1));
      setText('[data-micro-prompts]', number(data.MICRO_PROMPT_LEDGER, 0));
      setText('[data-human-trophies]', number(data.HUMAN_TROPHIES_COMPLETED, 0));
      setText('[data-machine-results]', number(data.MACHINE_OWNED_RESULTS, 0));
      setText('[data-opportunity-label]', data.MODELED_OPPORTUNITY_LABEL);
      setText(
        '[data-opportunity-value]',
        present(data.MODELED_OPPORTUNITY_VALUE)
          ? `$${Number(data.MODELED_OPPORTUNITY_VALUE).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : 'Reconciling'
      );
      setText('[data-opportunity-disclosure]', data.MODELED_OPPORTUNITY_DISCLOSURE);
      setText('[data-last-human-result]', data.LAST_REAL_HUMAN_RESULT || 'Reconciling');

      const status = data.SOURCE_STALE
        ? 'Accountability source is stale. Publication should be blocked until refreshed.'
        : 'Public accountability receipt is current.';
      setText('[data-shot-clock-status]', status);
      root.setAttribute('data-contract-state', data.SOURCE_STALE ? 'stale' : 'current');
    })
    .catch(error => {
      setText('[data-shot-clock-status]', `Accountability data unavailable: ${error.message}`);
      root.setAttribute('data-contract-state', 'blocked');
    });
})();
