/**
 * Product page buy block.
 *
 * Format (whole pie or by the slice), pick up date, handwritten note (whole
 * pies only), sold out, and add to cart. The date rules, the calendar and the
 * cart logic are shared with help me order (window.Cakehouse.order, from
 * assets/order.js), so both follow the same lead times, closed days, caps and
 * single pick up date per order.
 */
(() => {
  const root = document.querySelector('[data-product-buy]');
  const shared = window.Cakehouse && window.Cakehouse.order;
  if (!root || !shared) return;

  const data = JSON.parse(root.querySelector('[data-product-json]').textContent);
  const config = shared.config;
  const st = { ...config.strings, ...data.strings };
  const cart = shared.createCart(config);
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];

  const state = {
    format: root.dataset.format || (data.variants.whole ? 'whole' : 'slice'),
    date: null,
    note: '',
    method: shared.method ? shared.method.get() : 'pickup',
    qty: 1,
    month: null,
    busy: false,
  };
  const MAX_QTY = 20;

  /** Formats cents with the shop's money format, e.g. ${{amount}}. */
  function money(cents) {
    const format = data.moneyFormat || '${{amount}}';
    const value = (cents / 100).toFixed(2);
    const withCommas = (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      if (key === 'amount_no_decimals') return withCommas(String(Math.round(cents / 100)));
      if (key === 'amount_with_comma_separator') return value.replace('.', ',');
      return withCommas(value.split('.')[0]) + '.' + value.split('.')[1];
    });
  }

  /** "midday", "midnight" or a time like "2pm" / "2:30pm" from the HH:MM cut-off. */
  function cutoffText() {
    const m = String(config.rules.cutoff || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return '';
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h === 12 && min === 0) return st.midday;
    if (h === 0 && min === 0) return st.midnight;
    const hour12 = h % 12 || 12;
    return `${hour12}${min ? ':' + m[2] : ''}${h < 12 ? 'am' : 'pm'}`;
  }
  const rules = () => shared.makeRules(config.rules, config.pickup);
  /** The method in effect: slices are pick up only. */
  const how = () => (shared.method ? shared.method.forFormat(state.method, state.format) : 'pickup');
  const statusOf = (iso) => rules().status(iso, state.format, { preorder: Boolean(data.preorder), method: how() });
  const variant = () => data.variants[state.format];

  const noteField = $('[data-product-note]');
  const hmoNote = document.querySelector('[data-hmo-note]');
  const noteMax = (hmoNote && hmoNote.maxLength > 0 && hmoNote.maxLength) || 60;
  noteField.maxLength = noteMax;
  $('[data-product-note-max]').textContent = String(noteMax);

  function announce(message) {
    const status = $('[data-product-status]');
    status.textContent = '';
    requestAnimationFrame(() => (status.textContent = message));
  }

  /* ---- Rendering ---- */
  function render() {
    root.dataset.format = state.format;
    const v = variant();

    // Format chips.
    $$('[data-product-format]').forEach((chip) => {
      const on = chip.dataset.productFormat === state.format;
      chip.setAttribute('aria-pressed', String(on));
      chip.classList.toggle('button--outline', !on);
      const cv = data.variants[chip.dataset.productFormat];
      chip.disabled = !cv;
    });

    // Add to cart, or sold out. Pre order pies can only be bought while a window is open.
    const preorderClosed = data.preorder && !rules().firstPreorder();
    const available = Boolean(v && v.available) && !preorderClosed;
    $('[data-product-add]').hidden = !available;
    $('[data-product-sold-out]').hidden = available;
    if (v) {
      $('[data-product-unit-price]').textContent = v.price;
      $$('[data-product-price]').forEach((el) => (el.textContent = money(v.cents * state.qty)));
    }
    $('[data-qty-value]').textContent = String(state.qty);
    $('[data-qty-step="-1"]').disabled = state.qty <= 1;
    $('[data-qty-step="1"]').disabled = state.qty >= MAX_QTY;
    updateBar();

    // Pick up line under the description.
    const lead = config.rules.leadDays;
    let template =
      state.format === 'slice' ? st.infoSlice : lead === 0 ? st.infoWholeNone : lead === 1 ? st.infoWholeOne : st.infoWhole;
    if (data.preorder) template = preorderClosed ? st.infoPreorderSoon : st.infoPreorder;
    const time = cutoffText();
    const before = time ? shared.fill(st.before, { time }) : '';
    $('[data-product-info]').textContent = shared.fill(template, { address: config.rules.address, days: lead, before });

    // Pick up or delivery; slices lock to pick up.
    $$('[data-product-method]').forEach((b) => {
      const on = b.dataset.productMethod === how();
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('button--outline', !on);
      b.disabled = b.dataset.productMethod === 'delivery' && state.format === 'slice';
    });
    $$('[data-help-me-order-open]').forEach((b) => (b.dataset.method = how()));

    // Date button shows the chosen day.
    $('[data-product-date-open]').textContent = state.date ? shared.formatLong(state.date) : st.choose;

    // The note is for whole pies only.
    const noteRow = $('[data-product-note-row]');
    noteRow.hidden = state.format === 'slice';
    $('[data-product-note-toggle]').textContent = state.note.trim() ? st.editNote : st.addNote;

    // The help me order prompt opens with this pie and format chosen.
    $$('[data-help-me-order-open]').forEach((b) => (b.dataset.format = state.format));
  }

  /* ---- Mobile: slim add to cart bar while the main button is out of view ---- */
  const bar = $('[data-product-bar]');
  const mainAdd = $('[data-product-add]');
  const mobile = window.matchMedia('(max-width: 749px)');
  let mainInView = true;
  function updateBar() {
    if (!bar) return;
    const v = variant();
    const show = mobile.matches && !mainInView && Boolean(v && v.available);
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    bar.setAttribute('aria-hidden', String(!show));
  }
  if (bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      mainInView = entry.isIntersecting;
      updateBar();
    }).observe(mainAdd);
    mobile.addEventListener('change', updateBar);
  }

  /* ---- Desktop: keep the buy column in view while the gallery scrolls ----
   * The column is sticky under the header. When it is taller than the window
   * it pins by its foot instead, so every row can still be reached. */
  const main = $('.product-buy__main');
  function pinColumn() {
    if (mobile.matches) {
      root.style.removeProperty('--buy-top');
      return;
    }
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const top = Math.min(header, window.innerHeight - main.offsetHeight);
    root.style.setProperty('--buy-top', `${Math.round(top)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(pinColumn).observe(main);
  window.addEventListener('resize', pinColumn);
  mobile.addEventListener('change', pinColumn);
  pinColumn();

  /* ---- Date panel ---- */
  const panel = $('[data-product-date-panel]');
  shared.wireDialog(panel);

  function renderCalendar() {
    const r = rules();
    if (!state.month) state.month = shared.firstOfMonth(state.date || (data.preorder && r.firstPreorder()) || r.earliest(state.format));
    const lead = config.rules.leadDays;
    let info =
      state.format === 'slice' ? st.sliceInfo : lead === 0 ? st.leadInfoNone : lead === 1 ? st.leadInfoOne : st.leadInfo;
    if (how() === 'delivery') info = st.deliveryInfo;
    const note = (config.rules.delivery && config.rules.delivery.note) || '';
    $('[data-product-date-info]').textContent = shared.fill(info, { address: config.rules.address, days: lead, note, full: config.rules.useCaps ? st.fullNote : '' });
    shared.renderMonth({
      grid: $('[data-product-grid]'),
      nameEl: $('[data-product-month]'),
      prevBtn: $('[data-product-prev]'),
      nextBtn: $('[data-product-next]'),
      month: state.month,
      rules: r,
      format: state.format,
      preorder: Boolean(data.preorder),
      method: how(),
      selected: state.date,
      strings: st,
    });
  }

  function openDates() {
    renderCalendar();
    shared.openDialog(panel);
  }

  panel.addEventListener('click', (event) => {
    const day = event.target.closest('.hmo-day');
    if (day && !day.disabled) {
      state.date = day.dataset.date;
      announce('');
      shared.closeDialog(panel);
      render();
      $('[data-product-date-open]').focus();
      return;
    }
    if (event.target.closest('[data-product-prev]')) {
      state.month = shared.firstOfMonth(shared.addDays(state.month, -1));
      renderCalendar();
    }
    if (event.target.closest('[data-product-next]')) {
      state.month = shared.firstOfMonth(shared.addDays(state.month, 31));
      renderCalendar();
    }
  });

  /* ---- Conflict: one pick up date per order ---- */
  function askConflict(existing) {
    return new Promise((resolve) => {
      const box = $('[data-product-conflict]');
      $('[data-product-conflict-text]').textContent = shared.fill(st.conflict, { date: shared.formatLong(existing) });
      box.hidden = false;
      box.querySelector('[data-product-conflict-choice="use"]').focus();
      const onClick = (event) => {
        const choice = event.target.closest('[data-product-conflict-choice]');
        if (!choice) return;
        box.removeEventListener('click', onClick);
        box.hidden = true;
        resolve(choice.dataset.productConflictChoice);
      };
      box.addEventListener('click', onClick);
    });
  }

  /* ---- Add to cart ---- */
  async function add() {
    const v = variant();
    if (state.busy || !v || !v.available) return;
    if (!state.date) {
      announce(st.needDate);
      openDates();
      return;
    }
    state.busy = true;
    root.setAttribute('aria-busy', 'true');
    try {
      const result = await cart.addPie({
        variantId: v.id,
        format: state.format,
        date: state.date,
        note: state.note,
        quantity: state.qty,
        method: how(),
        resolveConflict: askConflict,
      });
      state.date = result.date;
      render();
      announce(st.added);
      cart.showCart();
    } catch (error) {
      announce(error.message || st.error);
    } finally {
      state.busy = false;
      root.removeAttribute('aria-busy');
    }
  }

  /* ---- Events ---- */
  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-product-format]');
    if (chip && !chip.disabled) {
      state.format = chip.dataset.productFormat;
      state.month = null;
      // A date that is fine for slices may be full for whole pies.
      if (state.date && statusOf(state.date) !== 'available') state.date = null;
      render();
      return;
    }
    if (event.target.closest('[data-product-date-open]')) return openDates();
    const methodButton = event.target.closest('[data-product-method]');
    if (methodButton && !methodButton.disabled) {
      state.method = shared.method.set(methodButton.dataset.productMethod);
      state.month = null;
      if (state.date && statusOf(state.date) !== 'available') state.date = null;
      render();
      return;
    }
    const step = event.target.closest('[data-qty-step]');
    if (step && !step.disabled) {
      state.qty = Math.min(MAX_QTY, Math.max(1, state.qty + Number(step.dataset.qtyStep)));
      render();
      return;
    }
    const toggle = event.target.closest('[data-product-note-toggle]');
    if (toggle) {
      const box = $('#ProductNote');
      const open = box.hidden;
      box.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) noteField.focus();
      return;
    }
    if (event.target.closest('[data-product-add], [data-product-bar-add]')) add();
  });

  noteField.addEventListener('input', () => {
    state.note = noteField.value;
    $('[data-product-note-count]').textContent = String(state.note.length);
    $('[data-product-note-toggle]').textContent = state.note.trim() ? st.editNote : st.addNote;
  });

  // Help me order on the same page can change the method too.
  document.addEventListener('method:change', (event) => {
    if (event.detail.method === state.method) return;
    state.method = event.detail.method;
    if (state.date && statusOf(state.date) !== 'available') state.date = null;
    render();
  });

  render();

  // For checks: read the block's state.
  root.productState = () => ({ ...state });
})();
