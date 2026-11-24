/**
 * Header behaviour:
 * - Open/closed status from Theme settings › Opening hours, in
 *   Australia/Sydney time, rechecked every minute.
 * - --header-height on the root, used by the home hero to fill the window.
 * - Desktop: the compact bar slides in once the header has scrolled away.
 */
(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  if (!header) return;

  /* ---- Header height for the hero ---- */
  const setHeight = () => root.style.setProperty('--header-height', `${Math.round(header.offsetHeight)}px`);
  setHeight();
  if ('ResizeObserver' in window) new ResizeObserver(setHeight).observe(header);

  /* ---- Sticky bar ----
   * Desktop: the compact bar shows whenever the header has scrolled away.
   * Mobile (below 750): a slim nav bar that shows once the header has
   * scrolled away, hides while scrolling down and slides in when scrolling
   * up; it stays shown while the order panel or the cart is open. */
  const sticky = document.querySelector('[data-header-sticky]');
  const desktop = window.matchMedia('(min-width: 750px)');
  if (sticky && 'IntersectionObserver' in window) {
    let headerGone = false;
    let scrollingUp = false;
    let lastY = window.scrollY;
    const panelOpen = () => Boolean(document.querySelector('[data-order-panel][open], [data-cart-drawer][open]'));
    const update = () => {
      const on = headerGone && (desktop.matches || scrollingUp || panelOpen());
      sticky.classList.toggle('is-visible', on);
      sticky.toggleAttribute('inert', !on);
      sticky.setAttribute('aria-hidden', String(!on));
    };
    new IntersectionObserver(([entry]) => {
      headerGone = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
      update();
    }).observe(header);
    desktop.addEventListener('change', update);

    // Scroll direction, with a little slack so small jitters don't flicker it.
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          if (Math.abs(y - lastY) < 6) return;
          scrollingUp = y < lastY;
          lastY = y;
          update();
        });
      },
      { passive: true },
    );

    // Opening or closing the order panel or the cart.
    const watch = new MutationObserver(update);
    document.querySelectorAll('[data-order-panel], [data-cart-drawer]').forEach((d) => watch.observe(d, { attributes: true, attributeFilter: ['open'] }));
  }

  /* ---- Open / closed status ---- */
  const statusEl = header.querySelector('[data-open-status]');
  const configEl = header.parentElement.querySelector('[data-opening-hours]');
  if (!statusEl || !configEl) return;
  const config = JSON.parse(configEl.textContent);
  const textEl = statusEl.querySelector('[data-open-status-text]');
  const fill = (t, v) => t.replace(/\[(\w+)\]/g, (_, k) => v[k] ?? '');

  const minutes = (hhmm) => {
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(hhmm || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const hoursFor = (weekday) => {
    const d = config.days[weekday];
    const open = minutes(d.open);
    const close = minutes(d.close);
    return d.closed || open === null || close === null ? null : { open, close };
  };
  // 8:00 → "8am", 8:30 → "8:30am", 13:00 → "1pm"
  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${suffix}`;
  };
  const weekdayName = new Intl.DateTimeFormat('en-AU', { weekday: 'long', timeZone: 'UTC' });

  function now() {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-AU', {
        timeZone: config.timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value])
    );
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { weekday, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  function update() {
    // No hours set at all: leave the status line out.
    if (![0, 1, 2, 3, 4, 5, 6].some((d) => hoursFor(d))) {
      statusEl.hidden = true;
      return;
    }
    const { weekday, minutes: t } = now();
    const today = hoursFor(weekday);
    const s = config.strings;
    let open = false;
    let text = s.closed;

    if (today && t >= today.open && t < today.close) {
      open = true;
      text = config.nowBaking ? s.nowBakingOpen : s.open;
    } else if (today && t < today.open) {
      text = fill(s.closedToday, { time: formatTime(today.open) });
    } else {
      for (let i = 1; i <= 7; i += 1) {
        const day = (weekday + i) % 7;
        const hours = hoursFor(day);
        if (!hours) continue;
        // 2023-01-01 was a Sunday; use it to name the weekday.
        const name = weekdayName.format(new Date(Date.UTC(2023, 0, 1 + day))).toLowerCase();
        text = fill(i === 1 ? s.closedTomorrow : s.closedDay, { day: name, time: formatTime(hours.open) });
        break;
      }
    }

    statusEl.classList.toggle('is-open', open);
    statusEl.classList.toggle('is-closed', !open);
    textEl.textContent = text;
    statusEl.hidden = false;
  }

  update();
  // Recheck on the minute.
  setTimeout(() => {
    update();
    setInterval(update, 60000);
  }, (60 - new Date().getSeconds()) * 1000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && update());
})();
