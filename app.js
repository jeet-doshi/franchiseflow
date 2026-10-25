/* FranchiseFlow UI: views, partner passport, map, onboarding calendar, assistant. */
(function () {
  'use strict';
  var E = window.FranchiseEngine, L = window.FranchiseLoader, C = window.FranchiseChat, M = window.FranchiseMessages, H = E.helpers;
  var esc = C.esc, chip = C.chip;
  var $ = function (id) { return document.getElementById(id); };

  // ------------------------------------------------------------------ icons (24px stroke)
  var IC = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    list: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 13l5-5 5 5M5 4h14"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    check: '<path d="M5 12.5 10 17 19 7"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.7.1 4.6 1.8 5.3 4.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7-7-1z"/>',
    store: '<path d="M4 9h16l-1.5-5h-13L4 9zM5 9v11h14V9M9 20v-6h6v6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-8.5 12-9-.5 7.5-5 11-9 12z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    undo: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    message: '<path d="M4 4h16v12H8l-4 4V4z"/><path d="M8 9h8M8 12h5"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (IC[name] || '') + '</svg>'; }
  function ic(name) { return '<i data-ic="' + name + '">' + icon(name) + '</i>'; }
  function hydrate(root) { (root || document).querySelectorAll('i[data-ic]:empty').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-ic')); }); }

  // ------------------------------------------------------------------ helpers
  var SC = { APPROVED: 'var(--approved)', CONDITIONAL: 'var(--conditional)', WAITLIST: 'var(--waitlist)', HOLD: 'var(--hold)', REJECTED: 'var(--rejected)', WITHDRAWN: 'var(--withdrawn)' };
  var HUES = [222, 262, 199, 330, 152, 24, 284, 186, 12, 240];
  function avatar(name, cls) {
    var n = (name || '?').trim(), parts = n.split(/\s+/);
    var ini = (parts[0] ? parts[0][0] : '?') + (parts[1] ? parts[1][0] : '');
    var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    var hue = HUES[h % HUES.length];
    return '<span class="av ' + (cls || '') + '" style="background:linear-gradient(135deg,hsl(' + hue + ' 75% 56%),hsl(' + ((hue + 40) % 360) + ' 70% 48%))">' + esc(ini.toUpperCase()) + '</span>';
  }
  function ring(score, status, lg) {
    var s = status === 'WITHDRAWN' ? 0 : score;
    return '<span class="ring' + (lg ? ' lg' : '') + '" style="--p:' + s + ';--c:' + SC[status] + '"><b>' + (status === 'WITHDRAWN' ? '–' : score) + (lg ? '<small>of 100</small>' : '') + '</b></span>';
  }
  function find(id) { return state.result.results.filter(function (r) { return r.app.id === id; })[0]; }
  function fmtShort(iso) { var d = new Date(iso); return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; }
  function langCls(l) { return l === 'Kannada' ? 'kn' : l === 'Hindi' ? 'hi' : ''; }
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3800);
  }

  // ------------------------------------------------------------------ state
  var state = { data: null, result: null, today: new Date(), history: [], log: [], fileName: '', report: null,
    view: 'overview', mode: 'board', search: '', city: '', mapCity: null, pp: null, ppTab: 'decision', dueDone: {}, msgLang: {} };

  // ------------------------------------------------------------------ loading
  function loadSheets(sheets, name) {
    var parsed;
    try { parsed = L.parseSheets(sheets); } catch (e) { console.error(e); toast(e.message || 'Could not read that file.', true); return; }
    var data = parsed.data;
    var steps = [
      'Reading sheets: ' + parsed.report.sheetsUsed.applications + ', ' + parsed.report.sheetsUsed.territories,
      'Cleaning ' + data.applications.length + ' applications',
      'Checking pins against ' + data.stores.length + ' existing stores',
      'Scoring fit out of 100',
      'Allocating ' + data.territories.reduce(function (s, t) { return s + t.slots; }, 0) + ' slots across ' + data.territories.length + ' territories',
      'Building onboarding plans and messages'
    ];
    $('procSteps').innerHTML = steps.map(function (s) { return '<li><span class="ck">' + ic('check') + '</span>' + esc(s) + '</li>'; }).join('');
    $('processing').classList.remove('hidden');
    var lis = $('procSteps').querySelectorAll('li'), i = 0;
    var timer = setInterval(function () {
      if (i < lis.length) { lis[i].classList.add('on'); i++; return; }
      clearInterval(timer);
      $('processing').classList.add('hidden');
      state.data = data; state.report = parsed.report; state.fileName = name;
      state.history = []; state.log = []; state.today = new Date(); state.dueDone = {}; state.msgLang = {};
      state.result = E.evaluate(state.data, { today: state.today });
      state.mapCity = null;
      $('landing').classList.add('hidden');
      ['tabs', 'btnAdd', 'btnExport'].forEach(function (id) { $(id).classList.remove('hidden'); });
      setView('overview');
      greet();
      setChat(window.innerWidth > 960);
      if (window.innerWidth <= 960) $('chatFab').classList.remove('hidden');
    }, 170);
  }

  function handleFile(file) {
    if (!file) return;
    if (!window.XLSX) { toast('The spreadsheet reader did not load - check the connection and refresh.', true); return; }
    file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, { type: 'array' });
      var sheets = wb.SheetNames.map(function (n) { return { name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) }; });
      loadSheets(sheets, file.name);
    }).catch(function (e) { toast(e.message || 'Could not read that file.', true); });
  }

  // ------------------------------------------------------------------ commit (every change goes through here)
  function commit(out, label, kind) {
    var before = state.result;
    state.history.push({ data: state.data, result: state.result });
    state.data = out.data;
    state.result = out.result;
    var changed = [];
    state.result.results.forEach(function (r) {
      var b = before.results.filter(function (x) { return x.app.id === r.app.id; })[0];
      if (!b || b.status !== r.status || b.score !== r.score) changed.push(r.app.id);
    });
    state.log.push({ when: new Date(), text: label, kind: kind || 'update', html: out.html.split('<div class="nested">')[0].replace(/<p class="muted">Type <i>undo<\/i>.*$/, '') });
    renderAll(changed);
    if (state.pp) openPassport(state.pp, state.ppTab, true);
    setChips();
    return changed;
  }
  function undo() {
    if (!state.history.length) return false;
    var prev = state.history.pop();
    state.data = prev.data; state.result = prev.result;
    state.log.pop();
    renderAll();
    if (state.pp) openPassport(state.pp, state.ppTab, true);
    setChips();
    return true;
  }

  // ------------------------------------------------------------------ views
  function setView(v) {
    state.view = v;
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === v); });
    ['overview', 'decisions', 'map', 'onboarding'].forEach(function (x) { $('view-' + x).classList.toggle('hidden', x !== v); });
    renderView(v);
    window.scrollTo({ top: 0 });
  }
  function renderAll(flash) { renderView(state.view, flash); }
  function renderView(v, flash) {
    if (!state.result) return;
    if (v === 'overview') renderOverview();
    if (v === 'decisions') renderDecisions(flash);
    if (v === 'map') renderMap();
    if (v === 'onboarding') renderOnboarding();
    hydrate();
  }

  function counts() {
    var c = {};
    state.result.results.forEach(function (r) { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }

  // ---------------- Overview
  function renderOverview() {
    var res = state.result, c = counts(), n = res.results.length;
    var rep = state.report || { sheetsUsed: {}, warnings: [] };
    $('fileMeta').innerHTML = esc(state.fileName) + ' · ' + n + ' applications · ' + res.territories.length + ' territories · ' + state.data.stores.length + ' existing stores' +
      (state.log.length ? ' · ' + state.log.length + ' update(s)' : '') + (rep.warnings.length ? ' · <span style="color:var(--conditional-ink)">' + esc(rep.warnings.join(' ')) + '</span>' : '');
    var slots = 0, filled = 0;
    res.territories.forEach(function (t) { slots += t.slots; filled += t.filled; });
    var moving = (c.APPROVED || 0) + (c.CONDITIONAL || 0);
    var pf = E.portfolio(res);
    var first = pf.openings[0];
    var in90 = pf.openings.filter(function (o) { return (new Date(o.launchISO) - state.today) / 864e5 <= 90; }).length;
    $('stats').innerHTML =
      stat('users', 'Applications', n, res.territories.length + ' territories · ' + new Set(res.territories.map(function (t) { return t.city; })).size + ' cities') +
      stat('rocket', 'Moving forward', moving + ' <small>/ ' + n + '</small>', (c.APPROVED || 0) + ' approved · ' + (c.CONDITIONAL || 0) + ' conditional', true) +
      stat('pin', 'Slots filled', filled + ' <small>/ ' + slots + '</small>', slots - filled ? (slots - filled) + ' still open' : 'every open slot allocated') +
      stat('calendar', 'First opening', first ? fmtShort(first.launchISO) : '—', first ? in90 + ' store(s) open within 90 days' : 'no one approved yet');

    // funnel
    var order = ['APPROVED', 'CONDITIONAL', 'WAITLIST', 'HOLD', 'REJECTED', 'WITHDRAWN'];
    $('funnel').innerHTML = '<div class="fbar">' + order.filter(function (s) { return c[s]; }).map(function (s) {
      return '<button style="flex:' + c[s] + ';background:' + SC[s] + '" data-filter="' + s + '" title="' + E.STATUS[s].label + ': ' + c[s] + '">' + c[s] + '</button>';
    }).join('') + '</div><div class="flegend">' + order.filter(function (s) { return c[s] || s !== 'WITHDRAWN'; }).map(function (s) {
      return '<button data-filter="' + s + '"><span class="dot" style="background:' + SC[s] + '"></span><span>' + E.STATUS[s].label + '</span><b>' + (c[s] || 0) + '</b></button>';
    }).join('') + '</div><div class="funnel-steps">' +
      '<div><b>' + n + '</b><span>applied</span></div>' +
      '<div><b>' + ((c.APPROVED || 0) + (c.CONDITIONAL || 0) + (c.WAITLIST || 0)) + '</b><span>qualified</span></div>' +
      '<div><b>' + moving + '</b><span>got a slot</span></div>' +
      '<div><b>' + (c.APPROVED || 0) + '</b><span>fully approved</span></div></div>';

    // attention
    var rank = { review: 0, manual: 1, waiting: 2 };
    var att = res.results.filter(function (r) { return rank[r.confidence] !== undefined; })
      .sort(function (a, b) { return rank[a.confidence] - rank[b.confidence] || b.score - a.score; });
    $('attnCount').textContent = att.length ? att.length + ' item(s)' : '';
    $('attention').innerHTML = att.length ? att.map(function (r) {
      var lbl = r.confidence === 'review' ? 'Review' : r.confidence === 'manual' ? 'Override' : 'Ask applicant';
      var sub = r.confidence === 'waiting' ? (r.actions[0] || r.reviewNote) : r.reviewNote;
      return '<button class="att" data-app="' + esc(r.app.id) + '">' + avatar(r.app.name) + '<span><span class="t">' + esc(r.app.id) + ' · ' + esc(r.app.name || '—') + ' ' + chip(r.status) + '</span><br><span class="s">' + esc(sub) + '</span></span><span class="badge ' + r.confidence + '">' + lbl + '</span></button>';
    }).join('') : '<p class="empty-note">Nothing needs you right now - every decision is high confidence.</p>';

    // territories
    $('terSub').textContent = filled + ' of ' + slots + ' slots allocated · click to open on the map';
    $('terGrid').innerHTML = res.territories.map(function (t) {
      var pips = '';
      for (var i = 0; i < Math.max(t.slots, 1); i++) {
        var r = t.allocated[i] && find(t.allocated[i]);
        pips += '<span class="pip ' + (r ? r.status.toLowerCase() : '') + '"></span>';
      }
      var apps = res.results.filter(function (r) { return r.territoryId === t.id; }).sort(function (a, b) { return E.STATUS[a.status].order - E.STATUS[b.status].order; });
      return '<button class="ter" data-city="' + esc(t.city) + '"><div class="ter-top"><div><span class="ter-id">' + esc(t.id) + '</span> <span class="ter-city">' + esc(t.city) + ' · Tier ' + (t.tier || '?') + '</span></div><span class="prio ' + t.priority + '">' + t.priority + '</span></div>' +
        '<div class="pips">' + (t.slots ? pips : '<span class="muted small">No open slots</span>') + '</div>' +
        '<div class="ter-apps">' + (apps.length ? apps.map(function (r) { return '<span class="mini s-' + r.status.toLowerCase() + '">' + esc(r.app.id) + '</span>'; }).join('') : '<span class="muted small">No applicants yet</span>') + '</div></button>';
    }).join('');

    // activity
    $('log').innerHTML = state.log.length ? state.log.slice().reverse().map(function (l) {
      var icn = l.kind === 'override' ? 'flag' : l.kind === 'add' ? 'plus' : l.kind === 'path' ? 'target' : 'edit';
      return '<div class="log-item"><span class="dot">' + ic(icn) + '</span><div><div class="when">' + l.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div><div class="what">“' + esc(l.text) + '”</div><div class="msg-inline">' + l.html + '</div></div></div>';
    }).join('') : '<p class="empty-note">No updates yet. Tell the assistant something new, like “' + esc(sampleId('WAITLIST')) + ' has now found a ground-floor space”, or open any applicant and try “Path to yes”.</p>';
  }
  function stat(icn, k, v, d, hero) { return '<div class="stat' + (hero ? ' hero-stat' : '') + '"><div class="k">' + ic(icn) + esc(k) + '</div><div class="v">' + v + '</div><div class="d">' + esc(d) + '</div></div>'; }
  function sampleId(status) { var r = state.result.results.filter(function (x) { return x.status === status; })[0] || state.result.results[0]; return r ? r.app.id : 'APP-001'; }

  // ---------------- Decisions
  var COLS = [
    ['APPROVED', 'Approved', 'Slot confirmed - start onboarding'], ['CONDITIONAL', 'Conditional', 'Slot held 30 days for named conditions'],
    ['WAITLIST', 'Waitlisted', 'Qualified, no slot right now'], ['HOLD', 'On hold', 'Waiting on one answer'], ['CLOSED', 'Not proceeding', 'Rejected or withdrawn']
  ];
  function filtered() {
    var q = state.search.toLowerCase();
    return state.result.results.filter(function (r) {
      if (state.city && r.app.city !== state.city) return false;
      if (!q) return true;
      return [r.app.id, r.app.name, r.app.city, r.app.pin, r.territoryId, r.statusLabel].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  function renderDecisions(flash) {
    var sel = $('cityFilter');
    var cities = []; state.result.results.forEach(function (r) { if (r.app.city && cities.indexOf(r.app.city) < 0) cities.push(r.app.city); });
    sel.innerHTML = '<option value="">All cities</option>' + cities.sort().map(function (c) { return '<option' + (c === state.city ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    document.querySelectorAll('#modeSeg button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-mode') === state.mode); });
    var rows = filtered();
    $('board').classList.toggle('hidden', state.mode !== 'board');
    $('tableWrap').classList.toggle('hidden', state.mode !== 'table');
    if (state.mode === 'board') {
      $('board').innerHTML = COLS.map(function (col) {
        var items = rows.filter(function (r) { return col[0] === 'CLOSED' ? (r.status === 'REJECTED' || r.status === 'WITHDRAWN') : r.status === col[0]; })
          .sort(function (a, b) { return b.score - a.score; });
        var color = col[0] === 'CLOSED' ? SC.REJECTED : SC[col[0]];
        return '<div class="col"><div class="col-head"><span class="bar" style="background:' + color + '"></span><b>' + col[1] + '</b><span class="count">' + items.length + '</span></div><div class="col-sub">' + col[2] + '</div>' +
          (items.length ? items.map(function (r) { return card(r, flash); }).join('') : '<p class="empty-note" style="padding:8px">None</p>') + '</div>';
      }).join('');
    } else {
      rows.sort(function (a, b) { return E.STATUS[a.status].order - E.STATUS[b.status].order || b.score - a.score; });
      $('tbody').innerHTML = rows.map(function (r) {
        var next = r.plan ? r.plan.nextSteps[0].text : (r.actions[0] || '—');
        return '<tr data-app="' + esc(r.app.id) + '"><td><div class="cell-who">' + avatar(r.app.name) + '<div><b>' + esc(r.app.name || '—') + '</b><span>' + esc(r.app.id) + '</span></div></div></td>' +
          '<td>' + esc(r.app.city || '?') + '<div class="muted small">' + esc(r.app.pin || 'no pin') + (r.territoryId ? ' · ' + esc(r.territoryId) : '') + '</div></td>' +
          '<td>' + ring(r.score, r.status) + '</td><td>' + chip(r.status) + '</td><td style="max-width:340px">' + esc(r.headline) + '</td><td class="muted" style="max-width:260px">' + esc(next) + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="muted">No applications match.</td></tr>';
    }
  }
  function card(r, flash) {
    var flags = '';
    if (r.confidence === 'review') flags += '<span class="flag review" title="' + esc(r.reviewNote) + '">' + ic('alert') + 'Review</span>';
    if (r.confidence === 'manual') flags += '<span class="flag manual" title="' + esc(r.reviewNote) + '">' + ic('flag') + 'Override</span>';
    if (r.app.added) flags += '<span class="flag new">New</span>';
    return '<button class="acard' + (flash && flash.indexOf(r.app.id) >= 0 ? ' flash' : '') + '" data-app="' + esc(r.app.id) + '">' +
      '<div class="acard-top">' + avatar(r.app.name) + '<div class="who"><b>' + esc(r.app.name || '(no name)') + '</b></div>' + ring(r.score, r.status) + '</div>' +
      '<div class="meta">' + esc(r.app.id) + ' · ' + esc(r.app.city || '?') + ' ' + esc(r.proposedPin || r.app.pin || '') + '</div>' +
      '<div class="why">' + esc(r.headline) + '</div>' +
      '<div class="foot">' + (r.territoryId ? '<span class="tag">' + esc(r.territoryId) + '</span>' : '') + '<span class="tag">' + esc(r.app.language) + '</span>' + flags + '</div></button>';
  }

  // ---------------- Map
  var CITY_LL = { 'Bengaluru': [12.97, 77.59, 'r'], 'Mysuru': [12.30, 76.64, 'r'], 'Mangaluru': [12.91, 74.86, 'r'], 'Hubballi-Dharwad': [15.36, 75.12, 'r'], 'Belagavi': [15.85, 74.50, 'r'], 'Tumakuru': [13.34, 77.10, 'l'], 'Davanagere': [14.46, 75.92, 'r'] };
  var OUTLINE = [[18.45,77.05],[18.15,77.55],[17.75,77.6],[17.35,77.45],[16.9,77.45],[16.45,77.35],[16.2,77.5],[15.9,77.3],[15.4,77.1],[15.0,77.15],[14.6,77.0],[14.2,77.3],[13.9,77.8],[13.6,78.2],[13.2,78.45],[12.85,78.3],[12.7,77.9],[12.35,77.75],[11.95,77.55],[11.75,77.1],[11.6,76.85],[11.85,76.35],[12.1,75.95],[12.35,75.6],[12.55,75.25],[12.75,74.95],[13.0,74.8],[13.5,74.65],[14.0,74.5],[14.5,74.35],[14.85,74.1],[15.25,74.2],[15.65,74.25],[15.85,74.05],[16.25,74.3],[16.55,74.55],[16.75,75.0],[17.0,75.5],[17.35,75.85],[17.55,76.25],[17.95,76.55],[18.3,76.85]];
  function proj(lat, lon) { return [(lon - 73.85) * 92 + 10, (18.6 - lat) * 92 + 10]; }
  function arc(cx, cy, r, a0, a1) {
    var p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    return 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
  }
  function renderMap() {
    var res = state.result;
    var cities = {};
    res.territories.forEach(function (t) { (cities[t.city] = cities[t.city] || { ters: [], apps: [] }).ters.push(t); });
    res.results.forEach(function (r) { if (cities[r.app.city]) cities[r.app.city].apps.push(r); else if (CITY_LL[r.app.city]) (cities[r.app.city] = { ters: [], apps: [] }).apps.push(r); });
    if (!state.mapCity || !cities[state.mapCity]) {
      state.mapCity = Object.keys(cities).sort(function (a, b) {
        var pa = cities[a].ters.some(function (t) { return t.priority === 'High'; }), pb = cities[b].ters.some(function (t) { return t.priority === 'High'; });
        return (pb - pa) || cities[b].apps.length - cities[a].apps.length;
      })[0];
    }
    var w = (79.6 - 73.85) * 92 + 20, h = (18.6 - 11.4) * 92 + 20;
    var svg = '<path class="state-shape" d="M' + OUTLINE.map(function (p) { var xy = proj(p[0], p[1]); return xy[0].toFixed(1) + ' ' + xy[1].toFixed(1); }).join(' L') + ' Z"/>';
    svg += '<text x="' + (w - 18) + '" y="' + 34 + '" text-anchor="end" style="font:800 15px Plus Jakarta Sans,sans-serif;fill:var(--muted);letter-spacing:.2em">KARNATAKA</text>';
    state.data.stores.forEach(function (s) {
      var ll = CITY_LL[s.city]; if (!ll) return;
    });
    Object.keys(cities).forEach(function (city) {
      var ll = CITY_LL[city]; if (!ll) return;
      var xy = proj(ll[0], ll[1]), cx = xy[0], cy = xy[1];
      var info = cities[city];
      var slots = info.ters.reduce(function (s, t) { return s + t.slots; }, 0);
      var alloc = []; info.ters.forEach(function (t) { t.allocated.forEach(function (id) { alloc.push(find(id).status); }); });
      var stores = state.data.stores.filter(function (s) { return s.city === city; }).length;
      var R = 15 + Math.min(10, slots * 2);
      var hot = info.ters.some(function (t) { return t.priority === 'High' && t.remaining > 0; });
      var g = '<g class="map-node' + (city === state.mapCity ? ' sel' : '') + '" data-city="' + esc(city) + '" tabindex="0" role="button" aria-label="' + esc(city) + '">';
      if (hot) g += '<circle class="halo" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="var(--primary)" opacity=".4"/>';
      if (slots) {
        var gap = slots > 1 ? 0.12 : 0, seg = (2 * Math.PI) / slots;
        if (slots === 1) {
          var c1 = alloc[0] === 'APPROVED' ? 'var(--approved)' : alloc[0] === 'CONDITIONAL' ? 'var(--conditional)' : 'var(--line-strong)';
          g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + 6) + '" stroke="' + c1 + '" stroke-width="5" fill="none"/>';
        }
        for (var i = 0; slots > 1 && i < slots; i++) {
          var st = alloc[i];
          var col = st === 'APPROVED' ? 'var(--approved)' : st === 'CONDITIONAL' ? 'var(--conditional)' : 'var(--line-strong)';
          g += '<path d="' + arc(cx, cy, R + 6, -Math.PI / 2 + i * seg + gap / 2, -Math.PI / 2 + (i + 1) * seg - gap / 2) + '" stroke="' + col + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
        }
      }
      g += '<circle class="core" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="url(#mg)"/>';
      g += '<text class="cnt" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + info.apps.length + '</text>';
      var lx = ll[2] === 'l' ? cx - R - 12 : cx + R + 12, anchor = ll[2] === 'l' ? 'end' : 'start';
      g += '<text x="' + lx + '" y="' + (cy - 2) + '" text-anchor="' + anchor + '">' + esc(city) + '</text>';
      g += '<text x="' + lx + '" y="' + (cy + 14) + '" text-anchor="' + anchor + '" style="font-size:11.5px;font-weight:600;fill:var(--muted)">' + alloc.length + '/' + slots + ' slots · ' + stores + ' store' + (stores === 1 ? '' : 's') + '</text>';
      svg += g + '</g>';
    });
    $('mapSvg').setAttribute('viewBox', '0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0));
    $('mapSvg').innerHTML = '<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f5bff"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>' + svg;
    renderCityPanel(state.mapCity, cities[state.mapCity]);
  }
  function renderCityPanel(city, info) {
    if (!city || !info) { $('cityPanel').innerHTML = '<p class="empty-note">Pick a city on the map.</p>'; return; }
    var storeByPin = {}; state.data.stores.forEach(function (s) { storeByPin[s.pin] = s; });
    var tier = E.CITIES[city] ? E.CITIES[city].tier : '?';
    var html = '<div class="city-title"><h2>' + esc(city) + '</h2><span class="tag">Tier ' + tier + '</span></div><p class="muted">' + info.apps.length + ' applicant(s) · ' + state.data.stores.filter(function (s) { return s.city === city; }).length + ' existing store(s) · setup cost ~' + H.fmtL(E.ASSUMPTIONS.setupCost[tier] || null) + '</p>';
    if (!info.ters.length) html += '<div class="outside">The brand has no target territory in ' + esc(city) + ' right now; applicants here are kept on file.</div>';
    info.ters.forEach(function (t) {
      var pips = ''; for (var i = 0; i < Math.max(t.slots, 1); i++) { var r = t.allocated[i] && find(t.allocated[i]); pips += '<span class="pip ' + (r ? r.status.toLowerCase() : '') + '" style="width:26px;flex:none"></span>'; }
      html += '<div class="terblock"><div class="terblock-head"><b>' + esc(t.id) + '</b><span class="prio ' + t.priority + '">' + t.priority + ' priority</span><span class="muted small">' + t.filled + ' of ' + t.slots + ' slot(s) filled</span><span class="pips" style="margin:0">' + pips + '</span></div><div class="pins">';
      t.pins.forEach(function (p) {
        var st = storeByPin[p];
        var winner = state.result.results.filter(function (r) { return (r.status === 'APPROVED' || r.status === 'CONDITIONAL') && (r.proposedPin || r.app.pin) === p && r.territoryId === t.id; })[0];
        var wants = state.result.results.filter(function (r) { return r.app.pin === p && r !== winner && r.status !== 'WITHDRAWN'; });
        var cls = st ? 'store' : winner ? winner.status.toLowerCase() : wants.length ? 'wanted' : '';
        var who = st ? icon('store').replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"') + ' ' + esc(st.id) + ' <span class="note">since ' + esc(st.year) + '</span>'
          : winner ? '<button data-app="' + esc(winner.app.id) + '">' + esc(winner.app.id) + '</button> ' + esc((winner.app.name || '').split(' ')[0]) + (winner.proposedPin === p ? ' <span class="note">(relocated here)</span>' : '')
          : wants.length ? '' : 'Free';
        var note = wants.length ? '<div class="note">' + (st || winner ? 'Also wanted by ' : 'Wanted by ') + wants.map(function (r) { return '<button class="pin-link" data-app="' + esc(r.app.id) + '">' + esc(r.app.id) + '</button>'; }).join(', ') + '</div>' : '';
        html += '<div class="pin ' + cls + '"><span class="code">' + p + '</span><span class="who">' + who + '</span>' + note + '</div>';
      });
      html += '</div></div>';
    });
    var outside = info.apps.filter(function (r) { return !info.ters.some(function (t) { return t.pins.indexOf(r.app.pin) >= 0; }); });
    if (outside.length) html += '<div class="outside"><b>Applied outside the target pins:</b> ' + outside.map(function (r) { return '<button class="pin-link" data-app="' + esc(r.app.id) + '">' + esc(r.app.id) + '</button> (' + esc(r.app.pin || 'no pin') + ', ' + E.STATUS[r.status].label.toLowerCase() + ')'; }).join(' · ') + '</div>';
    $('cityPanel').innerHTML = html;
  }

  // ---------------- Onboarding
  function renderOnboarding() {
    var pf = E.portfolio(state.result);
    var today = state.today;
    if (!pf.openings.length) {
      $('gantt').innerHTML = '<p class="empty-note">No one is moving forward yet.</p>'; $('cohorts').innerHTML = ''; $('due').innerHTML = ''; return;
    }
    var start = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(pf.openings[pf.openings.length - 1].launchISO);
    var end = new Date(last.getFullYear(), last.getMonth() + 2, 1);
    var span = end - start;
    function pct(d) { return ((new Date(d) - start) / span * 100); }
    var months = [], m = new Date(start);
    while (m < end) { months.push(new Date(m)); m = new Date(m.getFullYear(), m.getMonth() + 1, 1); }
    var mw = 100 / months.length;
    var head = '<div class="g-head"><span>Partner</span><div class="g-months">' + months.map(function (d) { return '<span style="left:' + pct(d) + '%">' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + '</span>'; }).join('') + '</div></div>';
    var rows = pf.openings.map(function (o) {
      var segs = o.steps.filter(function (s) { return !/Grand opening/.test(s.name); }).map(function (s) {
        var cls = /Site search|Clear conditions/.test(s.name) ? 'site' : /training/i.test(s.name) ? 'train' : /Fit-out|Hire/.test(s.name) ? 'fit' : 'setup';
        if (/Hire/.test(s.name)) return '';
        var l = pct(s.startISO), w = Math.max(0.6, pct(s.endISO) - l);
        return '<span class="g-seg ' + cls + '" style="left:' + l + '%;width:' + w + '%" title="' + esc(s.name + ' · ' + s.startDate + ' → ' + s.endDate) + '"></span>';
      }).join('');
      var r = find(o.id);
      return '<div class="g-row" data-app="' + esc(o.id) + '"><div class="g-who">' + avatar(o.name) + '<div style="min-width:0"><b>' + esc(o.name) + '</b><span>' + esc(o.id) + ' · ' + esc(o.city) + '</span></div></div>' +
        '<div class="g-track" style="--mw:' + mw + '%">' + segs + '<span class="g-today" style="left:' + pct(today) + '%"></span><span class="g-open" style="left:' + pct(o.launchISO) + '%" title="Opens ' + esc(o.launchDate) + ' (' + r.statusLabel + ')">' + icon('store') + '</span></div></div>';
    }).join('');
    $('gantt').innerHTML = '<div class="gantt">' + head + rows + '</div>';
    $('calSub').textContent = pf.openings.length + ' stores · first ' + pf.openings[0].launchDate + ' · last ' + pf.openings[pf.openings.length - 1].launchDate + ' · red line = today';

    $('cohorts').innerHTML = pf.cohorts.map(function (c) {
      return '<div class="cohort"><div class="cohort-head"><span class="lang ' + esc(c.language) + '">' + esc(c.language) + '</span><span class="m">' + esc(c.month) + ' · from ' + fmtShort(c.firstStart) + '</span></div><ul>' +
        c.members.map(function (x) { return '<li><button data-app="' + esc(x.id) + '">' + esc(x.name) + '</button><span>' + esc(x.city) + ' · ' + (/Full/.test(x.track) ? '3 wk' : '1 wk') + '</span></li>'; }).join('') + '</ul></div>';
    }).join('');

    var acts = pf.actions.filter(function (a) { return a.kind !== 'partner' || /3 days/.test(a.by); });
    $('dueSub').textContent = acts.length + ' to-dos · tick them off as you go';
    $('due').innerHTML = acts.map(function (a, i) {
      var key = a.id + '|' + a.text;
      var k = a.kind === 'condition' ? 'Condition' : a.kind === 'question' ? 'Ask' : 'Call';
      return '<label><input type="checkbox" data-due="' + esc(key) + '"' + (state.dueDone[key] ? ' checked' : '') + '><span><span class="who">' + esc(a.id) + ' · ' + esc(a.name) + '</span><span class="k ' + a.kind + '">' + k + '</span><br><span class="txt">' + esc(a.text) + '</span></span></label>';
    }).join('');
  }

  // ------------------------------------------------------------------ partner passport
  function openPassport(id, tab, keepScroll) {
    var r = find(id);
    if (!r) return;
    state.pp = id;
    if (tab) state.ppTab = tab;
    if (state.ppTab === 'plan' && !r.plan) state.ppTab = 'decision';
    var a = r.app;
    var tabs = [['decision', 'Decision'], ['path', r.status === 'APPROVED' || r.status === 'WITHDRAWN' ? 'What-if' : 'Path to yes'], ['plan', 'Onboarding plan'], ['message', 'Message']].filter(function (t) { return t[0] !== 'plan' || r.plan; });
    var html = '<div class="pp-head"><div class="pp-top">' + avatar(a.name) + '<div><h2>' + esc(a.name || '(no name)') + '</h2><div class="meta">' + esc(a.id) + ' · ' + esc(a.city || '?') + ' · pin ' + esc(a.pin || '?') + (r.territoryId ? ' · ' + esc(r.territoryId) : '') + ' · ' + esc(a.language) + '</div></div>' +
      '<button class="icon-btn" id="ppClose" aria-label="Close">' + icon('x') + '</button></div>' +
      '<div class="pp-tabs">' + tabs.map(function (t) { return '<button data-pptab="' + t[0] + '" class="' + (state.ppTab === t[0] ? 'active' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    html += '<div class="pp-body">' + verdict(r);
    if (state.ppTab === 'decision') html += decisionTab(r);
    if (state.ppTab === 'path') html += pathTab(r);
    if (state.ppTab === 'plan') html += planTab(r);
    if (state.ppTab === 'message') html += messageTab(r);
    html += '</div>';
    var pp = $('passport');
    var top = pp.scrollTop;
    pp.innerHTML = html;
    pp.classList.remove('hidden'); $('scrim').classList.remove('hidden');
    pp.scrollTop = keepScroll ? top : 0;
    hydrate(pp);
    if (state.ppTab === 'path') wireWhatIf(r);
  }
  function closePassport() { state.pp = null; $('passport').classList.add('hidden'); $('scrim').classList.add('hidden'); }

  function verdict(r) {
    var conf = r.confidence === 'review' ? '<span class="flag review">' + ic('alert') + 'Review suggested</span>' : r.confidence === 'manual' ? '<span class="flag manual">' + ic('flag') + 'Manager override</span>' : r.confidence === 'high' ? '<span class="flag new">' + ic('check') + 'High confidence</span>' : '';
    return '<div class="verdict" style="--vc:' + SC[r.status] + '">' + ring(r.score, r.status, true) + '<div><div class="lbl"><span class="big">' + E.STATUS[r.status].label + '</span>' + conf + '</div><div class="hl">' + esc(r.headline) + '</div><div class="blurb">' + esc(r.statusBlurb) + (r.reviewNote && r.confidence !== 'high' ? ' · ' + esc(r.reviewNote) : '') + '</div></div></div>';
  }
  function mk(t) { return t === '+' ? '<span class="mk plus">+</span>' : t === '-' ? '<span class="mk minus">–</span>' : t === '!' ? '<span class="mk bang">!</span>' : '<span class="mk neutral">•</span>'; }

  function decisionTab(r) {
    var a = r.app;
    var good = r.reasons.filter(function (x) { return x.t === '+'; });
    var bad = r.blocking.map(function (b) { return { t: '-', text: b.text }; }).concat(r.reasons.filter(function (x) { return x.t === '-' || x.t === '~'; }));
    var notes = r.reasons.filter(function (x) { return x.t === '!'; });
    var html = notes.map(function (n) { return '<div class="callout info">' + ic('flag') + '<span>' + esc(n.text) + '</span></div>'; }).join('');
    if (r.flags.length) html += '<div class="callout">' + ic('alert') + '<span><b>Data issues spotted:</b> ' + r.flags.map(esc).join('; ') + '.</span></div>';
    html += '<div class="cols2"><div class="pp-sec"><h4>' + ic('check') + 'Working for them</h4><ul class="reasons">' + (good.length ? good.map(function (x) { return '<li>' + mk('+') + '<span>' + esc(x.text) + '</span></li>'; }).join('') : '<li class="muted">Nothing stands out yet.</li>') + '</ul></div>' +
      '<div class="pp-sec"><h4>' + ic('alert') + 'Holding them back</h4><ul class="reasons">' + (bad.length ? bad.map(function (x) { return '<li>' + mk(x.t) + '<span>' + esc(x.text) + '</span></li>'; }).join('') : '<li class="muted">Nothing - a clean application.</li>') + '</ul></div></div>';
    if (r.conditions.length && (r.status === 'CONDITIONAL' || r.status === 'APPROVED')) html += '<div class="pp-sec"><h4>' + ic('flag') + (r.status === 'CONDITIONAL' ? 'Conditions to keep the slot (30 days)' : 'Still to do') + '</h4><ul class="todo">' + r.conditions.map(function (c) { return '<li class="cond"><b>Condition</b><span>' + esc(c) + '</span></li>'; }).join('') + '</ul></div>';
    if (!r.plan && r.actions.length) html += '<div class="pp-sec"><h4>' + ic('rocket') + 'What happens next</h4><ul class="todo">' + r.actions.map(function (c, i) { return '<li><b>' + (i ? 'Then' : 'Now') + '</b><span>' + esc(c) + '</span></li>'; }).join('') + '</ul></div>';
    if (r.plan) html += '<div class="callout ok">' + ic('rocket') + '<span>Estimated opening <b>' + esc(r.plan.launchDate) + '</b> · training in ' + esc(r.plan.training.language) + ' · payback ~' + r.plan.economics.paybackMonths + ' months. <a href="#" data-pptab="plan">See the onboarding plan →</a></span></div>';
    html += '<div class="pp-sec"><h4>' + ic('target') + 'Score breakdown</h4><div class="bd">' + r.breakdown.map(function (b) {
      var pct = b.max ? Math.max(0, b.pts / b.max * 100) : Math.min(100, Math.abs(b.pts) * 5);
      return '<div class="bd-row"><span>' + esc(b.k) + '</span><div class="track"><div class="fill' + (b.pts < 0 ? ' neg' : '') + '" style="width:' + pct + '%"></div></div><span class="pts">' + b.pts + (b.max ? '/' + b.max : '') + '</span><div class="note">' + esc(b.note) + '</div></div>';
    }).join('') + '</div></div>';
    html += '<div class="pp-sec"><h4>' + ic('users') + 'What the applicant told us</h4><div class="facts">' +
      fact('Investment', H.fmtL(a.investment) + (a.investmentRaw && String(a.investmentRaw) !== String(a.investment) ? ' (“' + a.investmentRaw + '”)' : '')) +
      fact('Retail experience', a.experience === null || a.experience === undefined ? 'blank' : a.experience + ' yrs') + fact('Business', a.business || '—') +
      fact('Space', a.space + (a.space !== 'Not yet identified' ? ' · ' + a.floor : '')) + fact('Size', a.size ? a.size + ' sq ft' : '—') +
      fact('Target launch', a.launchMonths === null || a.launchMonths === undefined ? '—' : a.launchMonths + ' months') + fact('Language', a.language) + fact('Notes', a.notes || '—') + '</div>' +
      (a.updates && a.updates.length ? '<p class="muted small" style="margin-top:8px">Updates received: ' + a.updates.map(function (u) { return '“' + esc(u) + '”'; }).join(' · ') + '</p>' : '') + '</div>';
    // override
    html += '<div class="pp-sec"><h4>' + ic('flag') + 'Manager decision</h4>' + (a.override ? '<p>Override in place: <b>' + E.STATUS[a.override.status].label + '</b> - “' + esc(a.override.reason) + '”. <button class="btn sm" id="ovClear">' + ic('undo') + 'Remove override</button></p>' : '<p class="muted small">Disagree with the engine? Override it - a reason is required and logged, and every other decision re-runs.</p>') +
      '<div class="ov-form"><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="ovStatus"><option value="APPROVED">Approve</option><option value="HOLD">Put on hold</option><option value="WAITLIST">Waitlist</option><option value="REJECTED">Reject</option></select><textarea id="ovReason" placeholder="Reason (required), e.g. signed lease next to a college, verified on site" style="flex:1;min-width:220px"></textarea></div><div><button class="btn primary sm" id="ovApply">' + ic('flag') + 'Apply override</button></div></div></div>';
    return html;
  }
  function fact(k, v) { return '<div class="fact"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>'; }

  function pathTab(r) {
    var html = '';
    if (r.status !== 'APPROVED' && r.status !== 'WITHDRAWN') {
      var p = E.pathToYes(state.data, r.app.id, { today: state.today });
      var opts = p.options;
      html += '<div class="pp-sec"><h4>' + ic('target') + 'Path to yes</h4><p class="muted small" style="margin-bottom:10px">Each change below was tested by re-running every decision, so it already accounts for competition for the same slots.</p><div class="path-list">';
      html += opts.length ? opts.map(function (o, i) {
        var tag = o.side === 'brand' ? '<span class="tag brand">Brand lever</span>' : o.side === 'combined' ? '<span class="tag combo">All together</span>' : '<span class="tag">Applicant</span>';
        var best = o.better && (o.status === 'APPROVED' || o.status === 'CONDITIONAL');
        return '<div class="path-item' + (best && i === 0 ? ' best' : '') + '"><div class="lab">' + tag + esc(o.label) + '</div><div class="res">→ ' + chip(o.status) + ' score ' + o.score + '</div><button class="btn sm" data-path="' + i + '">Apply</button></div>';
      }).join('') : '<p class="empty-note">Nothing on the applicant’s side would change this decision.</p>';
      html += '</div></div>';
      state._path = opts;
    }
    var a = r.app;
    html += '<div class="pp-sec"><h4>' + ic('edit') + 'Try your own what-if</h4><p class="muted small" style="margin-bottom:10px">Change anything below and see the decision update live. Nothing is saved until you click Apply.</p>' +
      '<div class="whatif-form" id="wf">' +
      '<label>Investment (₹ lakh)<input type="number" step="0.5" min="0" data-f="investment" value="' + (a.investment === null || a.investment === undefined ? '' : a.investment) + '"></label>' +
      '<label>Retail experience (yrs)<input type="number" min="0" data-f="experience" value="' + (a.experience === null || a.experience === undefined ? '' : a.experience) + '"></label>' +
      '<label>Target launch (months)<input type="number" min="0" data-f="launchMonths" value="' + (a.launchMonths === null || a.launchMonths === undefined ? '' : a.launchMonths) + '"></label>' +
      '<label>Space<select data-f="space">' + ['Owned', 'Rented', 'Not yet identified'].map(function (s) { return '<option' + (a.space === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label>Floor<select data-f="floor">' + ['Ground', 'Mall unit', 'Upper', 'Not known'].map(function (s) { return '<option' + (a.floor === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label>Size (sq ft)<input type="number" min="0" step="10" data-f="size" value="' + (a.size || '') + '"></label>' +
      '<label>Pin code<input data-f="pin" value="' + esc(a.pin) + '" maxlength="6"></label>' +
      '<label>City<select data-f="city">' + Object.keys(E.CITIES).map(function (c) { return '<option' + (a.city === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label>Language<select data-f="language">' + ['Kannada', 'Hindi', 'English'].map(function (s) { return '<option' + (a.language === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '</div><div class="whatif-out" id="wfOut"><span class="muted">Change a field to preview.</span></div>' +
      '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn primary sm" id="wfApply" disabled>' + ic('check') + 'Apply as update</button><button class="btn sm" id="wfReset">Reset</button></div></div>';
    return html;
  }
  function whatIfData(r) {
    var d = H.clone(state.data);
    var a = d.applications.filter(function (x) { return x.id === r.app.id; })[0];
    var changes = [];
    document.querySelectorAll('#wf [data-f]').forEach(function (el) {
      var f = el.getAttribute('data-f'), v = el.value;
      if (['investment', 'experience', 'launchMonths', 'size'].indexOf(f) >= 0) v = v === '' ? null : parseFloat(v);
      if (f === 'pin') v = H.normPin(v);
      var cur = a[f] === undefined ? null : a[f];
      if (String(v) !== String(cur)) { changes.push([f, cur, v]); a[f] = v; if (f === 'space' || f === 'floor') a.spaceUpdated = true; }
    });
    if (a.space === 'Not yet identified') a.size = null;
    return { d: d, changes: changes };
  }
  function wireWhatIf(r) {
    var wf = $('wf'); if (!wf) return;
    var LBL = { investment: 'Investment', experience: 'Experience', launchMonths: 'Launch', space: 'Space', floor: 'Floor', size: 'Size', pin: 'Pin', city: 'City', language: 'Language' };
    function preview() {
      var w = whatIfData(r);
      $('wfApply').disabled = !w.changes.length;
      if (!w.changes.length) { $('wfOut').innerHTML = '<span class="muted">Change a field to preview.</span>'; return; }
      var after = E.evaluate(w.d, { today: state.today });
      var me = after.results.filter(function (x) { return x.app.id === r.app.id; })[0];
      var ch = C.diff(state.result, after).filter(function (c) { return c.id !== r.app.id && c.from !== c.to; });
      $('wfOut').innerHTML = '<b>' + chip(r.status) + ' → ' + chip(me.status) + '</b> &nbsp;score ' + r.score + ' → <b>' + me.score + '</b><div class="muted small" style="margin-top:4px">' + esc(me.headline) + '</div>' +
        (ch.length ? '<div style="margin-top:6px"><b class="small">Knock-on:</b><ul>' + ch.map(function (c) { return '<li>' + esc(c.id) + ': ' + chip(c.from) + ' → ' + chip(c.to) + '</li>'; }).join('') + '</ul></div>' : '');
    }
    wf.addEventListener('input', preview);
    wf.addEventListener('change', preview);
    $('wfReset').addEventListener('click', function () { openPassport(r.app.id, 'path', true); });
    $('wfApply').addEventListener('click', function () {
      var w = whatIfData(r);
      if (!w.changes.length) return;
      var a = w.d.applications.filter(function (x) { return x.id === r.app.id; })[0];
      var label = r.app.id + ': ' + w.changes.map(function (c) { return LBL[c[0]] + ' → ' + (c[2] === null ? 'blank' : c[2]); }).join(', ');
      a.updates = (a.updates || []).concat([label]);
      var out = C.commitChange(state, w.d, '<p><b>What-if applied</b> - ' + esc(label) + '</p>', [r.app.id]);
      commit(out, label, 'update');
      bot(out.html);
      toast('Applied - every decision re-ran');
    });
  }

  function planTab(r) {
    var p = r.plan, a = r.app;
    var step = function (re) { return p.steps.filter(function (s) { return re.test(s.name); })[0]; };
    var agr = step(/Agreement/), audit = step(/Site audit/), fit = step(/Fit-out/), tr = step(/training/i);
    var stops = [['Applied', 'done', ''], ['Decision', 'done', fmtShort(state.today.toISOString())], ['Agreement', 'now', agr ? fmtShort(agr.endISO) : ''], ['Site ready', '', audit ? fmtShort(audit.endISO) : ''],
      ['Fit-out', '', fit ? fmtShort(fit.endISO) : ''], ['Trained', '', tr ? fmtShort(tr.endISO) : ''], ['Open', '', fmtShort(p.launchISO)]];
    var html = '<div class="pp-sec"><h4>' + ic('rocket') + 'Journey to opening · ' + esc(p.launchDate) + '</h4><div class="journey">' + stops.map(function (s, i) {
      return '<div class="st ' + s[1] + (i <= 1 ? ' done' : '') + '"><span class="bub">' + (s[1] === 'done' ? icon('check') : i + 1) + '</span><b>' + s[0] + '</b><span>' + s[2] + '</span></div>';
    }).join('') + '</div></div>';
    if (p.festival) html += '<div class="callout ' + (p.festival.ok ? 'ok' : '') + '">' + ic(p.festival.ok ? 'check' : 'alert') + '<span>' + esc(p.festival.text) + '</span></div>';
    if (p.gapMonths > 0.5) html += '<div class="callout">' + ic('clock') + '<span>Realistic opening is ~' + p.launchMonths + ' months away; the applicant hoped for ' + p.targetMonths + '. Reset expectations on the welcome call.</span></div>';
    html += '<div class="pp-sec"><h4>' + ic('check') + 'What the partner does next</h4><ul class="todo">' + p.nextSteps.map(function (s) { return '<li class="' + (s.by === 'Condition' ? 'cond' : '') + '"><b>' + esc(s.by) + '</b><span>' + esc(s.text) + '</span></li>'; }).join('') + '</ul></div>';
    var span = Math.max.apply(null, p.steps.map(function (s) { return s.end; }));
    html += '<div class="pp-sec"><h4>' + ic('calendar') + 'Week-by-week plan</h4><div class="mini-gantt">' + p.steps.map(function (s) {
      var cls = /Site search|condition/i.test(s.name) ? 'site' : /training/i.test(s.name) ? 'train' : /opening/i.test(s.name) ? 'open' : /Fit-out|Hire/.test(s.name) ? 'fit' : '';
      return '<div class="mg-row"><div><b>' + esc(s.name) + '</b><small>' + esc(s.owner) + ' · wk ' + s.start + '–' + s.end + '</small></div><div class="mg-track" title="' + esc(s.detail) + '"><span class="mg-bar ' + cls + '" style="left:' + (s.start / span * 100) + '%;width:' + Math.max(2, (s.end - s.start) / span * 100) + '%"></span></div></div>';
    }).join('') + '</div></div>';
    html += '<div class="pp-sec"><h4>' + ic('graduation') + 'How they’ll be prepared to run the store</h4><div class="facts">' +
      fact('Track', p.training.track) + fact('Language', p.training.language) + fact('Duration', p.training.weeks + ' week(s)') + fact('Shadow store', p.training.shadowStore) + fact('Staff to hire', p.staff + ' people') + '</div>' +
      '<ul class="reasons" style="margin-top:12px">' + p.training.modules.map(function (m) { return '<li>' + mk('+') + '<span>' + esc(m.name) + ' <span class="muted">· ' + m.days + ' day' + (m.days > 1 ? 's' : '') + '</span></span></li>'; }).join('') + '</ul>' +
      '<p class="muted small" style="margin-top:10px">After opening: weekly sales call for the first month, then 30/60/90-day reviews with the area manager.</p></div>';
    html += '<div class="pp-sec"><h4>' + ic('bolt') + 'Unit economics (estimate)</h4><div class="econ">' + fact('Setup cost', H.fmtL(p.economics.setupCost)) + fact('Sales / month', H.fmtL(p.economics.monthlySales)) + fact('Partner profit / month', H.fmtL(p.economics.monthlyProfit)) + fact('Payback', '~' + p.economics.paybackMonths + ' months') + '</div></div>';
    return html;
  }

  function messageTab(r) {
    var lang = state.msgLang[r.app.id] || (M.languages.indexOf(r.app.language) >= 0 ? r.app.language : 'English');
    var d = M.draft(r, lang);
    var now = new Date();
    return '<div class="pp-sec"><h4>' + ic('message') + 'Message to ' + esc((r.app.name || '').split(' ')[0] || r.app.id) + '</h4>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px"><div class="langs">' + M.languages.map(function (l) {
        return '<button data-lang="' + l + '" class="' + (l === lang ? 'active' : '') + '">' + (l === 'Kannada' ? 'ಕನ್ನಡ' : l === 'Hindi' ? 'हिन्दी' : 'English') + '</button>';
      }).join('') + '</div><span class="muted small">Preferred: ' + esc(r.app.language) + '</span></div>' +
      '<div class="phone"><div class="bubble ' + langCls(lang) + '" id="msgText">' + esc(d.text) + '</div><div class="bubble-meta"><span>To: ' + esc(r.app.name || r.app.id) + '</span><span>' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ✓✓</span></div></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px;justify-content:center"><button class="btn primary" id="copyMsg">' + ic('copy') + 'Copy message</button></div>' +
      '<p class="muted small" style="text-align:center;margin-top:10px">Written from the decision itself, so it always matches. Nothing is sent automatically.</p></div>';
  }

  // ------------------------------------------------------------------ assistant
  function addMsg(who, html) {
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html;
    $('chatBody').appendChild(d);
    $('chatBody').scrollTop = $('chatBody').scrollHeight;
    return d;
  }
  function bot(html) { return addMsg('bot', html); }
  function greet() {
    $('chatBody').innerHTML = '';
    var c = counts();
    bot('<p><b>Done.</b> ' + state.result.results.length + ' applications decided across ' + state.result.territories.length + ' territories.</p><p>' +
      Object.keys(E.STATUS).filter(function (s) { return c[s]; }).map(function (s) { return chip(s) + ' ' + c[s]; }).join(' &nbsp;') +
      '</p><p>Ask me why about anyone, or give me news, e.g. <i>“' + esc(sampleId('APPROVED')) + ' has withdrawn”</i>, and I’ll re-run every decision.</p>');
    setChips();
  }
  function ask(text) {
    text = String(text || '').trim();
    if (!text) return;
    addMsg('user', esc(text));
    var typing = bot('<span class="typing"><span></span><span></span><span></span></span>');
    setTimeout(function () {
      typing.remove();
      var out = C.respond(text, state);
      if (out.undo) {
        var last = state.log[state.log.length - 1];
        if (undo()) bot('<p>Undone: “' + esc(last ? last.text : 'last update') + '”. Every decision is back to how it was.</p>');
        else bot('<p>Nothing to undo.</p>');
        return;
      }
      bot(out.html);
      if (out.committed) {
        var kind = /^(approve|reject|hold|put|override|wait|remove override|clear override)/i.test(text) ? 'override' : /^(new|add|another)/i.test(text) ? 'add' : 'update';
        commit(out, text, kind);
      }
      if (out.view) setView(out.view);
      if (out.tab === 'message' && out.focus) openPassport(out.focus, 'message');
      else if (out.focus && state.pp) openPassport(out.focus, state.pp === out.focus ? state.ppTab : 'decision');
    }, 280);
  }
  function setChips() {
    var s = [];
    if (state.result) {
      var R = state.result.results;
      var hold = R.filter(function (r) { return r.status === 'HOLD'; })[0];
      var wait = R.filter(function (r) { return r.status === 'WAITLIST'; })[0];
      var appr = R.filter(function (r) { return r.status === 'APPROVED'; })[0];
      var rej = R.filter(function (r) { return r.status === 'REJECTED'; })[0];
      var nospace = R.filter(function (r) { return r.app.space === 'Not yet identified' && (r.status === 'WAITLIST' || r.status === 'CONDITIONAL'); })[0];
      if (hold) s.push('Why is ' + hold.app.id + ' on hold?');
      if (nospace) s.push(nospace.app.id + ' has now found a ground-floor space');
      if (appr) s.push(appr.app.id + ' has withdrawn');
      if (rej) s.push('What would it take for ' + rej.app.id + ' to be approved?');
      if (wait) s.push('Draft a message for ' + wait.app.id + ' in ' + (wait.app.language === 'English' ? 'Kannada' : wait.app.language));
      s.push('Training cohorts', 'Help');
      if (state.history.length) s.unshift('Undo');
    } else s = ['Help'];
    $('chips').innerHTML = s.slice(0, 7).map(function (q) { return '<button type="button" data-ask="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
  }

  // ------------------------------------------------------------------ modals
  function modal(html) { $('modalCard').innerHTML = '<button class="icon-btn" data-close-modal aria-label="Close">' + icon('x') + '</button>' + html; $('modal').classList.remove('hidden'); hydrate($('modalCard')); }
  function closeModal() { $('modal').classList.add('hidden'); }

  function guide() {
    var tries1 = ['Why is APP-007 on hold?', 'Next steps for APP-002', 'Compare APP-003 and APP-004', 'What would it take for APP-018 to be approved?', 'Training cohorts'];
    var tries2 = ['APP-012 has now found a ground-floor space', 'APP-002 has withdrawn', 'TER-02 now has 2 open slots', 'New applicant APP-030 Kavya Rao, Tumakuru 572102, 25 lakh, 4 years experience, rented ground floor 500 sq ft, Kannada', 'Approve APP-020 because the site is next to a college', 'undo'];
    modal('<h2>Test FranchiseFlow in 2 minutes</h2><p class="muted">No login, no setup. Everything runs in this browser tab.</p><div class="steps-guide">' +
      '<div><span class="n">1</span><div><b>Load data</b>Click <b>Upload Excel</b> and choose your Applications + Territories file (Existing stores is built in), or use the sample data. Sheets and columns are matched by content, so small template differences are fine.' + (state.result ? '' : '<div class="try"><button data-sample>Load sample data</button></div>') + '</div></div>' +
      '<div><span class="n">2</span><div><b>See every decision</b><b style="display:inline;font-weight:500">Overview</b> shows the funnel and what needs attention; <b style="display:inline">Decisions</b> is a board by outcome; <b style="display:inline">Map</b> shows every pin (one store per pin, always); <b style="display:inline">Onboarding</b> has the opening calendar and training cohorts. Click any applicant for their full passport: why, path to yes, onboarding plan and a message in their language.</div></div>' +
      '<div><span class="n">3</span><div><b>Ask about decisions</b>Type in the assistant on the right, or click:<div class="try">' + tries1.map(function (t) { return '<button data-ask="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div></div></div>' +
      '<div><span class="n">4</span><div><b>Give it new information</b>Every update re-runs all decisions and shows knock-on effects. <i>What if…</i> previews without saving; <i>undo</i> reverts.<div class="try">' + tries2.map(function (t) { return '<button data-ask="' + esc(t) + '">' + esc(t.length > 60 ? t.slice(0, 58) + '…' : t) + '</button>'; }).join('') + '</div></div></div>' +
      '<div><span class="n">5</span><div><b>Take it away</b><b style="display:inline;font-weight:500">Export</b> downloads every decision, reason, plan and message as Excel. <a href="#" data-how>How decisions are made →</a></div></div></div>');
  }

  function how() {
    var A = E.ASSUMPTIONS;
    modal('<h2>How decisions are made</h2><p class="muted">Rules you can read, not a black box: the same file always gives the same answer, and every decision lists its reasons. These values are our starting assumptions; in a real rollout the expansion team tunes them.</p>' +
      '<h3>1 · Hard rules first</h3><ul><li><b>Never two stores in one pin code</b> - not next to an existing store, and only one partner per pin.</li><li>City and pin must agree; the pin must sit in a target territory; investment must be stated. Otherwise <b>On hold</b>, with the exact question to ask.</li><li>Investment below ' + Math.round(A.rejectBelowRatio * 100) + '% of the setup cost, or fit below ' + A.minScoreToProceed + ' → <b>Rejected</b> (with a way back).</li><li>Same name + city twice → the weaker row is held as a duplicate.</li></ul>' +
      '<h3>2 · Fit score out of 100</h3><table><tr><th>Factor</th><th>Pts</th><th>How</th></tr>' +
      '<tr><td>Funds</td><td>25</td><td>Investment vs setup cost: Tier 1 ₹' + A.setupCost[1] + ' L · Tier 2 ₹' + A.setupCost[2] + ' L · Tier 3 ₹' + A.setupCost[3] + ' L. 70–100% = condition to close the gap.</td></tr>' +
      '<tr><td>Space</td><td>25</td><td>Ground floor best, mall next, upper floor weak (about half the walk-ins); ' + A.idealSpaceSqft[0] + '–' + A.idealSpaceSqft[1] + ' sq ft ideal; under ' + A.minSpaceSqft + ' too small.</td></tr>' +
      '<tr><td>Experience</td><td>20</td><td>Diminishing returns: 1 yr ≈ 6, 3 yrs ≈ 13, 8+ yrs ≈ 19.</td></tr>' +
      '<tr><td>Business</td><td>10</td><td>Read from free text: retail 10, other business 6, salaried 3.</td></tr>' +
      '<tr><td>Timeline</td><td>10</td><td>Target vs realistic onboarding (~10 weeks with a site, +6 without).</td></tr>' +
      '<tr><td>Priority</td><td>10</td><td>Territory priority: High 10 · Medium 6 · Low 3.</td></tr>' +
      '<tr><td>Adjustments</td><td>±</td><td>Next door to our store (−6, cannibalisation); contradictions in the form; signals in notes: loan dependency, “just exploring”, absentee owner, competing brand (−); ran a franchise before (+).</td></tr></table>' +
      '<h3>3 · Allocation</h3><p>Per territory, the best score gets a slot first, one pin each. If someone’s pin is taken (by our store or a higher scorer), moving costs them their shop, so they compete at a <b>relocation score</b> (space points reset) and, if still strong enough, get a free pin nobody else asked for.</p>' +
      '<h3>4 · Confidence</h3><p>Close calls (≤3 points), contradictory forms and borderline rejects are flagged <b>Review</b>. Managers can override any decision with a reason; overrides are logged and can’t break the one-store-per-pin rule.</p>' +
      '<h3>5 · Onboarding</h3><p>Agreement & KYC (2 wks) → site audit (1) → fit-out (5–7 by tier) with hiring in parallel → training in the partner’s language (1-week fast track, or 3 weeks with shadow shifts if new to retail) at the nearest existing store → soft launch → 30/60/90-day reviews.</p>');
  }

  function addForm() {
    var nums = state.data.applications.map(function (a) { return H.canonicalAppId(a.id) || 0; });
    var next = 'APP-' + String(Math.max.apply(null, nums.concat([0])) + 1).padStart(3, '0');
    modal('<h2>Add an applicant</h2><p class="muted">Same fields as the Applications sheet. Every decision re-runs when you add.</p><form id="addFormEl"><div class="form-grid">' +
      '<label>Application ID<input name="id" value="' + next + '" required></label><label class="two">Applicant name<input name="name" required placeholder="e.g. Kavya Rao"></label>' +
      '<label>City<select name="city">' + Object.keys(E.CITIES).map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label><label>Pin code<input name="pin" maxlength="6" placeholder="6 digits"></label><label>Investment (₹ lakh)<input name="investment" type="number" step="0.5" min="0"></label>' +
      '<label>Retail experience (yrs)<input name="experience" type="number" min="0"></label><label class="two">Current / past business<input name="business" placeholder="e.g. Runs a footwear store"></label>' +
      '<label>Space available<select name="space"><option>Owned</option><option>Rented</option><option selected>Not yet identified</option></select></label><label>Space size (sq ft)<input name="size" type="number" min="0"></label><label>Floor<select name="floor"><option>Ground</option><option>Upper</option><option>Mall unit</option><option selected>Not known</option></select></label>' +
      '<label>Target launch (months)<input name="launch" type="number" min="0"></label><label>Preferred language<select name="language"><option>Kannada</option><option>English</option><option>Hindi</option></select></label><label></label>' +
      '<label class="wide">Notes from applicant<textarea name="notes"></textarea></label></div>' +
      '<div class="modal-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button class="btn primary" type="submit">' + ic('plus') + 'Add and re-run</button></div></form>');
    $('addFormEl').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target), row = {};
      f.forEach(function (v, k) { row[k] = v; });
      if (state.data.applications.some(function (a) { return a.id === row.id; })) { toast(row.id + ' already exists', true); return; }
      var app = E.normaliseApplication(row);
      app.added = true;
      var d = H.clone(state.data);
      d.applications.push(app);
      var out = C.commitChange(state, d, '<p><b>Added ' + esc(app.id) + '</b> (' + esc(app.name) + ', ' + esc(app.city) + ' ' + esc(app.pin) + ').</p>', [app.id]);
      commit(out, 'Added ' + app.id + ' ' + app.name, 'add');
      closeModal();
      bot(out.html);
      openPassport(app.id, 'decision');
    });
  }

  // ------------------------------------------------------------------ export
  function exportXlsx() {
    var rows = state.result.results.map(function (r) {
      var p = r.plan;
      return {
        'Application ID': r.app.id, 'Applicant': r.app.name, 'City': r.app.city, 'Pin code': r.app.pin, 'Territory': r.territoryId || '', 'Store pin (if relocated)': r.proposedPin || '',
        'Decision': r.statusLabel, 'Fit score': r.score, 'Confidence': r.confidence + (r.reviewNote ? ' - ' + r.reviewNote : ''), 'Why (summary)': r.headline,
        'Reasons': r.blocking.map(function (b) { return '- ' + b.text; }).concat(r.reasons.map(function (x) { return (x.t === '+' ? '+ ' : x.t === '-' ? '- ' : '• ') + x.text; })).join('\n'),
        'Conditions': r.conditions.join('\n'), 'Next steps': p ? p.nextSteps.map(function (s) { return s.by + ': ' + s.text; }).join('\n') : r.actions.join('\n'),
        'Est. opening': p ? p.launchDate : '', 'Training': p ? p.training.track + ' in ' + p.training.language + '; shadow at ' + p.training.shadowStore : '',
        'Payback (months)': p ? p.economics.paybackMonths : '', 'Message (preferred language)': M.draft(r).text, 'Data issues': r.flags.join('; ')
      };
    });
    var ters = state.result.territories.map(function (t) { return { 'Territory ID': t.id, 'City': t.city, 'Tier': t.tier, 'Priority': t.priority, 'Open slots': t.slots, 'Allocated': t.allocated.join(', '), 'Waitlist': t.waitlist.join(', '), 'Free pins': t.freePins.join(', ') }; });
    var pf = E.portfolio(state.result);
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [10, 18, 14, 9, 9, 10, 12, 8, 30, 60, 80, 60, 70, 12, 50, 10, 70, 40].map(function (w) { return { wch: w }; });
    XLSX.utils.book_append_sheet(wb, ws, 'Decisions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ters), 'Territory allocation');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pf.openings.map(function (o) { return { 'Opening': o.launchDate, 'Application ID': o.id, 'Partner': o.name, 'City': o.city, 'Decision': E.STATUS[o.status].label, 'Training language': o.language }; })), 'Opening calendar');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pf.cohorts.map(function (c) { return { 'Language': c.language, 'Month': c.month, 'Partners': c.members.map(function (m) { return m.id + ' ' + m.name; }).join(', ') }; })), 'Training cohorts');
    if (state.log.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.log.map(function (l) { return { Time: l.when.toLocaleString(), Update: l.text, Type: l.kind }; })), 'Change log');
    XLSX.writeFile(wb, 'FranchiseFlow_Decisions.xlsx');
    toast('Exported FranchiseFlow_Decisions.xlsx');
  }

  // ------------------------------------------------------------------ chat dock
  function setChat(open) {
    $('shell').classList.toggle('chat-closed', !open);
    $('chatFab').classList.toggle('hidden', open);
    if (open && window.innerWidth > 960) $('chatText').focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ events
  hydrate();
  $('fileInput').addEventListener('change', function (e) { handleFile(e.target.files[0]); e.target.value = ''; });
  $('btnSample').addEventListener('click', function () { loadSheets(window.SAMPLE_SHEETS, 'Sample data (23 applicants)'); });
  $('btnGuide').addEventListener('click', guide);
  $('btnAdd').addEventListener('click', addForm);
  $('btnExport').addEventListener('click', exportXlsx);
  $('brandHome').addEventListener('click', function (e) { e.preventDefault(); if (state.result) setView('overview'); });
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-view]'); if (b) setView(b.getAttribute('data-view')); });
  $('search').addEventListener('input', function (e) { state.search = e.target.value; renderDecisions(); hydrate(); });
  $('cityFilter').addEventListener('change', function (e) { state.city = e.target.value; renderDecisions(); hydrate(); });
  $('modeSeg').addEventListener('click', function (e) { var b = e.target.closest('button[data-mode]'); if (b) { state.mode = b.getAttribute('data-mode'); renderDecisions(); hydrate(); } });
  $('chatForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('chatText').value; $('chatText').value = ''; ask(v); });
  $('chatMin').addEventListener('click', function () { setChat(false); });
  $('chatFab').addEventListener('click', function () { setChat(true); });
  $('scrim').addEventListener('click', closePassport);
  $('modal').addEventListener('click', function (e) { if (e.target === $('modal') || e.target.closest('[data-close-modal]')) closeModal(); });
  $('due').addEventListener('change', function (e) { var k = e.target.getAttribute('data-due'); if (k) state.dueDone[k] = e.target.checked; });
  $('mapSvg').addEventListener('click', function (e) { var g = e.target.closest('[data-city]'); if (g) { state.mapCity = g.getAttribute('data-city'); renderMap(); hydrate(); } });
  $('mapSvg').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var g = e.target.closest('[data-city]'); if (g) { state.mapCity = g.getAttribute('data-city'); renderMap(); } } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('modal').classList.contains('hidden')) closeModal(); else closePassport(); } });

  // delegated clicks
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-ask]'))) { e.preventDefault(); closeModal(); setChat(true); ask(t.getAttribute('data-ask')); return; }
    if ((t = e.target.closest('[data-sample]'))) { e.preventDefault(); closeModal(); $('btnSample').click(); return; }
    if ((t = e.target.closest('[data-how]'))) { e.preventDefault(); how(); return; }
    if ((t = e.target.closest('#passport [data-pptab]'))) { e.preventDefault(); openPassport(state.pp, t.getAttribute('data-pptab')); return; }
    if ((t = e.target.closest('#ppClose'))) { closePassport(); return; }
    if ((t = e.target.closest('#passport [data-lang]'))) { state.msgLang[state.pp] = t.getAttribute('data-lang'); openPassport(state.pp, 'message', true); return; }
    if ((t = e.target.closest('#copyMsg'))) {
      var txt = $('msgText').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('Message copied'); }, function () {
        var r = document.createRange(); r.selectNodeContents($('msgText')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected - press Ctrl+C to copy');
      });
      return;
    }
    if ((t = e.target.closest('#ovApply'))) {
      var reason = $('ovReason').value.trim();
      if (!reason) { toast('Add a reason - overrides are logged', true); $('ovReason').focus(); return; }
      var st = $('ovStatus').value;
      var d = H.clone(state.data);
      d.applications.filter(function (x) { return x.id === state.pp; })[0].override = { status: st, reason: reason, at: new Date().toISOString() };
      var out = C.commitChange(state, d, '<p><b>Manager override</b>: ' + esc(state.pp) + ' → ' + chip(st) + ' <span class="muted">(“' + esc(reason) + '”)</span></p>', [state.pp]);
      commit(out, 'Override ' + state.pp + ' → ' + E.STATUS[st].label + ': ' + reason, 'override');
      bot(out.html);
      toast('Override applied - every decision re-ran');
      return;
    }
    if ((t = e.target.closest('#ovClear'))) {
      var d2 = H.clone(state.data);
      delete d2.applications.filter(function (x) { return x.id === state.pp; })[0].override;
      var out2 = C.commitChange(state, d2, '<p><b>Override removed</b> for ' + esc(state.pp) + '.</p>', [state.pp]);
      commit(out2, 'Removed override on ' + state.pp, 'override');
      bot(out2.html);
      return;
    }
    if ((t = e.target.closest('[data-path]'))) {
      var o = state._path[+t.getAttribute('data-path')];
      var d3 = H.clone(state.data), id = state.pp;
      var a = d3.applications.filter(function (x) { return x.id === id; })[0];
      Object.keys(o.patch || {}).forEach(function (k) { a[k] = k === 'clearedSignals' ? (a.clearedSignals || []).concat(o.patch[k]) : o.patch[k]; });
      if (o.ter) d3.territories.forEach(function (x) { if (x.id === o.ter.id) x.slots = o.ter.slots; });
      a.updates = (a.updates || []).concat(['Path to yes: ' + o.label]);
      var out3 = C.commitChange(state, d3, '<p><b>Path to yes applied</b> for ' + esc(id) + ': ' + esc(o.label) + '</p>', [id]);
      commit(out3, id + ': ' + o.label, 'path');
      bot(out3.html);
      toast('Applied - every decision re-ran');
      return;
    }
    if ((t = e.target.closest('[data-filter]'))) {
      var f = t.getAttribute('data-filter');
      state.search = ''; $('search').value = '';
      setView('decisions');
      var col = { APPROVED: 0, CONDITIONAL: 1, WAITLIST: 2, HOLD: 3, REJECTED: 4, WITHDRAWN: 4 }[f];
      var cols = document.querySelectorAll('#board .col');
      if (cols[col]) { cols[col].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); cols[col].animate([{ boxShadow: '0 0 0 3px var(--primary)' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1600 }); }
      return;
    }
    if ((t = e.target.closest('.ter[data-city]'))) { state.mapCity = t.getAttribute('data-city'); setView('map'); return; }
    if ((t = e.target.closest('[data-goto]'))) { setView(t.getAttribute('data-goto')); return; }
    if ((t = e.target.closest('[data-app]'))) { e.preventDefault(); openPassport(t.getAttribute('data-app'), 'decision'); return; }
  });

  // drag & drop anywhere
  ['dragenter', 'dragover'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }); });
  document.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleFile(f); });

  // initial
  $('shell').classList.add('chat-closed'); // landing gets the full width; the assistant opens once data is loaded
  bot('<p>Hi! I’m the FranchiseFlow assistant. Load the sample data or upload your Excel, then ask me <i>why</i> about any decision, or tell me what changed. I’ll re-run everything instantly.</p>');
  $('chips').innerHTML = '<button type="button" data-sample>Load sample data</button><button type="button" data-ask="Help">What can you do?</button>';
  state.view = 'landing';
})();
