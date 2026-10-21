// Session, profile menu, login/register and dashboard. Loaded after app.js on every page.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- config ----------
  // Discord OAuth: create an app at https://discord.com/developers/applications,
  // add this page's URL (e.g. http://localhost:5530/dashboard.html) under OAuth2 → Redirects,
  // and paste the Client ID here. Empty = demo link (fake, local only).
  const DISCORD_CLIENT_ID = '';

  // ---------- demo auth ----------
  // Front-end only, for testing the flow. Anyone can read this file, so it is NOT
  // real security — TODO: replace with the backend before going live.
  // Passwords are stored as SHA-256 hashes.
  const DEMO_USERS = [
    { username: 'parra', email: 'parra@inimu.test', since: 'Jul 2026',
      hash: '6cf0cc816ee9757de940a2f8ffa2a278528c2208c01a167e9745ee70208940a6' },
  ];
  const USERS_KEY = 'inimu-users';
  const SESSION_KEY = 'inimu-session';

  const store = {
    get(area, key) { try { return JSON.parse(area.getItem(key)); } catch (e) { return null; } },
    set(area, key, val) { try { area.setItem(key, JSON.stringify(val)); } catch (e) {} },
    del(key) { try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch (e) {} },
  };
  const sha256 = async text => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const allUsers = () => [...DEMO_USERS, ...(store.get(localStorage, USERS_KEY) || [])];
  const findUser = id => {
    const v = id.trim().toLowerCase();
    return allUsers().find(u => u.username.toLowerCase() === v || u.email.toLowerCase() === v);
  };
  const session = () => store.get(sessionStorage, SESSION_KEY) || store.get(localStorage, SESSION_KEY);
  const signIn = (user, remember) => {
    store.del(SESSION_KEY);
    store.set(remember ? localStorage : sessionStorage, SESSION_KEY, { username: user.username, email: user.email, since: user.since });
  };
  const signOut = () => { store.del(SESSION_KEY); location.href = 'index.html'; };

  // per-user profile (Discord link, cover, redeemed keys)
  const profileKey = u => `inimu-profile:${u.toLowerCase()}`;
  const getProfile = u => store.get(localStorage, profileKey(u)) || {};
  const saveProfile = (u, p) => store.set(localStorage, profileKey(u), p);

  const me = session();
  if (me && !me.email) me.email = findUser(me.username)?.email || '';
  document.documentElement.classList.toggle('signed-in', !!me);

  // display name + avatar: Discord when linked and enabled, otherwise the account
  const identity = () => {
    const p = getProfile(me.username);
    const d = p.discord && p.useDiscord !== false ? p.discord : null;
    const name = d ? d.name : me.username;
    return { name, avatar: d ? d.avatar : null, initial: name[0].toUpperCase() };
  };
  const avatarHTML = id => (id.avatar ? `<img src="${esc(id.avatar)}" alt="" />` : esc(id.initial));

  // ---------- profile menu (replaces Log in / Register when signed in) ----------
  const ICON = {
    dash: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></svg>',
    key: '<svg viewBox="0 0 20 20"><circle cx="6.5" cy="13.5" r="3.5"/><path d="M9 11 17 3M14.5 5.5 17 8"/></svg>',
    orders: '<svg viewBox="0 0 20 20"><path d="M5 2.5h10v15l-2.5-1.5L10 17.5 7.5 16 5 17.5z"/><path d="M8 7h4M8 10.5h4"/></svg>',
    out: '<svg viewBox="0 0 20 20"><path d="M8 17H4.5A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3H8M13 14l4-4-4-4M17 10H8"/></svg>',
  };

  let acct = null;
  const isOpen = () => !!acct && acct.classList.contains('is-open');
  const setOpen = open => {
    if (!acct) return;
    acct.classList.toggle('is-open', open);
    $('.acct-btn', acct).setAttribute('aria-expanded', String(open));
    if (open) $('.acct-item', acct).focus();
  };
  document.addEventListener('click', e => { if (acct && !acct.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { setOpen(false); $('.acct-btn', acct).focus(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const list = $$('.acct-item', acct);
      const i = list.indexOf(document.activeElement);
      list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length].focus();
    }
  });

  const renderAccountUI = () => {
    $$('.acct, .sheet-acct').forEach(el => el.remove());
    acct = null;
    if (!me) return;
    const id = identity();
    const onDash = !!$('[data-dashboard]');
    const onOrders = !!$('[data-orders-page]');
    const head = `
      <div class="acct-head">
        <span class="acct-avatar">${avatarHTML(id)}</span>
        <span><strong>${esc(id.name)}</strong><span class="mono-xs">${esc(me.email || '')}</span></span>
      </div>`;
    const items = `
      <a class="acct-item" role="menuitem" href="dashboard.html"${onDash ? ' aria-current="page"' : ''}>${ICON.dash}Dashboard</a>
      <a class="acct-item" role="menuitem" href="dashboard.html#redeem">${ICON.key}Redeem a key</a>
      <a class="acct-item" role="menuitem" href="orders.html"${onOrders ? ' aria-current="page"' : ''}>${ICON.orders}Orders</a>
      <div class="acct-sep" role="separator"></div>
      <button class="acct-item acct-out" role="menuitem" data-logout>${ICON.out}Log out</button>`;

    acct = document.createElement('div');
    acct.className = 'acct';
    acct.innerHTML = `
      <button class="acct-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">
        <span class="acct-avatar">${avatarHTML(id)}</span>
        <svg class="acct-chev" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg>
      </button>
      <div class="acct-menu" role="menu">${head}${items}</div>`;
    const navR = $('.nav-r');
    navR?.insertBefore(acct, $('.theme', navR));
    $('.acct-btn', acct).addEventListener('click', e => { e.stopPropagation(); setOpen(!isOpen()); });

    const sheet = $('#sheet');
    if (sheet) {
      const box = document.createElement('div');
      box.className = 'sheet-acct';
      box.innerHTML = head + items;
      sheet.append(box);
    }
    $$('[data-logout]').forEach(b => b.addEventListener('click', signOut));
  };
  renderAccountUI();

  // Already signed in? Skip the login / register pages.
  if (me && $('[data-auth]')) { location.replace('dashboard.html'); return; }

  // ---------- forms ----------
  const setError = (input, msg) => {
    const field = input.closest('.f, .check');
    field.classList.toggle('is-bad', !!msg);
    const err = $('.f-error', field);
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
    return !msg;
  };

  $$('[data-eye]').forEach(btn => btn.addEventListener('click', () => {
    const input = $('input', btn.parentElement);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.classList.toggle('is-on', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));

  const RULES = {
    login: f => [
      setError(f.user, f.user.value.trim() ? '' : 'Enter your username or email'),
      setError(f.password, f.password.value ? '' : 'Enter your password'),
    ],
    register: f => [
      setError(f.username, /^[A-Za-z0-9_]{3,16}$/.test(f.username.value.trim()) ? '' : '3–16 characters: letters, numbers and _'),
      setError(f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()) ? '' : 'Enter a valid email'),
      setError(f.password, f.password.value.length >= 8 ? '' : 'Use at least 8 characters'),
      setError(f.confirm, f.confirm.value && f.confirm.value === f.password.value ? '' : "Passwords don't match"),
      setError(f.terms, f.terms.checked ? '' : 'Required'),
    ],
  };

  $$('[data-auth]').forEach(form => {
    const check = RULES[form.dataset.auth];
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!check(form).every(Boolean)) { $('.is-bad input', form)?.focus(); return; }

      if (form.dataset.auth === 'login') {
        const user = findUser(form.user.value);
        if (!user || user.hash !== await sha256(form.password.value)) {
          setError(form.password, 'Wrong username or password');
          form.password.focus();
          return;
        }
        signIn(user, form.remember.checked);
      } else {
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        if (findUser(username)) { setError(form.username, 'That username is taken'); form.username.focus(); return; }
        if (findUser(email)) { setError(form.email, 'That email already has an account'); form.email.focus(); return; }
        const since = new Date().toLocaleString('en', { month: 'short', year: 'numeric' });
        const user = { username, email, since, hash: await sha256(form.password.value) };
        store.set(localStorage, USERS_KEY, [...(store.get(localStorage, USERS_KEY) || []), user]);
        signIn(user, false);
      }
      location.href = 'dashboard.html';
    });
    $$('input', form).forEach(input => input.addEventListener('input', () => {
      if (input.closest('.is-bad')) setError(input, '');
    }));
  });

  // ---------- signed-in pages (dashboard, orders) ----------
  const onOrdersPage = !!$('[data-orders-page]');
  if (!$('[data-dashboard]') && !onOrdersPage) return;
  if (!me) { location.replace('login.html'); return; }

  // Demo data — TODO: load from the backend for the signed-in user.
  const BASE_TITLES = [
    { name: 'Counter-Strike 2', renews: 'Nov 1, 2026', left: 12, total: 30, state: 'ok' },
    { name: 'Rust', renews: 'Nov 13, 2026', left: 24, total: 30, state: 'ok' },
    { name: 'Apex Legends', renews: 'Oct 25, 2026', left: 4, total: 7, state: 'warn' },
  ];
  // Keys that work in the demo. TODO: validate keys on the backend.
  const DEMO_KEYS = {
    'INIMU-EFT0-2026-DEMO': { name: 'Escape from Tarkov', renews: 'Nov 19, 2026', left: 30, total: 30, state: 'ok' },
    'INIMU-PUBG-2026-DEMO': { name: 'PUBG: Battlegrounds', renews: 'Oct 27, 2026', left: 7, total: 7, state: 'ok' },
  };
  const ORDERS = [
    { id: 'A0F4-77E1', title: 'Counter-Strike 2', plan: 'Monthly', date: '2026-10-20', amount: 40, status: 'pending' },
    { id: 'C81B-5520', title: 'Apex Legends', plan: 'Weekly', date: '2026-10-18', amount: 15, status: 'paid' },
    { id: '93C1-2B08', title: 'Rust', plan: 'Monthly', date: '2026-10-14', amount: 40, status: 'paid' },
    { id: '71DD-04A9', title: 'Counter-Strike 2', plan: 'Monthly', date: '2026-09-20', amount: 40, status: 'paid' },
    { id: '5E02-C3F7', title: 'PUBG: Battlegrounds', plan: 'Weekly', date: '2026-08-02', amount: 15, status: 'expired' },
  ];
  const eur = n => `€${n.toFixed(2)}`;
  const day = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  const titles = () => [...BASE_TITLES, ...(getProfile(me.username).redeemed || []).map(k => DEMO_KEYS[k]).filter(Boolean)];


  // ---------- orders page ----------
  if (onOrdersPage) {
    const STATUS = { paid: ['st-ok', 'Paid'], pending: ['st-warn', 'Pending'], expired: ['st-test', 'Expired'] };
    const pending = ORDERS.find(o => o.status === 'pending');
    if (pending) {
      const alertEl = $('[data-bill-alert]');
      alertEl.innerHTML = `<p><strong>Payment waiting</strong> · ${pending.title} ${pending.plan.toLowerCase()} · <span class="mono-sm">#${pending.id}</span></p><span class="bill-amt">${eur(pending.amount)}</span>`;
      alertEl.hidden = false;
    }
    $('[data-orders]').innerHTML = ORDERS.map(o => `
      <div class="order-row is-${o.status}">
        <span class="order-id mono-sm">#${o.id}</span>
        <span class="bill-what"><strong>${o.title}</strong><span class="mono-xs">${o.plan} · ${day(o.date)}</span></span>
        <span><span class="st ${STATUS[o.status][0]}">${STATUS[o.status][1]}</span></span>
        <span class="bill-amt">${eur(o.amount)}</span>
      </div>`).join('');
    return;
  }

  // profile header
  const COVERS = ['violet', 'deep', 'ink'];
  const renderProfile = () => {
    const p = getProfile(me.username);
    const id = identity();
    const n = titles().length;
    $('[data-user-name]').textContent = id.name;
    $('[data-avatar]').firstElementChild.outerHTML = id.avatar
      ? `<img src="${esc(id.avatar)}" alt="" width="128" height="128" />`
      : `<span>${esc(id.initial)}</span>`;
    $('[data-discord-badge]').hidden = !p.discord;
    const role = $('[data-user-role]');
    role.textContent = n ? 'Premium member' : 'Member';
    role.classList.toggle('is-premium', n > 0);
    $('[data-stat-titles]').textContent = n;
    $('[data-user-since]').textContent = me.since;
    $('[data-cover]').dataset.cover = p.cover || 'violet';
    $('[data-discord-tool]').textContent = p.discord ? 'Discord linked' : 'Connect Discord';
  };
  $('[data-cover-next]').addEventListener('click', () => {
    const p = getProfile(me.username);
    p.cover = COVERS[(COVERS.indexOf(p.cover || 'violet') + 1) % COVERS.length];
    saveProfile(me.username, p);
    renderProfile();
  });
  $('[data-go-redeem]').addEventListener('click', () => {
    $('#redeem').scrollIntoView({ block: 'center' });
    $('[data-keyform]').key.focus({ preventScroll: true });
  });
  $('[data-go-discord]').addEventListener('click', () => $('#discord').scrollIntoView({ block: 'center' }));

  // products
  const renderTitles = () => {
    const list = titles();
    $('[data-subs]').innerHTML = list.map(s => {
      const paused = s.state === 'warn';
      const pct = Math.max(3, Math.round((s.left / s.total) * 100));
      const tone = paused ? ' is-off' : s.left <= 5 ? ' is-low' : '';
      return `
        <li class="pc${tone}">
          <div class="pc-top">
            <span class="pc-name">${s.name}</span>
            <span class="st ${paused ? 'st-warn' : 'st-ok'}">${paused ? 'Paused' : 'Active'}</span>
          </div>
          <p class="pc-days"><strong>${s.left}</strong> ${s.left === 1 ? 'day' : 'days'} left</p>
          <div class="pc-bar" role="img" aria-label="${s.left} of ${s.total} days left"><i style="width:${pct}%"></i></div>
          <p class="pc-foot mono-xs">${paused ? 'Time is added back after the update' : `Renews ${s.renews}`}</p>
        </li>`;
    }).join('');
    $('[data-key-count]').textContent = list.length;
  };

  // redeem
  const keyForm = $('[data-keyform]');
  const keyOk = $('.key-ok');
  keyForm.key.addEventListener('input', () => setError(keyForm.key, ''));
  keyForm.addEventListener('submit', e => {
    e.preventDefault();
    const key = keyForm.key.value.trim().toUpperCase();
    keyOk.hidden = true;
    if (!key) return setError(keyForm.key, 'Paste your license key');
    if (!/^INIMU(-[A-Z0-9]{4}){3}$/.test(key)) return setError(keyForm.key, "That doesn't look like a valid key");
    const p = getProfile(me.username);
    p.redeemed = p.redeemed || [];
    if (p.redeemed.includes(key)) return setError(keyForm.key, 'You already redeemed this key');
    const title = DEMO_KEYS[key];
    if (!title) return setError(keyForm.key, "We couldn't find that key");
    p.redeemed.push(key);
    saveProfile(me.username, p);
    keyForm.reset();
    keyOk.textContent = `${title.name} added to your products`;
    keyOk.hidden = false;
    renderTitles();
    renderProfile();
  });

  // discord
  const dcCard = $('[data-discord-card]');
  const dcNote = $('[data-discord-note]');
  const renderDiscord = () => {
    const p = getProfile(me.username);
    dcCard.classList.toggle('is-linked', !!p.discord);
    if (!p.discord) return;
    $('[data-dc-avatar]').src = p.discord.avatar;
    $('[data-dc-name]').textContent = p.discord.name;
    $('[data-dc-handle]').textContent = `@${p.discord.handle}${p.discord.demo ? ' · demo' : ''}`;
    $('[data-dc-use]').checked = p.useDiscord !== false;
  };
  const renderAll = () => { renderProfile(); renderDiscord(); renderAccountUI(); };
  const linkDiscord = discord => {
    const p = getProfile(me.username);
    p.discord = discord;
    p.useDiscord = true;
    saveProfile(me.username, p);
    dcNote.textContent = '';
    renderAll();
  };
  const discordAvatar = u => (u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`);

  $('[data-discord-connect]').addEventListener('click', () => {
    if (!DISCORD_CLIENT_ID) {
      // Demo: pretend Discord returned an account with the same name and a default avatar.
      const n = [...me.username].reduce((a, c) => a + c.charCodeAt(0), 0) % 6;
      linkDiscord({ id: 'demo', name: me.username, handle: me.username.toLowerCase(), avatar: `https://cdn.discordapp.com/embed/avatars/${n}.png`, demo: true });
      return;
    }
    const state = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
    store.set(sessionStorage, 'inimu-oauth-state', state);
    location.href = 'https://discord.com/oauth2/authorize?' + new URLSearchParams({
      client_id: DISCORD_CLIENT_ID, response_type: 'token', scope: 'identify', redirect_uri: location.origin + location.pathname, state,
    });
  });
  $('[data-discord-unlink]').addEventListener('click', () => {
    const p = getProfile(me.username);
    delete p.discord;
    saveProfile(me.username, p);
    renderAll();
  });
  $('[data-dc-use]').addEventListener('change', e => {
    const p = getProfile(me.username);
    p.useDiscord = e.target.checked;
    saveProfile(me.username, p);
    renderAll();
  });

  // Back from Discord: #access_token=...&state=...
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('access_token') || hash.get('error')) {
    history.replaceState(null, '', location.pathname);
    const expected = store.get(sessionStorage, 'inimu-oauth-state');
    try { sessionStorage.removeItem('inimu-oauth-state'); } catch (e) {}
    if (hash.get('error') || hash.get('state') !== expected) {
      dcNote.textContent = 'Discord link was cancelled. Try again.';
    } else {
      fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${hash.get('access_token')}` } })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(u => linkDiscord({ id: u.id, name: u.global_name || u.username, handle: u.username, avatar: discordAvatar(u) }))
        .catch(() => { dcNote.textContent = "Couldn't reach Discord. Try again."; });
    }
  }

  // PC binding reset (once every 7 days)
  const resetBtn = $('[data-reset]');
  resetBtn.addEventListener('click', () => {
    // TODO: call the backend.
    resetBtn.disabled = true;
    resetBtn.textContent = 'Binding reset';
    $('[data-reset-state]').textContent = 'Next reset in 7 days';
  });

  renderTitles();
  renderAll();
})();
