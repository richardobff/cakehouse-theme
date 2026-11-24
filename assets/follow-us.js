/**
 * Follow us strip: drifts slowly to the left as a continuous loop (about 30
 * seconds per cycle of tiles). It pauses on hover, touch and keyboard focus,
 * and can be scrolled, swiped or dragged by hand. With reduced motion it
 * stays still and scrolls by hand only.
 *
 * The loop works by cloning the tiles after the originals (clones are inert
 * and hidden from assistive tech) and wrapping the scroll position by one
 * set's width.
 */
(() => {
  const CYCLE_SECONDS = 30;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-strip]').forEach((strip) => {
    const track = strip.querySelector('[data-strip-track]');
    const originals = [...track.children];
    if (!originals.length) return;

    let setWidth = 0;
    let pos = 0;
    let lastTime = null;
    let selfScroll = false;
    let inView = true;
    const paused = new Set();
    const timers = {};

    /* ---- Layout: one set's width, and enough clones to fill the view ---- */
    function layout() {
      track.querySelectorAll('[data-strip-clone]').forEach((el) => el.remove());
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const first = originals[0].getBoundingClientRect();
      const last = originals[originals.length - 1].getBoundingClientRect();
      setWidth = last.right - first.left + gap;
      const copies = Math.max(1, Math.ceil((strip.clientWidth + setWidth) / setWidth));
      for (let c = 0; c < copies; c += 1) {
        originals.forEach((tile) => {
          const clone = tile.cloneNode(true);
          clone.setAttribute('data-strip-clone', '');
          clone.setAttribute('aria-hidden', 'true');
          clone.inert = true;
          track.append(clone);
        });
      }
      pos = wrap(strip.scrollLeft);
      setScroll(pos);
    }

    const wrap = (x) => {
      if (setWidth <= 0) return x;
      let v = x % setWidth;
      if (v < 0) v += setWidth;
      return v;
    };

    function setScroll(x) {
      selfScroll = true;
      strip.scrollLeft = x;
    }

    /* ---- Drift ---- */
    function tick(time) {
      const dt = lastTime === null ? 0 : Math.min(time - lastTime, 100);
      lastTime = time;
      // Focus anywhere in the strip pauses it, even if no focus event fired.
      const focused = strip.matches(':focus-within');
      const moving = !reducedMotion.matches && !paused.size && !focused && inView && !document.hidden && setWidth > 0;
      if (moving) {
        pos = wrap(pos + (setWidth / CYCLE_SECONDS) * (dt / 1000));
        setScroll(pos);
      }
      requestAnimationFrame(tick);
    }

    // Hand scrolling (wheel, swipe, keyboard, drag): follow it and keep the loop seamless.
    strip.addEventListener(
      'scroll',
      () => {
        if (selfScroll) {
          selfScroll = false;
          return;
        }
        const x = strip.scrollLeft;
        const wrapped = wrap(x);
        if (Math.abs(wrapped - x) > 1 && setWidth > 0) setScroll(wrapped);
        pos = wrapped;
      },
      { passive: true }
    );

    /* ---- Pausing ---- */
    const pause = (reason) => {
      clearTimeout(timers[reason]);
      paused.add(reason);
    };
    const resume = (reason, delay = 0) => {
      clearTimeout(timers[reason]);
      timers[reason] = setTimeout(() => paused.delete(reason), delay);
    };

    strip.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && pause('hover'));
    strip.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && resume('hover'));
    strip.addEventListener('focusin', () => pause('focus'));
    strip.addEventListener('focusout', () => {
      if (!strip.contains(document.activeElement)) resume('focus');
    });
    strip.addEventListener('touchstart', () => pause('touch'), { passive: true });
    strip.addEventListener('touchend', () => resume('touch', 2500), { passive: true });
    strip.addEventListener('wheel', () => {
      pause('wheel');
      resume('wheel', 1500);
    }, { passive: true });

    /* ---- Mouse drag ---- */
    let drag = null;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, lastX: e.clientX, moved: false };
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) {
        drag.moved = true;
        strip.classList.add('is-dragging');
      }
      // Relative moves, so a loop wrap mid-drag does not jump.
      if (drag.moved) strip.scrollLeft -= e.clientX - drag.lastX;
      drag.lastX = e.clientX;
    });
    const endDrag = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      strip.classList.remove('is-dragging');
      // A drag should not also open the post under the pointer.
      if (moved) strip.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true });
    };
    strip.addEventListener('pointerup', endDrag);
    strip.addEventListener('pointercancel', endDrag);

    /* ---- Only drift while on screen ---- */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
      }).observe(strip);
    }

    // Re-measure when the size changes or images load.
    let resizeTimer;
    const relayout = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    };
    window.addEventListener('resize', relayout);
    if (document.fonts) document.fonts.ready.then(layout);

    layout();
    requestAnimationFrame(tick);

    // For checks: lets a test read the strip's state.
    strip.stripState = () => ({ pos, setWidth, paused: [...paused], reduced: reducedMotion.matches });
  });
})();
