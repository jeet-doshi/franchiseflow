/* FranchiseFlow UI: wires the loader, engine and chat to the page. */
(function () {
  'use strict';
  var E = window.FranchiseEngine, L = window.FranchiseLoader, C = window.FranchiseChat, H = E.helpers;
  var esc = C.esc, chip = C.chip;
  var $ = function (id) { return document.getElementById(id); };

  var state = { data: null, result: null, today: new Date(), history: [], log: [], fileName: '', report: null, filter: '', search: '' };

  // ------------------------------------------------------------------ loading
  function loadSheets(sheets, name) {
    try {
      var parsed = L.parseSheets(sheets);
      state.data = parsed.data;
      state.report = parsed.report;
      state.fileName = name;
      state.history = [];
      state.log = [];
      state.today = new Date();
      state.result = E.evaluate(state.data, { today: state.today });
      $('empty').classList.add('hidden');
      $('results').classList.remove('hidden');
      $('btnExport').classList.remove('hidden');
      render();
      $('chatBody').innerHTML = '';
      var c = counts();
      bot('<p>Processed <b>' + state.result.results.length + ' applications</b> across <b>' + state.result.territories.length + ' territories</b> (' + state.data.stores.length + ' existing stores).</p>' +
        '<p>' + Object.keys(E.STATUS).filter(function (s) { return c[s]; }).map(function (s) { return chip(s) + ' ' + c[s]; }).join(' &nbsp;') + '</p>' +
        '<p>Click any row for the full reasoning and onboarding plan, or ask me - e.g. <i>"Why is ' + pickExample('HOLD') + ' on hold?"</i> or tell me something new.</p>');
      setSuggestions();
    } catch (e) {
      console.error(e);
      toast(e.message || 'Could not read that file.', true);
    }
  }
  function pickExample(status) {
    var r = state.result.results.filter(function (x) { return x.status === status; })[0] || state.result.results[0];
    return r ? r.app.id : 'APP-001';
  }

  function handleFile(file) {
    if (!file) return;
    if (!window.XLSX) { toast('The spreadsheet reader did not load - check your connection and refresh.', true); return; }
    file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, { type: 'array' });
      var sheets = wb.SheetNames.map(function (n) { return { name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) }; });
      loadSheets(sheets, file.name);
    }).catch(function (e) { toast(e.message || 'Could not read that file.', true); });
  }

  // ------------------------------------------------------------------ render
  function counts() {
    var c = {};
    state.result.results.forEach(function (r) { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }

  function render(flashIds) {
    var res = state.result;
    // file bar
    var rep = state.report || { sheetsUsed: {}, warnings: [] };
    $('fileBar').innerHTML = '<span>📄 <b>' + esc(state.fileName) + '</b></span>' +
      '<span>Sheets read: ' + esc(rep.sheetsUsed.applications) + ' · ' + esc(rep.sheetsUsed.territories) + ' · ' + esc(rep.sheetsUsed.stores) + '</span>' +
      '<span>Decided ' + new Date(res.evaluatedAt).toLocaleString() + '</span>' +
      (state.log.length ? '<span>' + state.log.length + ' update(s) applied</span>' : '') +
      (rep.warnings.length ? '<span class="warns">⚠ ' + rep.warnings.map(esc).join(' ') + '</span>' : '');

    // KPIs
    var c = counts();
    var colors = { APPROVED: 'var(--green)', CONDITIONAL: 'var(--amber)', WAITLIST: 'var(--violet)', HOLD: 'var(--slate)', REJECTED: 'var(--red)', WITHDRAWN: 'var(--muted)' };
    var kp = '<button class="kpi' + (state.filter === '' ? ' active' : '') + '" data-f=""><div class="v">' + res.results.length + '</div><div class="l">Applications</div><div class="bar" style="background:var(--primary)"></div></button>';
    ['APPROVED', 'CONDITIONAL', 'WAITLIST', 'HOLD', 'REJECTED'].forEach(function (s) {
      kp += '<button class="kpi' + (state.filter === s ? ' active' : '') + '" data-f="' + s + '"><div class="v">' + (c[s] || 0) + '</div><div class="l">' + E.STATUS[s].label + '</div><div class="bar" style="background:' + colors[s] + '"></div></button>';
    });
    $('kpis').innerHTML = kp;

    $('insights').innerHTML = res.insights.map(function (i) { return '<div class="insight ' + i.level + '">' + esc(i.text) + '</div>'; }).join('');

    // territories
    var totalSlots = 0, filled = 0;
    res.territories.forEach(function (t) { totalSlots += t.slots; filled += t.filled; });
    $('terSub').textContent = filled + ' of ' + totalSlots + ' open slots allocated · struck-through pins already have a store';
    var storePins = {};
    state.data.stores.forEach(function (s) { storePins[s.pin] = s.id; });
    $('terGrid').innerHTML = res.territories.map(function (t) {
      var slots = '';
      for (var i = 0; i < Math.max(t.slots, 1); i++) {
        var id = t.allocated[i], r = id && find(id);
        slots += '<div class="slot' + (r ? (r.status === 'CONDITIONAL' ? ' cond' : ' filled') : '') + '" title="' + (r ? esc(r.app.id + ' ' + r.app.name) : 'open') + '"></div>';
      }
      if (!t.slots) slots = '<div class="muted small">No open slots</div>';
      var apps = res.results.filter(function (r) { return r.territoryId === t.id; }).sort(function (a, b) { return E.STATUS[a.status].order - E.STATUS[b.status].order || b.score - a.score; });
      return '<div class="ter"><div class="ter-top"><div><span class="ter-id">' + esc(t.id) + '</span> <span class="ter-city">' + esc(t.city) + ' · T' + (t.tier || '?') + '</span></div><span class="prio ' + t.priority + '">' + t.priority + '</span></div>' +
        '<div class="slots">' + slots + '</div>' +
        '<div class="ter-apps">' + (apps.length ? apps.map(function (r) { return '<span class="mini chip s-' + r.status.toLowerCase() + '" data-app="' + esc(r.app.id) + '" title="' + esc(r.statusLabel + ' · ' + r.app.name) + '">' + esc(r.app.id) + '</span>'; }).join('') : '<span class="muted small">No applicants yet</span>') + '</div>' +
        '<div class="ter-pins">' + t.pins.map(function (p) { return storePins[p] ? '<span class="store" title="Existing store ' + storePins[p] + '">' + p + '</span>' : p; }).join(', ') + '</div></div>';
    }).join('');

    // table
    var sel = $('statusFilter');
    if (sel.options.length === 1) Object.keys(E.STATUS).forEach(function (s) { var o = document.createElement('option'); o.value = s; o.textContent = E.STATUS[s].label; sel.appendChild(o); });
    sel.value = state.filter;
    var q = state.search.toLowerCase();
    var rows = res.results.filter(function (r) {
      if (state.filter && r.status !== state.filter) return false;
      if (!q) return true;
      return [r.app.id, r.app.name, r.app.city, r.app.pin, r.territoryId, r.statusLabel].join(' ').toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return E.STATUS[a.status].order - E.STATUS[b.status].order || b.score - a.score; });
    $('appsTable').querySelector('tbody').innerHTML = rows.map(function (r) {
      var next = r.plan ? (r.plan.nextSteps[0].by + ': ' + r.plan.nextSteps[0].text) : (r.actions[0] || '—');
      return '<tr data-app="' + esc(r.app.id) + '"' + (flashIds && flashIds.indexOf(r.app.id) >= 0 ? ' class="flash"' : '') + '>' +
        '<td class="id">' + esc(r.app.id) + '</td>' +
        '<td>' + esc(r.app.name || '—') + '<div class="muted small">' + esc(r.app.experience === null ? '?' : r.app.experience) + ' yrs · ' + H.fmtL(r.app.investment) + ' · ' + esc(r.app.language) + '</div></td>' +
        '<td>' + esc(r.app.city || '?') + '<div class="muted small">' + esc(r.app.pin || 'no pin') + (r.territoryId ? ' · ' + esc(r.territoryId) : '') + '</div></td>' +
        '<td><div class="scorebar"><b>' + (r.status === 'WITHDRAWN' ? '—' : r.score) + '</b><div class="track"><div class="fill" style="width:' + r.score + '%"></div></div></div></td>' +
        '<td>' + chip(r.status) + '</td>' +
        '<td class="why">' + esc(r.headline) + '</td>' +
        '<td class="nexta">' + esc(next) + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="muted">No applications match.</td></tr>';

    // log
    $('log').innerHTML = state.log.length ? state.log.slice().reverse().map(function (l) {
      return '<div class="log-item"><div class="when">' + l.when + ' · “' + esc(l.text) + '”</div>' + l.html + '</div>';
    }).join('') : '<p class="muted">No updates yet. Tell the assistant something new, e.g. “' + esc(pickExample('WAITLIST')) + ' has now found a ground-floor space”.</p>';
  }

  function find(id) { return state.result.results.filter(function (r) { return r.app.id === id; })[0]; }

  // ------------------------------------------------------------------ drawer
  function openDrawer(id) {
    var r = find(id);
    if (!r) return;
    var a = r.app;
    var html = '<div class="d-head"><div><h2>' + esc(a.id) + ' · ' + esc(a.name || '(no name)') + '</h2>' +
      '<div class="d-meta">' + esc(a.city || '?') + ' · pin ' + esc(a.pin || '?') + (r.territoryId ? ' · ' + esc(r.territoryId) : ' · no target territory') + (a.city && E.CITIES[a.city] ? ' · Tier ' + E.CITIES[a.city].tier : '') + '</div></div>' +
      '<div class="d-score"><div class="big">' + (r.status === 'WITHDRAWN' ? '—' : r.score) + '</div><div class="muted small">fit score / 100</div></div></div>';
    html += '<div class="verdict s-' + r.status.toLowerCase() + '">' + E.STATUS[r.status].label + ' - ' + esc(r.headline) + '<small>' + esc(r.statusBlurb) + '</small></div>';

    // why
    var why = r.blocking.map(function (b) { return ['-', b.text]; }).concat(r.reasons.map(function (x) { return [x.t, x.text]; }));
    html += '<div class="d-sec"><h3>Why</h3><ul class="reasons">' + why.map(function (w) {
      var m = w[0] === '+' ? '<span class="r-plus">+</span>' : w[0] === '-' ? '<span class="r-minus">–</span>' : '<span class="r-neutral">•</span>';
      return '<li>' + m + '<span>' + esc(w[1]) + '</span></li>';
    }).join('') + '</ul></div>';
    if (r.flags.length) html += '<div class="d-sec"><div class="callout"><b>Data issues spotted:</b> ' + r.flags.map(esc).join('; ') + '.</div></div>';

    if (r.conditions.length && (r.status === 'CONDITIONAL')) html += '<div class="d-sec"><h3>Conditions to keep the slot (30 days)</h3><ul>' + r.conditions.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>';
    if (!r.plan && r.actions.length) html += '<div class="d-sec"><h3>What happens next</h3><ul>' + r.actions.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>';

    // plan
    if (r.plan) {
      var p = r.plan;
      html += '<div class="d-sec"><h3>Partner next steps</h3><ul class="todo">' + p.nextSteps.map(function (s) { return '<li><b>' + esc(s.by) + ':</b> ' + esc(s.text) + '</li>'; }).join('') + '</ul></div>';
      html += '<div class="d-sec"><h3>Onboarding plan - estimated opening ' + esc(p.launchDate) + '</h3>';
      if (p.festival) html += '<div class="callout ' + (p.festival.ok ? 'ok' : '') + '" style="margin-bottom:8px">' + esc(p.festival.text) + '</div>';
      if (p.gapMonths > 0.5) html += '<div class="callout" style="margin-bottom:8px">Realistic opening is ~' + p.launchMonths + ' months away vs the applicant\'s ' + p.targetMonths + ' - reset expectations on the welcome call.</div>';
      var span = Math.max.apply(null, p.steps.map(function (s) { return s.end; }));
      html += '<div class="gantt">' + p.steps.map(function (s) {
        var cls = /condition/i.test(s.name) || /Site search/.test(s.name) ? 'cond' : /training/i.test(s.name) ? 'train' : /opening/i.test(s.name) ? 'launch' : '';
        var left = s.start / span * 100, width = Math.max(1.5, (s.end - s.start) / span * 100);
        return '<div class="g-row"><div class="g-name">' + esc(s.name) + '<small>' + esc(s.owner) + ' · wk ' + s.start + '–' + s.end + '</small></div>' +
          '<div class="g-track" title="' + esc(s.detail) + '"><div class="g-bar ' + cls + '" style="left:' + left + '%;width:' + width + '%"></div></div></div>';
      }).join('') + '</div><div class="g-axis"><span>Today</span><span>Week ' + Math.round(span / 2) + '</span><span>Week ' + span + '</span></div></div>';

      html += '<div class="d-sec"><h3>How they will be prepared to run the store</h3><div class="facts">' +
        fact('Track', p.training.track) + fact('Language', p.training.language) + fact('Classroom + shadowing', p.training.weeks + ' week(s)') + fact('Shadow store', p.training.shadowStore) + fact('Staff to hire', p.staff + ' people') +
        '</div><ul style="margin-top:10px">' + p.training.modules.map(function (m) { return '<li>' + esc(m.name) + ' <span class="muted">(' + m.days + ' day' + (m.days > 1 ? 's' : '') + ')</span></li>'; }).join('') + '</ul>' +
        '<p class="muted small">After opening: weekly sales call for the first month, then 30/60/90-day reviews with the area manager.</p></div>';

      html += '<div class="d-sec"><h3>Unit economics (estimate)</h3><div class="econ">' +
        fact('Setup cost', H.fmtL(p.economics.setupCost)) + fact('Sales / month', H.fmtL(p.economics.monthlySales)) + fact('Partner profit / month', H.fmtL(p.economics.monthlyProfit)) + fact('Payback', '~' + p.economics.paybackMonths + ' months') + '</div></div>';
    }

    // score breakdown
    html += '<div class="d-sec"><h3>Score breakdown</h3><div class="bd">' + r.breakdown.map(function (b) {
      var pct = b.max ? Math.max(0, b.pts / b.max * 100) : Math.min(100, Math.abs(b.pts) * 5);
      return '<div class="bd-row"><span>' + esc(b.k) + '</span><div class="track"><div class="fill' + (b.pts < 0 ? ' neg' : '') + '" style="width:' + pct + '%"></div></div><b>' + b.pts + (b.max ? '/' + b.max : '') + '</b><div class="note">' + esc(b.note) + '</div></div>';
    }).join('') + '</div></div>';

    // raw facts
    html += '<div class="d-sec"><h3>What the applicant told us</h3><div class="facts">' +
      fact('Investment', H.fmtL(a.investment) + (a.investmentRaw && String(a.investmentRaw) !== String(a.investment) ? ' (“' + a.investmentRaw + '”)' : '')) +
      fact('Retail experience', a.experience === null ? 'blank' : a.experience + ' yrs') + fact('Business', a.business || '—') +
      fact('Space', a.space + (a.space !== 'Not yet identified' ? ' · ' + a.floor : '')) + fact('Size', a.size ? a.size + ' sq ft' : '—') +
      fact('Target launch', a.launchMonths === null ? '—' : a.launchMonths + ' months') + fact('Language', a.language) + fact('Notes', a.notes || '—') +
      '</div>' + (a.updates && a.updates.length ? '<p class="muted small">Updates received: ' + a.updates.map(function (u) { return '“' + esc(u) + '”'; }).join(' · ') + '</p>' : '') + '</div>';

    html += '<div class="d-sec"><h3>Ask about this applicant</h3><div class="ask-row">' +
      ['Why is ' + a.id + ' ' + E.STATUS[r.status].label.toLowerCase() + '?', 'Next steps for ' + a.id, 'Score breakdown for ' + a.id]
        .concat(r.competitor ? ['Compare ' + a.id + ' and ' + r.competitor] : [])
        .map(function (q) { return '<button class="btn sm" data-ask="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>';

    $('drawerBody').innerHTML = html;
    $('drawer').classList.remove('hidden');
    $('drawerBg').classList.remove('hidden');
    $('drawer').scrollTop = 0;
  }
  function fact(k, v) { return '<div class="fact"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>'; }
  function closeDrawer() { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); }

  // ------------------------------------------------------------------ chat
  function bot(html) { addMsg('bot', html); }
  function addMsg(who, html) {
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html;
    $('chatBody').appendChild(d);
    $('chatBody').scrollTop = $('chatBody').scrollHeight;
  }
  function ask(text) {
    if (!text.trim()) return;
    addMsg('user', esc(text));
    var out = C.respond(text, state);
    if (out.undo) {
      if (!state.history.length) { bot('<p>Nothing to undo.</p>'); return; }
      var prev = state.history.pop();
      state.data = prev.data; state.result = prev.result;
      var last = state.log.pop();
      render();
      bot('<p>Undone: “' + esc(last ? last.text : 'last update') + '”. All decisions are back to how they were.</p>');
      return;
    }
    bot(out.html);
    if (out.committed) {
      state.history.push({ data: state.data, result: state.result });
      state.data = out.data;
      state.result = out.result;
      var changed = [];
      state.history[state.history.length - 1].result.results.forEach(function (b) {
        var n = find(b.app.id);
        if (n && (n.status !== b.status || n.score !== b.score)) changed.push(b.app.id);
      });
      state.log.push({ when: new Date().toLocaleTimeString(), text: text, html: out.html.split('<div class="nested">')[0].replace(/<p class="muted">Type <i>undo<\/i>.*$/, '') });
      render(changed);
      setSuggestions();
      if (out.focus && !$('drawer').classList.contains('hidden')) openDrawer(out.focus);
    }
  }
  function setSuggestions() {
    var s = [];
    if (state.result) {
      var hold = state.result.results.filter(function (r) { return r.status === 'HOLD'; })[0];
      var wait = state.result.results.filter(function (r) { return r.status === 'WAITLIST'; })[0];
      var appr = state.result.results.filter(function (r) { return r.status === 'APPROVED' || r.status === 'CONDITIONAL'; })[0];
      var nospace = state.result.results.filter(function (r) { return r.app.space === 'Not yet identified' && r.status !== 'WITHDRAWN' && r.status !== 'REJECTED'; })[0];
      if (hold) s.push('Why is ' + hold.app.id + ' on hold?');
      if (appr) s.push('Next steps for ' + appr.app.id);
      if (nospace) s.push(nospace.app.id + ' has now found a ground-floor space');
      if (appr) s.push('What if ' + appr.app.id + ' withdraws?');
      s.push('Summary', 'Help');
    }
    $('suggest').innerHTML = s.map(function (q) { return '<button type="button" data-ask="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
  }

  // ------------------------------------------------------------------ export
  function exportXlsx() {
    var rows = state.result.results.map(function (r) {
      var p = r.plan;
      return {
        'Application ID': r.app.id, 'Applicant': r.app.name, 'City': r.app.city, 'Pin code': r.app.pin, 'Territory': r.territoryId || '',
        'Decision': r.statusLabel, 'Fit score': r.score, 'Why (summary)': r.headline,
        'Reasons': r.blocking.map(function (b) { return '- ' + b.text; }).concat(r.reasons.map(function (x) { return (x.t === '+' ? '+ ' : x.t === '-' ? '- ' : '• ') + x.text; })).join('\n'),
        'Conditions': r.status === 'CONDITIONAL' ? r.conditions.join('\n') : '',
        'Next steps': p ? p.nextSteps.map(function (s) { return s.by + ': ' + s.text; }).join('\n') : r.actions.join('\n'),
        'Est. opening': p ? p.launchDate : '', 'Training': p ? p.training.track + ' in ' + p.training.language + '; shadow at ' + p.training.shadowStore : '',
        'Payback (months)': p ? p.economics.paybackMonths : '', 'Data issues': r.flags.join('; ')
      };
    });
    var ters = state.result.territories.map(function (t) {
      return { 'Territory ID': t.id, 'City': t.city, 'Tier': t.tier, 'Priority': t.priority, 'Open slots': t.slots, 'Allocated': t.allocated.join(', '), 'Waitlist': t.waitlist.join(', '), 'Free pins': t.freePins.join(', ') };
    });
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [10, 18, 14, 9, 9, 12, 8, 60, 80, 60, 70, 12, 50, 10, 40].map(function (w) { return { wch: w }; });
    XLSX.utils.book_append_sheet(wb, ws, 'Decisions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ters), 'Territory allocation');
    if (state.log.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.log.map(function (l) { return { Time: l.when, Update: l.text }; })), 'Change log');
    XLSX.writeFile(wb, 'FranchiseFlow_Decisions.xlsx');
  }

  // ------------------------------------------------------------------ how it works
  function showHow() {
    var A = E.ASSUMPTIONS;
    var html = '<h2>How decisions are made</h2><p class="muted">Rules-based and fully explainable: the same file always gives the same answer, and every decision lists its reasons. Assumptions below are our starting point - in a real rollout the expansion team would tune them.</p>' +
      '<h3>1 · Hard rules (checked first)</h3><ul>' +
      '<li>Never two stores in one pin code - an applicant whose pin already has a store, or loses a contested pin, is offered a free pin instead.</li>' +
      '<li>City and pin must agree (pin prefix), pin must sit in a target territory, investment must be stated - otherwise <b>On hold</b> with the exact question to ask.</li>' +
      '<li>Investment below ' + Math.round(A.rejectBelowRatio * 100) + '% of the setup cost, or fit score below ' + A.minScoreToProceed + ' → <b>Rejected</b>, with a redirect where possible.</li>' +
      '<li>Same name + city applied twice → the weaker one is held as a duplicate.</li></ul>' +
      '<h3>2 · Fit score (100)</h3><table><tr><th>Factor</th><th>Points</th><th>How</th></tr>' +
      '<tr><td>Funds</td><td>25</td><td>Investment vs setup cost: Tier 1 ₹' + A.setupCost[1] + ' L, Tier 2 ₹' + A.setupCost[2] + ' L, Tier 3 ₹' + A.setupCost[3] + ' L. 70–100% = condition to close the gap.</td></tr>' +
      '<tr><td>Space readiness</td><td>25</td><td>Owned/rented ground floor best, mall next, upper floor weak (about half the walk-ins); ' + A.idealSpaceSqft[0] + '–' + A.idealSpaceSqft[1] + ' sq ft ideal, under ' + A.minSpaceSqft + ' too small.</td></tr>' +
      '<tr><td>Retail experience</td><td>20</td><td>Diminishing returns: 1 yr ≈ 6, 3 yrs ≈ 13, 8+ yrs ≈ 19.</td></tr>' +
      '<tr><td>Business background</td><td>10</td><td>Read from free text: retail/shop 10, other business 6, salaried 3, none 0–1.</td></tr>' +
      '<tr><td>Timeline realism</td><td>10</td><td>Target vs realistic onboarding (~10–11 weeks with a space, +6 weeks without).</td></tr>' +
      '<tr><td>Territory priority</td><td>10</td><td>High 10 · Medium 6 · Low 3.</td></tr>' +
      '<tr><td>Adjustments</td><td>±</td><td>Neighbouring pin to an existing store (−6, cannibalisation), contradictions in the form (−2 each), signals in notes: loan dependency, indecision, absentee owner, competing brand (−), prior franchise experience (+).</td></tr></table>' +
      '<h3>3 · Allocation</h3><p>Within each territory, eligible applicants are ranked by score and given slots until they run out, one pin each. If someone loses their pin to a higher scorer, moving means losing the shop they have, so they compete for any remaining slot with a lower <i>relocation score</i> (space points reset). Approved = clean; Conditional = slot held 30 days while named conditions are met; Waitlisted = qualified but no slot.</p>' +
      '<h3>4 · Onboarding plan</h3><p>Agreement & KYC (2 wks) → site audit (1) → fit-out (5–7 by tier) with staff hiring in parallel → training in the partner\'s language (1 week fast-track for experienced partners, 3 weeks with shadow shifts for new-to-retail) at the nearest existing store → soft launch → 30/60/90-day reviews. Site search adds 6 weeks when there is no suitable space.</p>' +
      '<h3>5 · Follow-ups</h3><p>Ask "why", "next steps", "compare", or give new facts in plain English. Updates re-run <b>every</b> decision, because one change can move someone else (e.g. a withdrawal frees a slot for the waitlist). "What if…" previews without saving; "undo" reverts.</p>';
    $('howBody').innerHTML = html;
    $('how').classList.remove('hidden');
    $('howBg').classList.remove('hidden');
  }

  // ------------------------------------------------------------------ toast
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4500);
  }

  // ------------------------------------------------------------------ events
  $('fileInput').addEventListener('change', function (e) { handleFile(e.target.files[0]); e.target.value = ''; });
  $('btnSample').addEventListener('click', function () { loadSheets(window.SAMPLE_SHEETS, 'FranchiseFlow_Sample_Test_Data.xlsx (sample)'); });
  $('btnExport').addEventListener('click', exportXlsx);
  $('btnHow').addEventListener('click', showHow);
  $('howClose').addEventListener('click', function () { $('how').classList.add('hidden'); $('howBg').classList.add('hidden'); });
  $('howBg').addEventListener('click', function () { $('how').classList.add('hidden'); $('howBg').classList.add('hidden'); });
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerBg').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); $('how').classList.add('hidden'); $('howBg').classList.add('hidden'); } });

  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); if (ev === 'drop' || e.target === drop) drop.classList.remove('over'); }); });
  document.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleFile(f); });

  $('kpis').addEventListener('click', function (e) {
    var k = e.target.closest('.kpi'); if (!k) return;
    state.filter = k.getAttribute('data-f'); render();
  });
  $('statusFilter').addEventListener('change', function (e) { state.filter = e.target.value; render(); });
  $('search').addEventListener('input', function (e) { state.search = e.target.value; render(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-app]');
    if (a) { e.preventDefault(); openDrawer(a.getAttribute('data-app')); return; }
    var q = e.target.closest('[data-ask]');
    if (q) { e.preventDefault(); if (window.innerWidth <= 900) { $('chat').classList.remove('min'); $('chatFab').classList.add('hidden'); } ask(q.getAttribute('data-ask')); }
  });
  $('chatForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('chatText').value; $('chatText').value = ''; ask(v); });
  $('chatToggle').addEventListener('click', function () { $('chat').classList.add('min'); $('chatFab').classList.remove('hidden'); });
  $('chatFab').addEventListener('click', function () { $('chat').classList.remove('min'); $('chatFab').classList.add('hidden'); });
  if (window.innerWidth <= 900) { $('chat').classList.add('min'); $('chatFab').classList.remove('hidden'); }

  bot('<p>Hi! Upload the Applications + Territories Excel (or try the sample data). I will decide what happens to every applicant and explain why - then you can ask follow-ups like <i>"Why is APP-007 on hold?"</i> or tell me news like <i>"APP-012 has now found a ground-floor space"</i>.</p>');
  $('suggest').innerHTML = '<button type="button" id="sugSample">Load sample data</button>';
  $('sugSample').addEventListener('click', function () { $('btnSample').click(); });
})();
