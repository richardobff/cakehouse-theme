/**
 * Cart drawer and cart page.
 *
 * The drawer opens after add to cart (the 'cart:open' event from
 * assets/order.js) and from the header cart button. Every change refreshes
 * the cart markup in place through the Section Rendering API: each
 * [data-cart-root] is re-rendered from its own section, so the drawer and the
 * cart page share one routine and nothing reloads. Removing a pie keeps the
 * pick up line and date in step (createCart().removeLine).
 */
(() => {
  const shared = window.Cakehouse && window.Cakehouse.order;
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!shared) return;
  const cart = shared.createCart(shared.config);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (drawer) shared.wireDialog(drawer);

  const sectionId = (el) => {
    const section = el.closest('.shopify-section');
    return section ? section.id.replace(/^shopify-section-/, '') : null;
  };

  function announce(root, message) {
    const status = root && root.querySelector('[data-cart-status]');
    if (!status) return;
    status.textContent = '';
    requestAnimationFrame(() => (status.textContent = message));
  }

  /** Re-renders every cart on the page; resolves with the new roots. */
  let pending = null;
  function refresh() {
    const roots = [...document.querySelectorAll('[data-cart-root]')];
    const ids = [...new Set(roots.map(sectionId).filter(Boolean))];
    if (!ids.length) return Promise.resolve([]);
    pending = fetch(`${window.location.pathname}?sections=${ids.join(',')}&t=${Date.now()}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((sections) =>
        roots.map((root) => {
          const html = sections[sectionId(root)];
          if (!html) return root;
          const next = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-cart-root]');
          if (!next) return root;
          const inOpenDialog = Boolean(root.closest('dialog[open]'));
          const hadFocus = root.contains(document.activeElement) || (inOpenDialog && document.activeElement === document.body);
          root.replaceWith(next);
          if (hadFocus) (next.querySelector('[data-dialog-close]') || next.querySelector('.cart__keep') || next).focus();
          return next;
        }),
      )
      .catch(() => [])
      .finally(() => (pending = null));
    return pending;
  }

  /** Briefly highlights the newest line (Shopify lists the latest addition first). */
  function highlight(key) {
    if (!drawer || !key) return;
    const line = drawer.querySelector(`[data-cart-line="${CSS.escape(key)}"]`);
    if (!line) return;
    line.classList.remove('is-new');
    void line.offsetWidth;
    line.classList.add('is-new');
    window.setTimeout(() => line.classList.remove('is-new'), reducedMotion.matches ? 1200 : 1600);
  }

  let newestKey = null;
  document.addEventListener('cart:updated', (event) => {
    const items = (event.detail && event.detail.cart && event.detail.cart.items) || [];
    const pickupId = shared.config.pickup && shared.config.pickup.productId;
    const newest = items.find((item) => item.product_id !== pickupId);
    newestKey = newest ? newest.key : null;
    refresh();
  });

  async function openDrawer({ highlightNewest } = {}) {
    if (!drawer) return;
    if (pending) await pending;
    shared.openDialog(drawer);
    if (highlightNewest) highlight(newestKey);
  }

  // After add to cart: open the drawer instead of going to the cart page.
  document.addEventListener('cart:open', (event) => {
    if (!drawer) return;
    event.preventDefault();
    openDrawer({ highlightNewest: true });
  });

  document.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-cart-trigger]');
    if (trigger && drawer) {
      event.preventDefault();
      openDrawer();
      refresh(); // The page may have come from the back/forward cache.
      return;
    }

    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      event.preventDefault();
      const root = remove.closest('[data-cart-root]');
      root.setAttribute('aria-busy', 'true');
      try {
        await cart.removeLine(remove.dataset.cartRemove);
        if (pending) await pending;
        const roots = [...document.querySelectorAll('[data-cart-root]')];
        roots.forEach((r) => announce(r, shared.config.strings.cartRemoved || ''));
        const focusRoot = roots.find((r) => r.closest('[data-cart-drawer]') === remove.closest('[data-cart-drawer]'));
        if (focusRoot) (focusRoot.querySelector('[data-cart-remove]') || focusRoot.querySelector('.cart__keep') || focusRoot).focus();
      } catch (error) {
        root.removeAttribute('aria-busy');
        announce(root, error.message || shared.config.strings.error);
      }
    }
  });

  // Back/forward cache: the count and cart may be stale.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    fetch(shared.config.routes.cartJs, { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((data) => {
        document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = String(cart.visibleCount(data))));
        refresh();
      })
      .catch(() => {});
  });
})();
