(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Header
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  // Header links: one highlight slides to whichever link is hovered
  const links = $('.nav-links');
  if (links && matchMedia('(hover: hover)').matches) {
    const pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    links.prepend(pill);
    $$('a', links).forEach(a => a.addEventListener('pointerenter', () => {
      // first hover places the pill without sliding in from the last spot
      const fresh = !links.classList.contains('has-pill');
      if (fresh) pill.style.transitionProperty = 'opacity';
      links.style.setProperty('--pill-x', `${a.offsetLeft}px`);
      links.style.setProperty('--pill-w', `${a.offsetWidth}px`);
      if (fresh) { void pill.offsetWidth; pill.style.transitionProperty = ''; }
      links.classList.add('has-pill');
    }));
    links.addEventListener('pointerleave', () => links.classList.remove('has-pill'));
  }

  // Header: a soft glow follows the cursor (pointer devices, motion allowed)
  if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    let frame = 0;
    // the desktop layout is scaled with CSS zoom; undo it for the pointer math
    const zoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    nav.addEventListener('pointermove', e => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const r = nav.getBoundingClientRect();
        const z = zoom();
        nav.style.setProperty('--mx', `${(e.clientX - r.left) / z}px`);
        nav.style.setProperty('--my', `${(e.clientY - r.top) / z}px`);
        frame = 0;
      });
    });
  }

  // Theme — transitions suppressed during the swap so colors don't smear
  const root = document.documentElement;
  const themeBtns = $$('[data-theme-set]');
  const setTheme = (t, save) => {
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{transition:none !important}';
    document.head.append(style);

    root.dataset.theme = t;
    themeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
    if (save) { try { localStorage.setItem('inimu-theme', t); } catch (e) {} }

    void document.body.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
  };
  setTheme(root.dataset.theme || 'dark', false);
  themeBtns.forEach(b => b.addEventListener('click', () => setTheme(b.dataset.themeSet, true)));

  // Billing period toggle: one price per card, monthly or weekly
  const period = $('[data-period]');
  if (period) {
    const setPeriod = p => {
      period.dataset.active = p;
      $$('button', period).forEach(b => b.setAttribute('aria-checked', String(b.dataset.p === p)));
      $$('.prod[data-month]').forEach(card => {
        const price = $('.price', card);
        price.classList.add('is-swapping');
        setTimeout(() => {
          $('[data-price]', card).textContent = `€${card.dataset[p]}`;
          const per = $('[data-per]', card);
          per.textContent = p === 'week' ? '/ week' : '/ month';
          per.classList.toggle('is-week', p === 'week');
          price.classList.remove('is-swapping');
        }, 150);
      });
    };
    $$('button', period).forEach(b => b.addEventListener('click', () => setPeriod(b.dataset.p)));
    period.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = period.dataset.active === 'week' ? 'month' : 'week';
      setPeriod(next);
      $(`[data-p="${next}"]`, period).focus();
    });
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll — sections fade in; grouped lists stagger their items.
  // The wrapping block drops its own reveal so only the items animate (no double fade).
  [['.titles-row', 'li'], ['.reqlist', 'li'], ['.reqnotes ul', 'li'], ['.sboard', '.srow'], ['.faq', 'details']]
    .forEach(([sel, child]) => {
      const group = $(sel);
      if (!group) return;
      const wrap = group.closest('.reveal');
      if (wrap) wrap.classList.remove('reveal');
      $$(child, group).forEach((el, i) => { el.classList.add('reveal'); el.dataset.rvStep = Math.min(i, 7) * 70; });
    });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      // drop the stagger delay once revealed so hover transitions respond instantly
      setTimeout(() => { el.style.transitionDelay = ''; }, 320 + (parseInt(el.style.transitionDelay) || 0));
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  const prods = $$('.prod');
  $$('.reveal').forEach((el, i) => {
    let delay = 0;
    if (el.dataset.rvStep != null) delay = +el.dataset.rvStep;
    else if (el.closest('.hero')) delay = i * 100;
    else if (el.classList.contains('prod')) delay = (prods.indexOf(el) % 3) * 100;
    if (delay) el.style.transitionDelay = `${delay}ms`;
    io.observe(el);
  });

  // Hero product shot: gentle parallax drift on scroll (pointer devices, motion allowed)
  const shot = $('.shot-wrap');
  if (shot && !reduce && matchMedia('(min-width: 721px)').matches) {
    let rafS = 0;
    const onParallax = () => {
      if (rafS) return;
      rafS = requestAnimationFrame(() => {
        shot.style.setProperty('--par', `${Math.min(window.scrollY, 700) * 0.055}px`);
        rafS = 0;
      });
    };
    onParallax();
    window.addEventListener('scroll', onParallax, { passive: true });
  }
})();
