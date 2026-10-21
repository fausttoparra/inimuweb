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

  // Header spotlight follows the cursor (pointer devices, motion allowed)
  if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    let frame = 0;
    nav.addEventListener('pointermove', e => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const r = nav.getBoundingClientRect();
        nav.style.setProperty('--mx', `${e.clientX - r.left}px`);
        nav.style.setProperty('--my', `${e.clientY - r.top}px`);
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

  // Product cards: glow follows the cursor (pointer devices, motion allowed)
  if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    $$('.prod').forEach(card => card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--px', `${e.clientX - r.left}px`);
      card.style.setProperty('--py', `${e.clientY - r.top}px`);
    }));
  }

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

  // Reveal on scroll — hero chunks and product cards stagger 100ms
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      // drop the stagger delay once revealed so hover transitions respond instantly
      setTimeout(() => { el.style.transitionDelay = ''; }, 300 + (parseInt(el.style.transitionDelay) || 0));
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  const prods = $$('.prod');
  $$('.reveal').forEach((el, i) => {
    if (el.closest('.hero')) el.style.transitionDelay = `${i * 100}ms`;
    else if (el.classList.contains('prod')) el.style.transitionDelay = `${(prods.indexOf(el) % 3) * 100}ms`;
    io.observe(el);
  });
})();
