/**
 * Small motion and navigation helpers.
 * - "order" shows its underline while the order panel is open.
 * - Prefetch on hover or focus where speculation rules are not supported
 *   (Chromium uses the speculation rules in layout/theme.liquid).
 * - The cart count bumps when it changes.
 */
(() => {
  /* ---- "order" underline while the order panel is open ---- */
  const panel = document.querySelector('[data-order-panel]');
  const triggers = [...document.querySelectorAll('[data-order-trigger]')];
  if (panel && triggers.length) {
    const onProduct = document.body.classList.contains('template-product');
    const sync = () => {
      triggers.forEach((t) => {
        t.classList.toggle('is-active', panel.open || onProduct);
        t.setAttribute('aria-expanded', String(panel.open));
      });
    };
    new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['open'] });
    panel.addEventListener('close', sync);
  }

  /* ---- Prefetch fallback ---- */
  const supportsRules = HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
  if (!supportsRules) {
    const done = new Set();
    const skip = /^\/(cart|checkout|checkouts|account)(\/|$)/;
    const prefetch = (event) => {
      const a = event.target.closest && event.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('data-order-trigger') || a.hasAttribute('data-cart-trigger')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.search || skip.test(url.pathname)) return;
      if (url.pathname === location.pathname || done.has(url.pathname)) return;
      done.add(url.pathname);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url.pathname;
      document.head.append(link);
    };
    document.addEventListener('pointerover', prefetch, { passive: true });
    document.addEventListener('focusin', prefetch);
    document.addEventListener('touchstart', prefetch, { passive: true });
  }

  /* ---- Footer credit: tap to reveal (hover and focus are handled in CSS) ---- */
  document.querySelectorAll('[data-credit-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const credit = toggle.closest('[data-credit]');
      const open = !credit.classList.contains('is-open');
      credit.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---- Cart count bump ---- */
  document.querySelectorAll('[data-cart-count]').forEach((count) => {
    let last = count.textContent;
    new MutationObserver(() => {
      if (count.textContent === last) return;
      last = count.textContent;
      const button = count.closest('.cart-button') || count;
      button.classList.remove('is-bumped');
      void button.offsetWidth;
      button.classList.add('is-bumped');
    }).observe(count, { childList: true, characterData: true, subtree: true });
  });
})();
