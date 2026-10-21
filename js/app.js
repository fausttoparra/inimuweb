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

  // Status page: draw 30 daily uptime bars, marking the degraded days
  $$('.bars').forEach(track => {
    const days = 30;
    const bad = Math.min(days, parseInt(track.dataset.bad) || 0);
    // spread the degraded days out rather than bunching them at the end
    const step = bad ? days / bad : 0;
    const flagged = new Set();
    for (let k = 0; k < bad; k++) flagged.add(Math.round(k * step + step / 2));
    for (let d = 0; d < days; d++) {
      const bar = document.createElement('i');
      if (flagged.has(d) && track.dataset.tone !== 'test') bar.className = 'bad';
      track.append(bar);
    }
  });
})();
