/**
 * Order panel and help me order flow.
 *
 * Both are <dialog> elements opened with showModal(), which traps focus,
 * closes on Escape and returns focus to the trigger. Desktop panels sit under
 * the header; --header-bottom is set on open so they line up with it.
 *
 * Help me order steps: 1 which pie, 2 size, 3 pick up and date, 4 note,
 * 5 your order. "By the slice" skips the note step. Pick up dates follow the
 * Ordering theme settings; days whose pick up variant is sold out are full.
 */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* -------------------------------------------------------------------------
   * Dialog helpers
   * ----------------------------------------------------------------------- */
  function setHeaderBottom() {
    const header = document.querySelector('.header');
    const bottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    root.style.setProperty('--header-bottom', `${Math.round(bottom)}px`);
  }

  /** Pixels in one scale unit (--u), measured from the page. */
  function unit() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:calc(100 * var(--u))';
    document.body.append(probe);
    const u = probe.getBoundingClientRect().width / 100;
    probe.remove();
    return u || 1;
  }

  /**
   * Desktop: sit under the header when the panel fits there; otherwise lift it
   * just enough to fit the screen (never closer than 24 to the top). The home
   * masthead is tall, so this matters there. Mobile sheets fill the screen.
   */
  function placeDialog(dialog) {
    if (window.matchMedia('(max-width: 749px)').matches) {
      dialog.style.removeProperty('--panel-top');
      return;
    }
    const u = unit();
    const header = document.querySelector('.header');
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const wanted = dialog.matches('[data-hmo]') ? 780 * u : dialog.scrollHeight;
    const underHeader = headerBottom + 34 * u;
    const fits = window.innerHeight - wanted - 24 * u;
    const top = Math.max(24 * u, Math.min(underHeader, fits));
    dialog.style.setProperty('--panel-top', `${Math.round(top)}px`);
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    setHeaderBottom();
    dialog.showModal();
    placeDialog(dialog);
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    dialog.close();
  }

  function wireDialog(dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-dialog-close]')) {
        closeDialog(dialog);
        return;
      }
      // A click on the backdrop lands on the dialog itself, outside its box.
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
        if (!inside) closeDialog(dialog);
      }
    });
  }

  /* -------------------------------------------------------------------------
   * Order panel
   * ----------------------------------------------------------------------- */
  const orderPanel = document.querySelector('[data-order-panel]');
  const hmoDialog = document.querySelector('[data-hmo]');

  if (orderPanel) wireDialog(orderPanel);

  document.addEventListener('click', (event) => {
    const orderTrigger = event.target.closest('[data-order-trigger]');
    if (orderTrigger && orderPanel) {
      event.preventDefault();
      openDialog(orderPanel);
      return;
    }

    // Help me order: explicit triggers, plus any link to /pages/order (the
    // no-JavaScript fallback that buttons in the theme editor point at).
    const hmoTrigger =
      event.target.closest('[data-help-me-order-open]') ||
      event.target.closest('a[href$="/pages/order"], a[href*="/pages/order?"], a[href*="/pages/order#"]');
    if (hmoTrigger && hmoDialog && flow) {
      event.preventDefault();
      closeDialog(orderPanel);
      flow.open();
    }
  });

  /* -------------------------------------------------------------------------
   * Dates. Plain 'YYYY-MM-DD' strings, arithmetic in UTC so nothing shifts.
   * ----------------------------------------------------------------------- */
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
  const toIso = (date) => date.toISOString().slice(0, 10);
  const addDays = (iso, n) => {
    const d = toDate(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return toIso(d);
  };
  const weekday = (iso) => toDate(iso).getUTCDay();

  function nowIn(timeZone) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value])
    );
    return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  const longDate = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const monthName = new Intl.DateTimeFormat('en-AU', { month: 'long', timeZone: 'UTC' });
  const monthShort = new Intl.DateTimeFormat('en-AU', { month: 'short', timeZone: 'UTC' });
  const formatLong = (iso) => longDate.format(toDate(iso)).replace(',', '');

  /** Parse "order from 2026-12-01 to 2026-12-20, pick up 2026-12-23 2026-12-24". */
  function parseWindows(text) {
    return (text || '')
      .split('\n')
      .map((line) => {
        const range = line.match(/from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
        const pickup = line.split(/pick\s*up/i)[1] || '';
        const dates = pickup.match(/\d{4}-\d{2}-\d{2}/g) || [];
        return range && dates.length ? { from: range[1], to: range[2], dates } : null;
      })
      .filter(Boolean);
  }

  /** Builds the rules used by the calendar. */
  function makeRules(raw, pickup) {
    const closed = new Set(raw.closed || []);
    const blackout = new Set((raw.blackout || '').split(/\s+/).filter((d) => ISO.test(d)));
    const windows = parseWindows(raw.windows);
    const cutoffMatch = (raw.cutoff || '').match(/^(\d{1,2}):(\d{2})$/);
    const cutoff = cutoffMatch ? Number(cutoffMatch[1]) * 60 + Number(cutoffMatch[2]) : null;
    const hasCaps = pickup && pickup.productId && Object.keys(pickup.variants || {}).length > 0;

    const isOpenDay = (iso) => !closed.has(weekday(iso)) && !blackout.has(iso);

    function windowDates(today) {
      const open = new Set();
      windows.forEach((w) => {
        if (today >= w.from && today <= w.to) w.dates.forEach((d) => open.add(d));
      });
      return open;
    }

    /** Earliest pick up date: lead time in open days, plus one if past the cut-off. */
    function earliest(format) {
      const now = nowIn(raw.timezone);
      let lead = format === 'slice' ? raw.sliceLeadDays : raw.leadDays;
      if (cutoff !== null && now.minutes >= cutoff) lead += 1;
      let day = now.date;
      // With no lead time, today counts if the shop is open.
      if (lead === 0) {
        while (!isOpenDay(day)) day = addDays(day, 1);
        return day;
      }
      while (lead > 0) {
        day = addDays(day, 1);
        if (isOpenDay(day)) lead -= 1;
      }
      return day;
    }

    /** 'available' | 'full' | 'unavailable' */
    function status(iso, format) {
      const now = nowIn(raw.timezone);
      const last = addDays(now.date, raw.horizonDays);
      const preorder = windowDates(now.date);
      const inWindow = preorder.has(iso);
      if (iso > last && !inWindow) return 'unavailable';
      if (!inWindow) {
        if (iso < earliest(format) || !isOpenDay(iso)) return 'unavailable';
      } else if (iso < now.date) {
        return 'unavailable';
      }
      // The cap counts whole pies only; slices come from the counter's stock.
      if (hasCaps && format !== 'slice') {
        const v = pickup.variants[iso];
        if (!v) return 'unavailable';
        if (!v.available) return 'full';
      }
      return 'available';
    }

    return { status, earliest, today: () => nowIn(raw.timezone).date, horizon: () => addDays(nowIn(raw.timezone).date, raw.horizonDays) };
  }

  /* -------------------------------------------------------------------------
   * Help me order flow
   * ----------------------------------------------------------------------- */
  const flow = hmoDialog ? createFlow(hmoDialog) : null;
  if (hmoDialog) wireDialog(hmoDialog);

  function createFlow(dialog) {
    const config = JSON.parse(dialog.parentElement.querySelector('[data-hmo-config]')?.textContent || '{}');
    const s = config.strings;
    let rules = makeRules(config.rules, config.pickup);
    const $ = (sel) => dialog.querySelector(sel);
    const $$ = (sel) => [...dialog.querySelectorAll(sel)];
    const fill = (template, values) => template.replace(/\[(\w+)\]/g, (_, k) => (k in values ? values[k] : ''));

    const state = { step: 1, productId: null, format: null, date: null, note: '', month: null, busy: false };

    const product = () => config.products.find((p) => p.id === state.productId);
    const variantFor = (p, format) => {
      if (!p) return null;
      const match = (v, word) => (v.format || '').toLowerCase().includes(word);
      if (format === 'slice') return p.variants.find((v) => match(v, 'slice')) || null;
      return p.variants.find((v) => match(v, 'whole')) || (p.variants.length === 1 ? p.variants[0] : null);
    };
    const variant = () => variantFor(product(), state.format);
    const steps = () => (state.format === 'slice' ? [1, 2, 3, 5] : [1, 2, 3, 4, 5]);

    /* ---- Rendering ---- */
    function renderChrome(direction) {
      const order = steps();
      const position = order.indexOf(state.step) + 1;
      dialog.dataset.step = state.step;
      dialog.style.setProperty('--hmo-progress', position / order.length);
      $('[data-hmo-count]').textContent = fill(s.progress, { current: position, total: order.length });
      $('[data-hmo-title]').textContent = s.titles[state.step - 1];

      $$('[data-hmo-step]').forEach((panel) => {
        const active = Number(panel.dataset.hmoStep) === state.step;
        panel.hidden = !active;
        panel.classList.remove('is-entering-next', 'is-entering-back');
        if (active && direction && !reducedMotion.matches) {
          void panel.offsetWidth;
          panel.classList.add(direction === 'back' ? 'is-entering-back' : 'is-entering-next');
        }
      });

      const next = $('[data-hmo-next]');
      next.disabled =
        (state.step === 1 && !state.productId) ||
        (state.step === 2 && !variant()) ||
        (state.step === 3 && !state.date);
    }

    function renderTiles() {
      $$('.hmo-tile').forEach((tile) => {
        tile.setAttribute('aria-pressed', String(Number(tile.dataset.productId) === state.productId));
      });
    }

    function renderSizes() {
      const p = product();
      const list = $('[data-hmo-sizes]');
      list.textContent = '';
      if (!p) return;
      [
        ['whole', config.formats.whole, config.formats.wholeNote],
        ['slice', config.formats.slice, config.formats.sliceNote],
      ].forEach(([format, label, note]) => {
        const v = variantFor(p, format);
        if (!v) return;
        const pressed = state.format === format;
        const li = document.createElement('li');
        li.innerHTML = `
          <button type="button" class="hmo-size" aria-pressed="${pressed}" ${v.available ? '' : 'disabled'} data-format="${format}">
            <span class="hmo-size__text">
              <span class="hmo-size__label"></span>
              <span class="hmo-size__note"><span></span><span class="hmo-size__price-inline"></span></span>
            </span>
            <span class="hmo-size__right">
              <span class="hmo-size__price"></span>
              <span class="button ${pressed ? '' : 'button--outline'}" aria-hidden="true"></span>
            </span>
          </button>`;
        li.querySelector('.hmo-size__label').textContent = label;
        li.querySelector('.hmo-size__note > span').textContent = note;
        li.querySelector('.hmo-size__price-inline').textContent = v.price;
        li.querySelector('.hmo-size__price').textContent = v.price;
        li.querySelector('.button').textContent = pressed ? s.chosen : s.choose;
        list.append(li);
      });
    }

    function renderInfo() {
      const lead = config.rules.leadDays;
      const template =
        state.format === 'slice' ? s.sliceInfo : lead === 0 ? s.leadInfoNone : lead === 1 ? s.leadInfoOne : s.leadInfo;
      $('[data-hmo-info]').textContent = fill(template, { address: config.rules.address, days: lead });
    }

    function renderCalendar() {
      if (!state.month) state.month = (state.date || rules.earliest(state.format)).slice(0, 8) + '01';
      const first = state.month;
      const grid = $('[data-hmo-grid]');
      const prev = $('[data-hmo-prev]');
      const nextMonth = $('[data-hmo-next-month]');
      const prevMonth = addDays(first, -1).slice(0, 8) + '01';
      const following = addDays(addDays(first, 31).slice(0, 8) + '01', 0);

      $('[data-hmo-month]').textContent = monthName.format(toDate(first));
      prev.textContent = monthShort.format(toDate(prevMonth));
      nextMonth.textContent = monthShort.format(toDate(following));
      prev.setAttribute('aria-label', fill(s.monthPrev, { month: monthName.format(toDate(prevMonth)) }));
      nextMonth.setAttribute('aria-label', fill(s.monthNext, { month: monthName.format(toDate(following)) }));
      prev.disabled = first <= rules.today().slice(0, 8) + '01';
      nextMonth.disabled = following > rules.horizon();

      grid.textContent = '';
      const offset = (weekday(first) + 6) % 7; // Monday first
      for (let i = 0; i < offset; i += 1) grid.append(document.createElement('span'));

      let day = first;
      while (day.slice(0, 7) === first.slice(0, 7)) {
        const status = rules.status(day, state.format);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `hmo-day hmo-day--${status}`;
        button.textContent = String(Number(day.slice(8)));
        button.dataset.date = day;
        button.disabled = status !== 'available';
        button.setAttribute('aria-pressed', String(state.date === day));
        const label = status === 'available' ? s.dayAvailable : status === 'full' ? s.dayFull : s.dayUnavailable;
        button.setAttribute('aria-label', `${formatLong(day)}, ${label}`);
        grid.append(button);
        day = addDays(day, 1);
      }
    }

    function renderNote() {
      const field = $('[data-hmo-note]');
      if (field.value !== state.note) field.value = state.note;
      $('[data-hmo-note-count]').textContent = String(field.value.length);
    }

    function renderReview() {
      const p = product();
      const v = variant();
      if (!p || !v) return;
      const sizeLabel = state.format === 'slice' ? config.formats.slice : config.formats.whole;
      $('[data-hmo-review="pie"]').textContent = fill(s.pieSize, { pie: p.title, size: sizeLabel.toLowerCase() });
      const dateCell = $('[data-hmo-review="date"]');
      dateCell.textContent = state.date ? formatLong(state.date) : '';
      if (state.date) {
        const where = document.createElement('span');
        where.className = 'hmo-review__where';
        where.textContent = `, ${config.rules.address.split(',')[0]}`;
        dateCell.append(where);
      }
      $('[data-hmo-review="note"]').textContent = state.note || s.noNote;
      $$('[data-hmo-review="total"]').forEach((el) => (el.textContent = v.price));
      const image = $('[data-hmo-review-image]');
      if (p.image) {
        image.src = p.image;
        image.hidden = false;
      } else {
        image.hidden = true;
      }
      const slice = state.format === 'slice';
      $('[data-hmo-review-note-row]').hidden = slice;
      $('.hmo-review__note-rule').hidden = slice;
      $('[data-hmo-conflict]').hidden = true;
    }

    function render(direction) {
      if (state.step === 1) renderTiles();
      if (state.step === 2) renderSizes();
      if (state.step === 3) {
        renderInfo();
        renderCalendar();
      }
      if (state.step === 4) renderNote();
      if (state.step === 5) renderReview();
      renderChrome(direction);
    }

    function go(step, direction) {
      state.step = step;
      render(direction);
      $('[data-hmo-title]').focus({ preventScroll: true });
    }

    function nextStep() {
      const order = steps();
      const i = order.indexOf(state.step);
      if (i < order.length - 1) go(order[i + 1], 'next');
    }

    function prevStep() {
      const order = steps();
      const i = order.indexOf(state.step);
      if (i > 0) go(order[i - 1], 'back');
      else closeDialog(dialog);
    }

    function announce(message) {
      const status = $('[data-hmo-status]');
      status.textContent = '';
      requestAnimationFrame(() => (status.textContent = message));
    }

    /* ---- Cart ---- */
    async function json(url, body) {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message || s.error);
      return data;
    }

    const isPickupLine = (item) => config.pickup.productId && item.product_id === config.pickup.productId;
    /** A whole pie line: Format property or variant option says whole pie. */
    const isWholePie = (item) => {
      if (isPickupLine(item)) return false;
      const format =
        (item.properties && item.properties.Format) ||
        (item.options_with_values || []).map((o) => o.value).join(' ') ||
        item.variant_title ||
        '';
      return format.toLowerCase().includes('whole');
    };
    const visibleCount = (cart) => cart.items.reduce((n, item) => (isPickupLine(item) ? n : n + item.quantity), 0);

    /** Returns the cart's existing pick up date if it differs from ours. */
    async function conflictingDate() {
      const cart = await json(config.routes.cartJs);
      const existing = cart.attributes && cart.attributes['Pick up date'];
      const hasPies = cart.items.some((item) => !isPickupLine(item));
      return hasPies && existing && existing !== state.date ? existing : null;
    }

    function askConflict(existing) {
      return new Promise((resolve) => {
        const box = $('[data-hmo-conflict]');
        $('[data-hmo-conflict-text]').textContent = fill(s.conflict, { date: formatLong(existing) });
        box.hidden = false;
        box.querySelector('[data-hmo-conflict="use"]').focus();
        const onClick = (event) => {
          const choice = event.target.closest('[data-hmo-conflict]');
          if (!choice) return;
          box.removeEventListener('click', onClick);
          box.hidden = true;
          resolve(choice.dataset.hmoConflict);
        };
        box.addEventListener('click', onClick);
      });
    }

    async function addToCart(mode) {
      if (state.busy) return;
      const v = variant();
      if (!v || !state.date) return;
      state.busy = true;
      dialog.setAttribute('aria-busy', 'true');
      try {
        const existing = await conflictingDate();
        if (existing) {
          const choice = await askConflict(existing);
          if (choice === 'keep') state.date = existing;
        }

        const cart = await json(config.routes.cartJs);
        const pickupVariant = config.pickup.variants[state.date];
        const adding = state.format === 'slice' ? 0 : 1;
        const wholePies = cart.items.reduce((n, item) => (isWholePie(item) ? n + item.quantity : n), 0) + adding;

        // The pick up line counts whole pies (slices do not count toward the cap).
        // Set it before adding the pie, so a full day is refused before the pie goes in.
        for (const item of cart.items) {
          if (!isPickupLine(item)) continue;
          const isThisDate = pickupVariant && item.variant_id === pickupVariant.id;
          if (!isThisDate) await json(config.routes.change, { id: item.key, quantity: 0 });
        }
        if (pickupVariant) {
          const line = cart.items.find((item) => item.variant_id === pickupVariant.id);
          if (line && line.quantity !== wholePies) {
            await json(config.routes.change, { id: line.key, quantity: wholePies });
          } else if (!line && wholePies > 0) {
            await json(config.routes.add, { items: [{ id: pickupVariant.id, quantity: wholePies }] });
          }
        }

        const properties = {
          Format: state.format === 'slice' ? config.formats.slice : config.formats.whole,
          'Pick up': formatLong(state.date),
        };
        if (state.format !== 'slice' && state.note.trim()) properties.Note = state.note.trim();

        await json(config.routes.add, { items: [{ id: v.id, quantity: 1, properties }] });
        const updated = await json(config.routes.update, { attributes: { 'Pick up date': state.date } });

        document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = String(visibleCount(updated))));
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: updated } }));

        if (mode === 'another') {
          state.productId = null;
          state.format = null;
          state.note = '';
          go(1, 'back');
          announce(s.addedAnother);
        } else {
          announce(s.added);
          closeDialog(dialog);
          const opened = document.dispatchEvent(new CustomEvent('cart:open', { cancelable: true }));
          // Until the cart drawer exists, go to the cart page.
          if (opened && !document.querySelector('[data-cart-drawer]')) window.location.href = config.routes.cart;
        }
      } catch (error) {
        announce(error.message || s.error);
        $('[data-hmo-status]').classList.remove('visually-hidden');
      } finally {
        state.busy = false;
        dialog.removeAttribute('aria-busy');
      }
    }

    /* ---- Events ---- */
    dialog.addEventListener('click', (event) => {
      const tile = event.target.closest('.hmo-tile');
      if (tile) {
        state.productId = Number(tile.dataset.productId);
        const p = product();
        if (!variantFor(p, state.format)) state.format = null;
        if (!state.format) {
          if (variantFor(p, 'whole')) state.format = 'whole';
          else if (variantFor(p, 'slice')) state.format = 'slice';
        }
        render();
        return;
      }
      const size = event.target.closest('.hmo-size');
      if (size) {
        state.format = size.dataset.format;
        state.month = null;
        if (state.date && rules.status(state.date, state.format) !== 'available') state.date = null;
        render();
        return;
      }
      const day = event.target.closest('.hmo-day');
      if (day && !day.disabled) {
        state.date = day.dataset.date;
        render();
        return;
      }
      if (event.target.closest('[data-hmo-prev]')) {
        state.month = addDays(state.month, -1).slice(0, 8) + '01';
        renderCalendar();
        return;
      }
      if (event.target.closest('[data-hmo-next-month]')) {
        state.month = addDays(state.month, 31).slice(0, 8) + '01';
        renderCalendar();
        return;
      }
      if (event.target.closest('[data-hmo-next]')) return nextStep();
      if (event.target.closest('[data-hmo-back]')) return prevStep();
      if (event.target.closest('[data-hmo-skip]')) {
        state.note = '';
        return go(5, 'next');
      }
      const goto = event.target.closest('[data-hmo-goto]');
      if (goto) return go(Number(goto.dataset.hmoGoto), 'back');
      const add = event.target.closest('[data-hmo-add]');
      if (add) addToCart(add.dataset.hmoAdd);
    });

    $('[data-hmo-note]').addEventListener('input', (event) => {
      state.note = event.target.value;
      $('[data-hmo-note-count]').textContent = String(state.note.length);
    });

    render();

    return {
      open() {
        if (state.step === 5) state.step = 1;
        render();
        openDialog(dialog);
        $('[data-hmo-title]').focus({ preventScroll: true });
      },
      /** For previews only: swap in sample products and pick up days. */
      _preview(sample) {
        Object.assign(config, sample);
        rules = makeRules(config.rules, config.pickup);
        render();
      },
    };
  }

  window.Cakehouse = Object.assign(window.Cakehouse || {}, { helpMeOrder: flow });
})();
