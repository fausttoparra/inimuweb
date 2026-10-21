// Product page: product.html?p=<id>. Edit the data below to change any product.
// image: path to a screenshot in /images (e.g. 'images/cs2.jpg'); null shows a placeholder.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const PRODUCTS = {
    cs2: {
      code: 'CS2', name: 'Counter-Strike 2', category: 'Tactical FPS', status: 'ok', month: 40, week: 15, image: null,
      desc: 'Aim assist, trigger and recoil control with per-weapon profiles. Built for ranked and Premier.',
      features: {
        Aim: ['Smooth aim assist with FOV control', 'Triggerbot with reaction delay', 'Recoil control per weapon', 'Visibility checks'],
        Visuals: ['Player boxes, health and names', 'Weapon and utility ESP', 'Bomb timer and defuse indicator', 'Radar overlay'],
        Misc: ['Per-weapon config profiles', 'Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (64-bit)', 'Intel and AMD processors', 'Secure Boot + TPM — on or off, either works', 'Stream-proof overlay'],
    },
    rust: {
      code: 'RUST', name: 'Rust', category: 'Survival', status: 'ok', month: 40, week: 15, image: null,
      desc: 'Player, loot and raid ESP with a clean radar for wipe day.',
      features: {
        Aim: ['Aim assist with bullet drop prediction', 'Recoil control for every rifle'],
        Visuals: ['Player and sleeper ESP', 'Loot, crates and resources', 'Raid and base indicators', 'Minimap radar'],
        Misc: ['Loot filters by value', 'Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (64-bit)', 'Intel and AMD processors', 'Secure Boot + TPM — on or off, either works', 'Borderless windowed mode'],
    },
    apex: {
      code: 'APEX', name: 'Apex Legends', category: 'Battle royale', status: 'warn', month: 35, week: 12, image: null,
      desc: 'Smooth aim and squad visuals. Paused while the new season ships.',
      features: {
        Aim: ['Smooth aim assist', 'Target priority by distance', 'Controller support'],
        Visuals: ['Player and squad ESP', 'Shield and health bars', 'Spectator count'],
        Misc: ['Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (Pro only)', 'Secure Boot + TPM supported', 'Controller supported', 'Stream-proof overlay'],
    },
    eft: {
      code: 'EFT', name: 'Escape from Tarkov', category: 'Extraction shooter', status: 'ok', month: 45, week: 17, image: null,
      desc: 'Loot filters by value, AI and player ESP, extract timers.',
      features: {
        Aim: ['Aim assist with ammo ballistics', 'Recoil control'],
        Visuals: ['Player, scav and boss ESP', 'Loot ESP with value filter', 'Extract points and timers', 'Quest items'],
        Misc: ['Price checker for loot', 'Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (64-bit)', 'Intel and AMD processors', 'Borderless windowed mode', 'Stream-proof overlay'],
    },
    pubg: {
      code: 'PUBG', name: 'PUBG: Battlegrounds', category: 'Battle royale', status: 'ok', month: 35, week: 12, image: null,
      desc: 'Long-range visuals, vehicle ESP and recoil control.',
      features: {
        Aim: ['Recoil control per weapon and attachment', 'Bullet drop prediction'],
        Visuals: ['Long-range player ESP', 'Vehicle and airdrop ESP', 'Loot by rarity'],
        Misc: ['Controller support', 'Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (64-bit)', 'Secure Boot + TPM — on or off, either works', 'Controller supported'],
    },
    r6: {
      code: 'R6', name: 'Rainbow Six Siege', category: 'Tactical FPS', status: 'test', month: 30, week: 10, image: null,
      desc: 'Operator ESP and gadget visuals. In internal testing.',
      features: {
        Visuals: ['Operator ESP through walls', 'Gadget and trap visuals', 'Drone and camera indicators', 'Radar overlay'],
        Misc: ['Stream-proof overlay', 'Cloud configs'],
      },
      reqs: ['Windows 10 / 11 (Pro only)', 'Secure Boot + TPM supported', 'Stream-proof overlay'],
    },
  };
  const STATUS = { ok: ['st-ok', 'Undetected'], warn: ['st-warn', 'Updating'], test: ['st-test', 'Testing'] };

  const page = $('[data-product-page]');
  if (!page) return;
  const id = new URLSearchParams(location.search).get('p');
  const p = PRODUCTS[id];

  if (!p) {
    page.querySelector('.wrap').innerHTML = `
      <div class="pd-missing">
        <span class="eyebrow">Products</span>
        <h1 class="sec-title">We couldn't find that product.</h1>
        <p class="sec-sub">It may have been renamed or removed.</p>
        <div class="hero-ctas"><a class="btn btn-primary" href="index.html#products">See all products</a></div>
      </div>`;
    return;
  }

  document.title = `${p.name} — inimu`;
  $('[data-pd-crumb]').textContent = p.name;
  $('[data-pd-cat]').textContent = p.category;
  $('[data-pd-name]').textContent = p.name;
  $('[data-pd-desc]').textContent = p.desc;
  const st = $('[data-pd-status]');
  st.classList.add(STATUS[p.status][0]);
  st.textContent = STATUS[p.status][1];

  const media = $('[data-pd-media]');
  if (p.image) {
    media.innerHTML = `<img src="${p.image}" alt="${p.name} in-game with the inimu menu open" />`;
    media.classList.add('has-img');
  } else {
    $('[data-pd-code]').textContent = p.code;
  }

  $('[data-pd-features]').innerHTML = Object.entries(p.features).map(([group, items]) => `
    <div class="pd-fgroup">
      <h3>${group}</h3>
      <ul class="checks">${items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>`).join('');
  $('[data-pd-reqs]').innerHTML = p.reqs.map(r => `<li>${r}</li>`).join('');

  // price + billing period switch
  const toggle = $('[data-pd-period]');
  const priceEl = $('[data-pd-price]');
  const perEl = $('[data-pd-per]');
  const buy = $('[data-pd-buy]');
  const setPeriod = (period, animate) => {
    toggle.dataset.active = period;
    $$('button', toggle).forEach(b => b.setAttribute('aria-checked', String(b.dataset.p === period)));
    const apply = () => {
      priceEl.textContent = `€${p[period]}`;
      perEl.textContent = period === 'week' ? 'per week' : 'per month';
      perEl.classList.toggle('is-week', period === 'week');
      if (p.status === 'ok') {
        buy.textContent = `Buy ${period === 'week' ? 'weekly' : 'monthly'} · €${p[period]}`;
        // TODO: point to checkout with the product and period
        buy.href = `register.html?product=${id}&period=${period}`;
      }
      priceEl.parentElement.classList.remove('is-swapping');
    };
    if (!animate) return apply();
    priceEl.parentElement.classList.add('is-swapping');
    setTimeout(apply, 150);
  };
  $$('button', toggle).forEach(b => b.addEventListener('click', () => setPeriod(b.dataset.p, true)));
  toggle.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = toggle.dataset.active === 'week' ? 'month' : 'week';
    setPeriod(next, true);
    $(`[data-p="${next}"]`, toggle).focus();
  });
  setPeriod('month', false);

  // paused / testing titles can't be bought right now
  if (p.status !== 'ok') {
    buy.classList.add('is-disabled');
    buy.setAttribute('aria-disabled', 'true');
    buy.textContent = p.status === 'warn' ? 'Paused while the game updates' : 'In testing — not for sale yet';
    buy.removeAttribute('href');
    buy.classList.replace('btn-primary', 'btn-ghost');
  }
})();
