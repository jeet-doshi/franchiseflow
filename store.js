/* Veloce shared data layer: what the Partner Portal and the expansion dashboard both read and write.
 *
 * Every action (submit, question, answer, decision...) is an append-only event. State is rebuilt by
 * replaying events, so two people writing at once never overwrite each other.
 *  - Live mode: events are stored in a Google Sheet through an Apps Script web app (window.VELOCE_DB_URL),
 *    so the portal on a phone and the dashboard on a laptop see the same data within seconds.
 *  - Offline fallback: if no URL is set or the Sheet can't be reached, events stay in this browser
 *    (localStorage, synced across tabs) and are pushed to the Sheet when it comes back.
 * Each dashboard works in its own workspace (?ws=CODE), so different testers never see each other's applicants.
 */
(function (root) {
  'use strict';
  var DB_URL = root.VELOCE_DB_URL || '';
  var POLL_MS = 4000;

  // ---------------------------------------------------------------- workspace
  function cleanWs(v) { return String(v || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24); }
  var qs = new URLSearchParams(root.location ? root.location.search : '');
  var isDashboard = !!root.FRANCHISEFLOW_DASHBOARD;
  var ws = cleanWs(qs.get('ws'));
  if (!ws && isDashboard) {
    try { ws = cleanWs(localStorage.getItem('veloce.ws')); } catch (e) { /* ignore */ }
    if (!ws) ws = 'V' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }
  if (!ws) ws = 'public';
  if (isDashboard) { try { localStorage.setItem('veloce.ws', ws); } catch (e) { /* ignore */ } }

  // ---------------------------------------------------------------- state
  var LKEY = 'veloce.events.' + ws;
  var events = [], seen = {}, pending = {}, cursor = 0;
  var mode = DB_URL ? 'connecting' : 'local';
  var listeners = [];
  var db = empty();

  function empty() { return { plan: null, apps: [], decisions: {} }; }
  function now() { return new Date().toISOString(); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function find(id) { return db.apps.filter(function (a) { return a.id === id; })[0]; }
  function notify(why) { listeners.forEach(function (fn) { try { fn(why); } catch (e) { console.error(e); } }); }

  function apply(ev) {
    var a = ev.appId ? find(ev.appId) : null, p = ev.payload || {};
    switch (ev.type) {
      case 'submit':
        if (a) return;
        db.apps.push(Object.assign({}, p, { id: ev.appId, source: 'portal', submittedAt: ev.ts, updatedAt: ev.ts, updates: [],
          messages: [{ id: ev.uid, from: 'system', kind: 'note', key: 'submitted', at: ev.ts }] }));
        break;
      case 'ask':
        if (!a) return;
        a.messages.push({ id: ev.uid, from: 'team', kind: 'question', key: p.key || 'custom', text: p.text || '', at: ev.ts, answered: false });
        a.updatedAt = ev.ts;
        break;
      case 'answer':
        if (!a) return;
        a.messages.forEach(function (m) { if (m.id === p.msgId) { m.answered = true; m.answeredAt = ev.ts; } });
        Object.keys(p.patch || {}).forEach(function (k) {
          var v = p.patch[k];
          if (k === 'clearedSignals') a.clearedSignals = (a.clearedSignals || []).concat(v).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
          else if (k === 'noteAppend') a.notes = (a.notes ? a.notes + ' ' : '') + v;
          else a[k] = v;
        });
        if (p.patch && (p.patch.space || p.patch.floor)) a.spaceUpdated = true;
        a.messages.push({ id: ev.uid, from: 'applicant', kind: 'reply', replyTo: p.msgId, text: p.summary || '', at: ev.ts, unread: true });
        a.updates = (a.updates || []).concat(['Portal reply: ' + (p.summary || '')]);
        a.updatedAt = ev.ts;
        break;
      case 'read':
        if (a) a.messages.forEach(function (m) { if (m.at <= ev.ts) m.unread = false; });
        break;
      case 'withdraw':
        if (!a) return;
        a.withdrawn = true; a.updatedAt = ev.ts;
        a.messages.push({ id: ev.uid, from: 'applicant', kind: 'reply', text: 'Withdrew the application', at: ev.ts, unread: true });
        break;
      case 'plan': db.plan = p; break;
      case 'decision': db.decisions[ev.appId] = p; break;
    }
  }
  function rebuild() {
    events.sort(function (x, y) { return x.ts < y.ts ? -1 : x.ts > y.ts ? 1 : (x.uid < y.uid ? -1 : 1); });
    db = empty();
    events.forEach(apply);
  }

  // ---------------------------------------------------------------- local persistence
  function saveLocal() {
    try { localStorage.setItem(LKEY, JSON.stringify({ events: events, cursor: cursor, pending: Object.keys(pending) })); } catch (e) { /* storage full or blocked */ }
  }
  function loadLocal() {
    try {
      var d = JSON.parse(localStorage.getItem(LKEY) || 'null');
      if (!d) return;
      events = d.events || []; cursor = d.cursor || 0;
      events.forEach(function (e) { seen[e.uid] = true; });
      (d.pending || []).forEach(function (u) { pending[u] = true; });
    } catch (e) { /* ignore */ }
  }
  if (root.addEventListener) root.addEventListener('storage', function (e) {
    if (e.key !== LKEY) return;
    var before = events.length;
    loadLocal(); rebuild();
    if (events.length !== before) notify('remote');
  });

  function emit(type, appId, payload) {
    var ev = { uid: uid(), ts: now(), type: type, appId: appId || '', payload: payload || {} };
    events.push(ev); seen[ev.uid] = true; pending[ev.uid] = true;
    apply(ev);
    saveLocal();
    notify('local');
    flush();
    return ev;
  }

  // ---------------------------------------------------------------- remote (Google Sheet via Apps Script)
  var flushing = false;
  function setMode(m) { if (m !== mode) { mode = m; notify('mode'); } }
  function flush() {
    if (!DB_URL || flushing) return;
    var out = events.filter(function (e) { return pending[e.uid]; });
    if (!out.length) return;
    flushing = true;
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
    fetch(DB_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ws: ws, events: out }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error || 'write failed');
        out.forEach(function (e) { delete pending[e.uid]; });
        saveLocal(); setMode('live');
      })
      .catch(function () { setMode('offline'); })
      .then(function () { flushing = false; });
  }
  var polling = false;
  function poll() {
    if (!DB_URL || polling) return;
    if (root.document && root.document.hidden && mode === 'live') return;
    polling = true;
    fetch(DB_URL + '?ws=' + encodeURIComponent(ws) + '&after=' + cursor)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error('read failed');
        var added = 0;
        (res.events || []).forEach(function (e) { if (!seen[e.uid]) { seen[e.uid] = true; events.push(e); added++; } });
        cursor = res.last || cursor;
        if (added) { rebuild(); saveLocal(); notify('remote'); }
        setMode('live');
        flush();
      })
      .catch(function () { setMode('offline'); })
      .then(function () { polling = false; });
  }

  loadLocal(); rebuild();
  if (DB_URL) { poll(); setInterval(poll, POLL_MS); }
  if (root.document) root.document.addEventListener('visibilitychange', function () { if (!root.document.hidden) poll(); });

  // ---------------------------------------------------------------- public API
  function base() { return root.location ? root.location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '') : ''; }
  var api = {
    subscribe: function (fn) { listeners.push(fn); },
    apps: function () { return db.apps.slice(); },
    app: function (id) { return find(String(id || '').toUpperCase().trim()) || null; },
    plan: function () { return db.plan; },
    decision: function (id) { return db.decisions[id] || null; },
    workspace: function () { return ws; },
    status: function () { return { mode: mode, ws: ws, live: !!DB_URL, pending: Object.keys(pending).length }; },
    portalUrl: function () { return base() + 'apply.html' + (ws === 'public' ? '' : '?ws=' + ws); },
    dashboardUrl: function () { return base() + 'index.html' + (ws === 'public' ? '?ws=public' : '?ws=' + ws); },
    refresh: poll,

    submit: function (app) {
      var id;
      do { id = 'WEB-' + String(Math.floor(1000 + Math.random() * 9000)); } while (find(id));
      emit('submit', id, app);
      return id;
    },
    ask: function (id, key, text) { return emit('ask', id, { key: key || 'custom', text: text || '' }); },
    answer: function (id, msgId, patch, summary) { return emit('answer', id, { msgId: msgId, patch: patch || {}, summary: summary || '' }); },
    markRead: function (id) {
      var a = find(id);
      if (a && a.messages.some(function (m) { return m.unread; })) emit('read', id, {});
    },
    withdraw: function (id) { return emit('withdraw', id, {}); },
    /** Dashboard publishes the live plan and each portal applicant's decision; only changes are written */
    publish: function (plan, decisions) {
      if (plan && JSON.stringify(plan) !== JSON.stringify(db.plan)) emit('plan', '', plan);
      Object.keys(decisions || {}).forEach(function (id) {
        if (JSON.stringify(decisions[id]) !== JSON.stringify(db.decisions[id])) emit('decision', id, decisions[id]);
      });
    }
  };
  root.VeloceStore = api;
})(this);
