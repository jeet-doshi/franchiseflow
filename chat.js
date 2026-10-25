/* FranchiseFlow chat: plain-language questions and updates over the engine.
 * Rule-based on purpose - no API keys, no rate limits, same answer every time.
 * respond(text, state) -> { html, data?, result?, focus?, committed? }
 */
(function (root) {
  'use strict';
  var E = root.FranchiseEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);
  var H = E.helpers;

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function chip(status) { return '<span class="chip s-' + status.toLowerCase() + '">' + E.STATUS[status].label + '</span>'; }
  function appLink(id) { return '<a href="#" class="app-link" data-app="' + esc(id) + '">' + esc(id) + '</a>'; }
  function list(items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }
  function mark(t) { return t === '+' ? '<span class="r-plus">+</span>' : t === '-' ? '<span class="r-minus">–</span>' : '<span class="r-neutral">•</span>'; }

  // ---------------------------------------------------------------- lookups
  function findApps(text, data) {
    var out = [], re = /\b(?:app(?:lication)?|applicant)[\s\-_#.]*0*(\d{1,4})\b/gi, m;
    while ((m = re.exec(text))) {
      var n = parseInt(m[1], 10);
      var a = data.applications.filter(function (x) { return H.canonicalAppId(x.id) === n; })[0];
      if (a && out.indexOf(a.id) < 0) out.push(a.id);
    }
    // by exact id text (handles custom ID formats)
    data.applications.forEach(function (a) {
      if (a.id && out.indexOf(a.id) < 0 && new RegExp('\\b' + a.id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(text)) out.push(a.id);
    });
    // by name: full name, or first name if unique
    if (!out.length) {
      var low = text.toLowerCase();
      data.applications.forEach(function (a) {
        if (!a.name) return;
        var full = a.name.toLowerCase();
        if (low.indexOf(full) >= 0) { out.push(a.id); return; }
      });
      if (!out.length) {
        data.applications.forEach(function (a) {
          var first = (a.name || '').split(/\s+/)[0].toLowerCase();
          if (first.length < 3) return;
          var same = data.applications.filter(function (b) { return (b.name || '').split(/\s+/)[0].toLowerCase() === first; });
          if (same.length === 1 && new RegExp('\\b' + first + '\\b').test(low)) out.push(a.id);
        });
      }
    }
    return out;
  }
  function findTers(text, data) {
    var out = [], re = /\bter(?:ritory)?[\s\-_#.]*0*(\d{1,3})\b/gi, m;
    while ((m = re.exec(text))) {
      var n = parseInt(m[1], 10);
      var t = data.territories.filter(function (x) { return H.canonicalAppId(x.id) === n; })[0];
      if (t && out.indexOf(t.id) < 0) out.push(t.id);
    }
    return out;
  }
  function findCity(text) {
    var c = H.normCity(text);
    return E.CITIES[c] ? c : (function () {
      for (var k in E.CITIES) if (new RegExp(k.split('-')[0], 'i').test(text)) return k;
      var aliases = [[/bangalore|bengaluru|blr/i, 'Bengaluru'], [/mysore|mysuru/i, 'Mysuru'], [/mangalore|mangaluru/i, 'Mangaluru'], [/hubli|hubballi|dharwad/i, 'Hubballi-Dharwad'], [/belgaum|belagavi/i, 'Belagavi'], [/tumkur|tumakuru/i, 'Tumakuru'], [/davangere|davanagere/i, 'Davanagere']];
      for (var i = 0; i < aliases.length; i++) if (aliases[i][0].test(text)) return aliases[i][1];
      return '';
    })();
  }
  function res(result, id) { return result.results.filter(function (r) { return r.app.id === id; })[0]; }
  function ter(result, id) { return result.territories.filter(function (t) { return t.id === id; })[0]; }

  // ---------------------------------------------------------------- updates
  /** Returns { app: {id: {field: value}}, ter: {...}, stores: {add:[], remove:[]}, notes:[] } or null */
  function parseUpdate(text, data, appIds, terIds) {
    var low = text.toLowerCase();
    var u = { app: {}, ter: {}, storesAdd: [], storesRemove: [], notes: [] };
    var any = false;

    // ---- store network changes
    var newStore = low.match(/(?:new|another)\s+(?:store|outlet).*?(?:opened|opening|open|launched)?.*?\b(\d{6})\b/) || low.match(/(?:opened|launched)\s+(?:a\s+)?(?:new\s+)?(?:store|outlet).*?\b(\d{6})\b/);
    if (newStore && !appIds.length) { u.storesAdd.push(newStore[1]); any = true; }
    var closed = low.match(/\b(st[\s\-_]*\d+)\b.*\b(closed|shut)/) || low.match(/(closed|shut)\b.*\b(st[\s\-_]*\d+)\b/);
    if (closed) {
      var sid = (closed[1].indexOf('st') === 0 ? closed[1] : closed[2]).replace(/[\s_]/g, '').toUpperCase().replace(/^ST-?0*(\d+)/, function (_, d) { return 'ST-' + String(d).padStart(2, '0'); });
      u.storesRemove.push(sid); any = true;
    }

    // ---- territory changes
    terIds.forEach(function (tid) {
      var ch = {};
      var s = low.match(/(\d+)\s*(?:open\s*)?(?:slots?|stores?)/) || low.match(/slots?\s*(?:to|=|is|are|of|now)?\s*(\d+)/);
      if (s) ch.slots = parseInt(s[1], 10);
      var cur = data.territories.filter(function (x) { return x.id === tid; })[0];
      if (!s && /(one|another|1) (more|extra|additional) slot|add(ed|s)? (a|one|another|an extra) slot|slots? (increased|up) by (one|1)/.test(low)) ch.slots = cur.slots + 1;
      if (!s && /(one|1) (fewer|less) slot|remove (a|one) slot|slots? (reduced|down) by (one|1)/.test(low)) ch.slots = Math.max(0, cur.slots - 1);
      if (/no (more )?(open )?slots|slots? (are )?(full|closed)|paused|frozen/.test(low)) ch.slots = 0;
      var p = low.match(/\b(high|medium|low)\b\s*(?:priority)?/);
      if (p && /priorit/.test(low)) ch.priority = p[1].charAt(0).toUpperCase() + p[1].slice(1);
      var pins = text.match(/\b\d{6}\b/g);
      if (pins && /add|include|extend|now covers|also covers/.test(low)) ch.addPins = pins;
      if (pins && /remove|drop|exclude/.test(low)) ch.removePins = pins;
      if (Object.keys(ch).length) { u.ter[tid] = ch; any = true; }
    });

    // ---- application changes
    appIds.forEach(function (id) {
      var a = data.applications.filter(function (x) { return x.id === id; })[0];
      var ch = {}, notes = [];
      if (/withdr|dropped out|backed out|pulled out|not interested|no longer interested|cancel+ed/.test(low)) ch.withdrawn = true;
      if (/(back in|re-?joined|is interested again|reinstat|reconsider)/.test(low)) ch.withdrawn = false;

      var floor = null;
      if (/ground[\s-]*floor|\bground\b|street[\s-]*facing|road[\s-]*facing/.test(low)) floor = 'Ground';
      else if (/\bmall\b/.test(low)) floor = 'Mall unit';
      else if (/upper|first[\s-]*floor|1st[\s-]*floor|second[\s-]*floor|2nd[\s-]*floor|basement/.test(low)) floor = 'Upper';
      var spaceWord = /(space|shop|unit|premises|place|property|site|location|outlet|store|building)/.test(low);
      var lost = /(lost|no longer has|gave up|fell through|cancelled the lease|landlord backed out|does ?n.?t have)\b.*(space|shop|unit|premises|site|lease)/.test(low);
      if (lost) { ch.space = 'Not yet identified'; ch.floor = 'Not known'; ch.size = null; }
      else if (floor || (spaceWord && /(found|secured|got|identified|signed|leased|rented|bought|purchased|owns|finali[sz]ed|locked|taken)/.test(low))) {
        if (floor) ch.floor = floor;
        if (/\bown(s|ed)?\b|bought|purchased|family (property|building)|inherited/.test(low)) ch.space = 'Owned';
        else if (/rent|lease/.test(low)) ch.space = 'Rented';
        else if (a.space === 'Not yet identified') { ch.space = 'Rented'; notes.push('Assumed the new space is <b>rented</b> (not stated) - say "it is owned" to change.'); }
      }
      var size = low.match(/(\d[\d,]*)\s*(?:sq\.?\s*f(?:ee)?t|sqft|sft|square\s*f(?:ee|oo)t|sq\.?\s*feet)/);
      if (size) ch.size = parseInt(size[1].replace(/,/g, ''), 10);

      var money = low.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l\b|cr(?:ore)?s?)/) || low.match(/(?:₹|rs\.?|inr)\s*([\d,]{5,})/);
      if (money && /(invest|capital|fund|budget|loan|money|afford|lakh|lac|crore|₹|rs)/.test(low)) {
        var amt = money[2] ? (/cr/.test(money[2]) ? parseFloat(money[1]) * 100 : parseFloat(money[1])) : parseFloat(money[1].replace(/,/g, '')) / 100000;
        var additive = /(loan|additional|extra|more|another|on top|top[\s-]?up|co-?investor|partner (adds|brings))/.test(low) && !/(total|in all|now has|can now invest|can invest|capacity is|increased to|raised to|revised to|now)\b/.test(low);
        ch.investment = additive ? Math.round(((a.investment || 0) + amt) * 10) / 10 : amt;
        if (additive) notes.push('Added ' + H.fmtL(amt) + ' to the earlier ' + H.fmtL(a.investment) + ' (read as extra money).');
      }
      if (/loan.*(approved|sanctioned|cleared|came through)|(approved|sanctioned).*loan/.test(low)) {
        ch.noteAppend = (ch.noteAppend || '') + ' Loan approved.';
        var need = E.CITIES[a.city] ? E.ASSUMPTIONS.setupCost[E.CITIES[a.city].tier] : null;
        if (ch.investment === undefined && need && a.investment !== null && a.investment < need) {
          ch.investment = need;
          notes.push('No loan amount given - assumed it closes the ' + H.fmtL(need - a.investment) + ' gap to ' + H.fmtL(need) + '. Tell me the amount if different.');
        }
      }
      if (/(no longer|doesn.?t|does not|won.?t) need (a |the )?loan|self[\s-]?fund/.test(low)) ch.noteAppend = (ch.noteAppend || '') + ' Self-funded, no loan.';

      var exp = low.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:retail|shop|store|business))?\s*(?:experience|exp)?/);
      if (exp && /(experience|exp\b|years? (in|of) retail|ran|managed|worked)/.test(low)) ch.experience = parseFloat(exp[1]);

      var months = low.match(/(\d+)\s*months?/);
      if (months && /(launch|open|start|months|timeline|ready|go live)/.test(low) && !/experience/.test(low.slice(Math.max(0, months.index - 25), months.index))) ch.launchMonths = parseInt(months[1], 10);

      var lang = low.match(/\b(kannada|hindi|english)\b/);
      if (lang) ch.language = lang[1].charAt(0).toUpperCase() + lang[1].slice(1);

      var pin = text.match(/\b(\d{6})\b/);
      if (pin && !/sq|ft|₹|rs/.test(low.slice(pin.index + 6, pin.index + 12))) {
        ch.pin = pin[1];
        var pc = H.cityFromPin(pin[1]);
        if (pc && pc !== a.city) { ch.city = pc; notes.push('Pin ' + pin[1] + ' is in ' + pc + ', so city updated to ' + pc + '.'); }
      } else {
        var c = findCity(text.replace(new RegExp(a.name || '^$', 'i'), ''));
        if (c && c !== a.city && /(move|shift|relocat|instead|now in|wants to open in|city|actually|correct|is in|located|based in)/.test(low)) { ch.city = c; notes.push('City changed to ' + c + (a.pin && H.cityFromPin(a.pin) !== c ? ' - the pin code ' + a.pin + ' also needs updating.' : ' - matches the pin ' + a.pin + '.')); }
      }
      var clear = [];
      if (/loan.*(approved|sanctioned|cleared|came through)|(approved|sanctioned).*loan|(no longer|doesn.?t|does not|won.?t) need (a |the )?loan|self[\s-]?fund/.test(low)) clear.push('loan');
      if (/(stopped|no longer|exited|closed|sold off|quit|dropped|gave up|ended).*(brand|competitor|selling|dealership|eyewear)/.test(low)) { clear.push('conflict'); ch.noteAppend = (ch.noteAppend || '') + ' Exited the competing brand.'; }
      if (/(is now sure|now (fully )?committed|confirmed (their|his|her) interest|decided to go ahead|serious about|paid (the )?token)/.test(low)) clear.push('uncertain');
      if (/(full[\s-]?time|quit (his|her|their|my) job|will run (it )?(himself|herself|themselves|myself))/.test(low)) { clear.push('absentee'); ch.noteAppend = (ch.noteAppend || '') + ' Will run full-time.'; }
      if (clear.length) ch.clearedSignals = (a.clearedSignals || []).concat(clear).filter(function (k, i, arr) { return arr.indexOf(k) === i; });
      if (/(not sure|unsure|having second thoughts|undecided)/.test(low)) ch.noteAppend = (ch.noteAppend || '') + ' Not sure.';

      if (Object.keys(ch).length) { u.app[id] = ch; any = true; }
      u.notes = u.notes.concat(notes);
    });
    return any ? u : null;
  }

  var FIELD_LABEL = { space: 'Space', floor: 'Floor', size: 'Space size', investment: 'Investment', experience: 'Retail experience', launchMonths: 'Target launch', language: 'Language', pin: 'Pin code', city: 'City', withdrawn: 'Withdrawn' };
  function fmtField(f, v) {
    if (v === null || v === undefined || v === '') return '—';
    if (f === 'investment') return H.fmtL(v);
    if (f === 'size') return v + ' sq ft';
    if (f === 'experience') return v + ' yrs';
    if (f === 'launchMonths') return v + ' months';
    if (f === 'withdrawn') return v ? 'yes' : 'no';
    return v;
  }

  function applyUpdate(data, u, text) {
    var d = H.clone(data), lines = [];
    Object.keys(u.app).forEach(function (id) {
      var a = d.applications.filter(function (x) { return x.id === id; })[0], ch = u.app[id];
      Object.keys(ch).forEach(function (f) {
        if (f === 'noteAppend') return;
        if (f === 'clearedSignals') { a.clearedSignals = ch[f]; return; }
        if (a[f] === ch[f]) return;
        lines.push(appLink(id) + ': ' + FIELD_LABEL[f] + ' ' + esc(fmtField(f, a[f])) + ' → <b>' + esc(fmtField(f, ch[f])) + '</b>');
        a[f] = ch[f];
        if (f === 'space' || f === 'floor') a.spaceUpdated = true;
      });
      if (ch.noteAppend) { a.notes = (a.notes ? a.notes + ' ' : '') + ch.noteAppend.trim(); lines.push(appLink(id) + ': note added - "' + esc(ch.noteAppend.trim()) + '"'); }
      a.updates = (a.updates || []).concat([text]);
    });
    Object.keys(u.ter).forEach(function (id) {
      var t = d.territories.filter(function (x) { return x.id === id; })[0], ch = u.ter[id];
      if (ch.slots !== undefined && ch.slots !== t.slots) { lines.push(esc(id) + ': open slots ' + t.slots + ' → <b>' + ch.slots + '</b>'); t.slots = ch.slots; }
      if (ch.priority && ch.priority !== t.priority) { lines.push(esc(id) + ': priority ' + t.priority + ' → <b>' + ch.priority + '</b>'); t.priority = ch.priority; }
      (ch.addPins || []).forEach(function (p) { if (t.pins.indexOf(p) < 0) { t.pins.push(p); lines.push(esc(id) + ': now covers pin <b>' + p + '</b>'); } });
      (ch.removePins || []).forEach(function (p) { var i = t.pins.indexOf(p); if (i >= 0) { t.pins.splice(i, 1); lines.push(esc(id) + ': no longer covers pin ' + p); } });
    });
    u.storesAdd.forEach(function (pin) {
      if (d.stores.some(function (s) { return s.pin === pin; })) return;
      var n = d.stores.length + 1, id = 'ST-' + String(n).padStart(2, '0');
      d.stores.push({ id: id, city: H.cityFromPin(pin), pin: pin, year: new Date().getFullYear() });
      lines.push('New store <b>' + id + '</b> added at pin ' + pin + ' - no partner can now open there.');
    });
    u.storesRemove.forEach(function (sid) {
      var i = d.stores.findIndex(function (s) { return s.id === sid; });
      if (i >= 0) { lines.push('Store ' + sid + ' (pin ' + d.stores[i].pin + ') removed - that pin is free again.'); d.stores.splice(i, 1); }
    });
    return { data: d, lines: lines };
  }

  function diff(before, after) {
    var out = [];
    after.results.forEach(function (r) {
      var b = res(before, r.app.id);
      if (!b) { out.push({ id: r.app.id, from: null, to: r.status, s0: null, s1: r.score }); return; }
      if (b.status !== r.status || b.score !== r.score) out.push({ id: r.app.id, from: b.status, to: r.status, s0: b.score, s1: r.score });
    });
    return out;
  }
  function renderDiff(changes, focusIds) {
    if (!changes.length) return '<p>Re-ran every decision - <b>no decision changed</b>.</p>';
    var main = changes.filter(function (c) { return focusIds.indexOf(c.id) >= 0; });
    var knock = changes.filter(function (c) { return focusIds.indexOf(c.id) < 0; });
    function line(c) {
      var st = c.from === c.to ? chip(c.to) + ' (unchanged)' : (c.from ? chip(c.from) + ' → ' : '') + chip(c.to);
      if (c.s0 === null) return appLink(c.id) + ' (new): ' + chip(c.to) + ' &nbsp;score <b>' + c.s1 + '</b>';
      return appLink(c.id) + ': ' + st + (c.s0 !== c.s1 ? ' &nbsp;score ' + c.s0 + ' → <b>' + c.s1 + '</b>' : '');
    }
    var html = '<p><b>Re-ran all decisions.</b></p>' + (main.length ? list(main.map(line)) : '');
    var moved = knock.filter(function (c) { return c.from !== c.to; });
    if (moved.length) html += '<p class="knock">Knock-on effects:</p>' + list(moved.map(line));
    return html;
  }

  // ---------------------------------------------------------------- answers
  function explain(r, result) {
    var html = '<p>' + appLink(r.app.id) + ' · ' + esc(r.app.name || '(no name)') + ' · ' + esc(r.app.city || '?') + ' ' + esc(r.app.pin || '') + '</p>';
    html += '<p>' + chip(r.status) + ' <b>Score ' + r.score + '/100.</b> ' + esc(r.headline) + '</p>';
    var why = r.blocking.map(function (b) { return mark('-') + ' ' + esc(b.text); }).concat(r.reasons.map(function (x) { return mark(x.t) + ' ' + esc(x.text); }));
    if (why.length) html += '<p class="sub">Why:</p>' + list(why.slice(0, 8));
    if (r.flags.length) html += '<p class="sub">Data issues spotted:</p>' + list(r.flags.map(esc));
    if (r.conditions.length && (r.status === 'CONDITIONAL' || r.status === 'APPROVED')) html += '<p class="sub">Conditions to keep the slot:</p>' + list(r.conditions.map(esc));
    var acts = r.actions.slice();
    if (acts.length) html += '<p class="sub">What happens next:</p>' + list(acts.map(esc));
    if (r.plan) html += '<p>Ask <i>"next steps for ' + esc(r.app.id) + '"</i> for the onboarding and training plan.</p>';
    if (r.status === 'HOLD' || r.status === 'WAITLIST' || r.status === 'REJECTED') html += whatWouldChange(r, result);
    return html;
  }

  function whatWouldChange(r, result) {
    var tips = [];
    r.blocking.forEach(function (b) {
      if (b.code === 'pin_mismatch' || b.code === 'pin_missing') tips.push('a correct pin code for ' + (r.app.city || 'the city'));
      if (b.code === 'store_pin' || b.code === 'no_territory') tips.push('moving to a free target pin' + (r.suggestedPins && r.suggestedPins.length ? ' (e.g. ' + r.suggestedPins.slice(0, 3).join(', ') + ')' : ''));
      if (b.code === 'inv_missing') tips.push('the investment amount');
      if (b.code === 'duplicate') tips.push('confirming which of the two applications is the real one');
    });
    if (r.status === 'WAITLIST' && r.competitor) tips.push('a slot opening up (e.g. ' + r.competitor + ' withdrawing) or the brand adding a slot');
    if (r.status === 'REJECTED' && r.app.investment !== null) tips.push('more capital (about ' + H.fmtL(E.ASSUMPTIONS.setupCost[(E.CITIES[r.app.city] || { tier: 2 }).tier]) + ')');
    if (r.app.space === 'Not yet identified') tips.push('finding a ground-floor space');
    if (!tips.length) return '';
    return '<p class="sub">What would change this:</p>' + list(tips.map(esc));
  }

  function planHtml(r) {
    if (!r.plan) {
      return '<p>' + appLink(r.app.id) + ' is ' + chip(r.status) + ' so there is no onboarding plan yet.</p>' + (r.actions.length ? '<p class="sub">Next steps for them:</p>' + list(r.actions.map(esc)) : '');
    }
    var p = r.plan;
    var html = '<p>' + appLink(r.app.id) + ' ' + chip(r.status) + ' - estimated opening <b>' + p.launchDate + '</b> (~' + p.launchMonths + ' months' + (p.targetMonths !== null && p.targetMonths !== undefined ? '; applicant wants ' + p.targetMonths : '') + ').</p>';
    if (p.festival) html += '<p class="' + (p.festival.ok ? 'ok' : 'warn') + '">' + esc(p.festival.text) + '</p>';
    if (p.gapMonths > 0.5) html += '<p class="warn">That is ' + p.gapMonths + ' months later than the applicant hoped - set expectations on the welcome call.</p>';
    html += '<p class="sub">Partner to-do:</p>' + list(p.nextSteps.map(function (s) { return '<b>' + esc(s.by) + ':</b> ' + esc(s.text); }));
    html += '<p class="sub">How they will be prepared (' + esc(p.training.track) + ', in ' + esc(p.training.language) + '):</p>' +
      list(p.training.modules.map(function (m) { return esc(m.name) + ' <span class="muted">(' + m.days + 'd)</span>'; }).concat(['Shadowing at ' + esc(p.training.shadowStore)]));
    html += '<p class="sub">Timeline:</p>' + list(p.steps.map(function (s) { return '<b>Wk ' + s.start + '–' + s.end + '</b> ' + esc(s.name); }));
    html += '<p class="muted">Payback estimate: ~' + p.economics.paybackMonths + ' months on ' + H.fmtL(p.economics.setupCost) + ' (sales ~' + H.fmtL(p.economics.monthlySales) + '/month).</p>';
    return html;
  }

  function compare(ids, result) {
    var rs = ids.map(function (id) { return res(result, id); });
    var keys = rs[0].breakdown.map(function (b) { return b.k; });
    rs.forEach(function (r) { r.breakdown.forEach(function (b) { if (keys.indexOf(b.k) < 0) keys.push(b.k); }); });
    var head = '<tr><th></th>' + rs.map(function (r) { return '<th>' + appLink(r.app.id) + '</th>'; }).join('') + '</tr>';
    var rows = keys.map(function (k) {
      return '<tr><td>' + k + '</td>' + rs.map(function (r) { var b = r.breakdown.filter(function (x) { return x.k === k; })[0]; return '<td>' + (b ? b.pts : 0) + '</td>'; }).join('') + '</tr>';
    }).join('');
    rows += '<tr class="total"><td>Total</td>' + rs.map(function (r) { return '<td>' + r.score + '</td>'; }).join('') + '</tr>';
    rows += '<tr><td>Decision</td>' + rs.map(function (r) { return '<td>' + chip(r.status) + '</td>'; }).join('') + '</tr>';
    var html = '<table class="cmp">' + head + rows + '</table>';
    var same = rs.every(function (r) { return r.app.pin === rs[0].app.pin; });
    var top = rs.slice().sort(function (a, b) { return b.score - a.score; })[0];
    html += '<p>' + appLink(top.app.id) + ' leads on score.' + (same ? ' Both want pin ' + rs[0].app.pin + ' - only one store per pin, so the higher score wins it.' : '') + '</p>';
    return html;
  }

  function terHtml(t, result) {
    var apps = result.results.filter(function (r) { return r.territoryId === t.id; });
    var html = '<p><b>' + esc(t.id) + '</b> · ' + esc(t.city) + ' · Tier ' + t.tier + ' · ' + t.priority + ' priority</p>';
    html += '<p>' + t.filled + ' of ' + t.slots + ' slot(s) filled' + (t.remaining ? ', <b>' + t.remaining + ' open</b>' : '') + '. Pins: ' + t.pins.join(', ') + '.</p>';
    if (t.freePins.length) html += '<p>Free pins (no store or approved partner): ' + t.freePins.join(', ') + '.</p>';
    if (apps.length) html += list(apps.sort(function (a, b) { return b.score - a.score; }).map(function (r) { return appLink(r.app.id) + ' ' + chip(r.status) + ' score ' + r.score + ' · pin ' + r.app.pin; }));
    else html += '<p>No applicants in this territory yet.</p>';
    return html;
  }

  function statusList(status, result) {
    var rs = result.results.filter(function (r) { return r.status === status; });
    if (!rs.length) return '<p>No applications are ' + chip(status) + ' right now.</p>';
    return '<p>' + rs.length + ' application(s) ' + chip(status) + ':</p>' + list(rs.map(function (r) { return appLink(r.app.id) + ' ' + esc(r.app.name) + ' - ' + esc(r.headline); }));
  }

  function summary(result) {
    var c = {};
    result.results.forEach(function (r) { c[r.status] = (c[r.status] || 0) + 1; });
    var html = '<p><b>' + result.results.length + ' applications, ' + result.territories.length + ' territories.</b></p>' +
      list(Object.keys(E.STATUS).filter(function (s) { return c[s]; }).map(function (s) { return chip(s) + ' ' + c[s]; }));
    if (result.insights.length) html += '<p class="sub">Worth your attention:</p>' + list(result.insights.slice(0, 5).map(function (i) { return esc(i.text); }));
    return html;
  }

  var HELP = '<p>Ask me about any decision, or tell me something new. Examples:</p>' + list([
    '<b>Why</b> · <i>Why is APP-007 on hold?</i> · <i>Compare APP-004 and APP-021</i>',
    '<b>Plan</b> · <i>Next steps for APP-002</i> · <i>Training cohorts</i> · <i>Opening calendar</i>',
    '<b>Path to yes</b> · <i>What would it take for APP-018 to be approved?</i>',
    '<b>Message</b> · <i>Draft a message for APP-001 in Kannada</i>',
    '<b>New facts</b> · <i>APP-012 has now found a ground-floor space</i> · <i>APP-002 has withdrawn</i> · <i>TER-02 now has 2 open slots</i>',
    '<b>New applicant</b> · <i>New applicant APP-030 Kavya Rao, Tumakuru 572102, 25 lakh, 4 years experience, rented ground floor 500 sq ft, Kannada</i>',
    '<b>Override</b> · <i>Approve APP-012 because she has a signed lease next door</i>',
    '<i>What if…</i> previews without saving · <i>undo</i> reverts · <i>How do you score?</i>'
  ]);

  var SCORING = '<p>Every application gets a fit score out of 100, then slots are handed out best-score-first, one store per pin code:</p>' + list([
    '<b>Funds (25)</b> - investment vs setup cost (Tier 1 ₹35 L, Tier 2 ₹25 L, Tier 3 ₹18 L). Below 70% = rejected; 70–100% = condition.',
    '<b>Space readiness (25)</b> - owned/rented, ground floor or mall best, 400–1200 sq ft ideal, below 300 too small.',
    '<b>Retail experience (20)</b> + <b>business background (10)</b>.',
    '<b>Timeline realism (10)</b> - target launch vs realistic onboarding time (~3 months with a space, ~4.5 without).',
    '<b>Territory priority (10)</b> - High 10, Medium 6, Low 3.',
    '<b>Adjustments</b> - catchment overlap with an existing store, data contradictions, signals in the notes (loan dependency, indecision, competing brand).'
  ]) + '<p>Hard rules: no store in a pin that already has one; only one approved partner per pin; data that contradicts itself goes on hold until clarified.</p>';

  // ---------------------------------------------------------------- new features
  function commitChange(state, newData, headerHtml, focusIds, extra) {
    var after = E.evaluate(newData, { today: state.today });
    var html = headerHtml + renderDiff(diff(state.result, after), focusIds);
    if (focusIds.length === 1) html += '<div class="nested">' + explain(res(after, focusIds[0]), after) + '</div>';
    html += '<p class="muted">Type <i>undo</i> to reverse this.</p>';
    return Object.assign({ html: html, data: newData, result: after, committed: true, focus: focusIds[0] }, extra || {});
  }

  function addApplicant(raw, state, idNum) {
    var data = state.data;
    var nums = data.applications.map(function (a) { return H.canonicalAppId(a.id) || 0; });
    var n = idNum ? parseInt(idNum, 10) : Math.max.apply(null, nums.concat([0])) + 1;
    var id = 'APP-' + String(n).padStart(3, '0');
    if (nums.indexOf(n) >= 0) return { html: '<p>' + appLink(id) + ' already exists - tell me what changed about it instead.</p>' };
    var name = (raw.match(/(?:named|name is|name:|called)\s+([A-Za-z][A-Za-z.]*(?:\s+[A-Z][A-Za-z.]*)*)/) || raw.match(/\bAPP[\s\-_#]*\d+\s*[:,\-–]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/) || [])[1] || '';
    var pin = (raw.match(/\b(\d{6})\b/) || [])[1] || '';
    var city = findCity(raw) || H.cityFromPin(pin);
    var biz = (raw.match(/\b(?:runs|owns|manages|ran|managed|works (?:at|in|as))\s+(?:a |an |two |his |her )?([^,.;]+)/i) || [])[1] || '';
    if (/shop|store|space|floor|unit/.test(biz) && /ground|upper|mall|floor|sq/.test(biz)) biz = '';
    var blank = { id: id, name: name.trim(), city: city, cityRaw: city, state: 'Karnataka', pin: pin, pinRaw: pin, investment: null, experience: null, business: biz.trim(),
      space: 'Not yet identified', floor: 'Not known', size: null, launchMonths: null, language: 'English', notes: raw, added: true };
    var tmp = { applications: [blank], territories: data.territories, stores: data.stores };
    var u = parseUpdate(raw.replace(/\b(new|another)\b/gi, ''), tmp, [id], []);
    if (u && u.app[id]) Object.keys(u.app[id]).forEach(function (k) { if (k !== 'noteAppend' && k !== 'withdrawn' && k !== 'city' || (k === 'city' && !blank.city)) blank[k] = u.app[id][k]; });
    if (blank.experience === null) { var ex = raw.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i); if (ex) blank.experience = parseFloat(ex[1]); }
    if (blank.launchMonths === null) { var mo = raw.match(/(\d+)\s*months?/i); if (mo) blank.launchMonths = parseInt(mo[1], 10); }
    var d = H.clone(data);
    d.applications.push(blank);
    var got = [['Name', blank.name], ['City', blank.city], ['Pin', blank.pin], ['Investment', blank.investment !== null ? H.fmtL(blank.investment) : ''], ['Experience', blank.experience !== null ? blank.experience + ' yrs' : ''],
      ['Business', blank.business], ['Space', blank.space + (blank.space !== 'Not yet identified' ? ', ' + blank.floor + (blank.size ? ', ' + blank.size + ' sq ft' : '') : '')], ['Launch', blank.launchMonths !== null ? blank.launchMonths + ' months' : ''], ['Language', blank.language]];
    var missing = got.filter(function (g) { return !g[1]; }).map(function (g) { return g[0]; });
    var header = '<p><b>Added new application ' + appLink(id) + '.</b></p>' + list(got.filter(function (g) { return g[1]; }).map(function (g) { return g[0] + ': <b>' + esc(g[1]) + '</b>'; }));
    if (missing.length) header += '<p class="muted">Not given: ' + missing.join(', ') + ' - treated as unknown. Add them by telling me, e.g. "' + id + ' can invest 30 lakh".</p>';
    return commitChange(state, d, header, [id]);
  }

  function overrideApp(state, id, status, reason) {
    var d = H.clone(state.data);
    var a = d.applications.filter(function (x) { return x.id === id; })[0];
    if (!status) {
      if (!a.override) return { html: '<p>' + appLink(id) + ' has no override.</p>' };
      delete a.override;
      return commitChange(state, d, '<p><b>Override removed</b> for ' + appLink(id) + ' - the engine decides again.</p>', [id]);
    }
    if (!reason) return { html: '<p>Overrides need a reason so the decision stays explainable. Try: <i>"' + (status === 'APPROVED' ? 'Approve' : status === 'REJECTED' ? 'Reject' : 'Hold') + ' ' + esc(id) + ' because …"</i></p>' };
    a.override = { status: status, reason: reason, at: new Date().toISOString() };
    return commitChange(state, d, '<p><b>Manager override</b>: ' + appLink(id) + ' → ' + chip(status) + ' <span class="muted">(“' + esc(reason) + '”)</span></p>', [id]);
  }

  function pathHtml(state, id) {
    var p = E.pathToYes(state.data, id, { today: state.today });
    var r = res(state.result, id);
    if (!p.options.length) return '<p>' + appLink(id) + ' is ' + chip(r.status) + (r.status === 'APPROVED' ? ' already.' : ' - nothing on our side would change that.') + '</p>';
    var good = p.options.filter(function (o) { return o.better; });
    var html = '<p><b>Path to yes for ' + appLink(id) + '</b> (now ' + chip(r.status) + ', score ' + r.score + '). I re-ran every decision for each change:</p>';
    html += list((good.length ? good : p.options).slice(0, 6).map(function (o) {
      return (o.side === 'brand' ? '<span class="tag brand">Brand</span> ' : o.side === 'combined' ? '<span class="tag combo">All together</span> ' : '<span class="tag">Applicant</span> ') + esc(o.label) + ' → ' + chip(o.status) + ' <span class="muted">score ' + o.score + '</span>';
    }));
    if (!good.length) html += '<p class="muted">None of these alone moves the decision.</p>';
    return html;
  }

  function portfolioHtml(result, low) {
    var pf = E.portfolio(result);
    var html = '';
    if (/cohort|batch|train/.test(low) || !/calendar|open|week|action|to-?do/.test(low)) {
      html += '<p><b>Training cohorts</b> - partners grouped by language and month, so one trainer runs each batch:</p>' + list(pf.cohorts.map(function (c) {
        return '<b>' + esc(c.language) + ' · ' + esc(c.month) + '</b>: ' + c.members.map(function (m) { return appLink(m.id); }).join(', ');
      }));
    }
    if (/calendar|open/.test(low)) html += '<p><b>Opening calendar</b>:</p>' + list(pf.openings.map(function (o) { return esc(o.launchDate) + ' - ' + appLink(o.id) + ' ' + esc(o.name) + ', ' + esc(o.city) + ' ' + chip(o.status); }));
    if (/week|action|to-?do/.test(low)) html += '<p><b>Due in the next 7 days</b>:</p>' + list(pf.actions.filter(function (a) { return a.kind !== 'partner' || /3 days/.test(a.by); }).slice(0, 12).map(function (a) { return appLink(a.id) + ' - ' + esc(a.text); }));
    return html;
  }

  // ---------------------------------------------------------------- main entry
  function respond(text, state) {
    var data = state.data, result = state.result;
    var raw = String(text || '').trim();
    var low = raw.toLowerCase();
    if (!data) return { html: '<p>Upload the Excel file (or click <b>Load sample data</b>) first, then ask me anything about the decisions.</p>' };
    if (!raw || /^(help|\?|hi|hello|hey|what can you do)/.test(low)) return { html: HELP };
    if (/^(undo|revert|go back)/.test(low)) return { undo: true };

    var appIds = findApps(raw, data), terIds = findTers(raw, data);

    // ---- a brand-new application typed into the chat
    var newId = (raw.match(/\bapp(?:lication)?[\s\-_#]*0*(\d{1,4})\b/i) || [])[1];
    var isNew = /^(new|add|another|adding)\b|\b(new (applicant|application)|has (just )?applied|wants to apply)\b/i.test(raw);
    if (isNew && (!newId || !appIds.length)) return addApplicant(raw, state, newId);

    // ---- manager override: "approve APP-012 because ...", "put APP-014 on hold: ..."
    var ov = low.match(/^(?:override\s+\S+\s+(?:to|as)\s+)?(approve|reject|decline|hold|put\s+\S+\s+on\s+hold|wait-?list|override)\b/);
    if (ov && appIds.length) {
      if (/(clear|remove|undo|cancel) (the )?override/.test(low)) return overrideApp(state, appIds[0], null, '');
      var word = (low.match(/\b(approve|approved|reject|rejected|decline|hold|wait-?list)\b/) || [])[1] || '';
      var st = /approv/.test(word) ? 'APPROVED' : /reject|declin/.test(word) ? 'REJECTED' : /wait/.test(word) ? 'WAITLIST' : /hold/.test(word) ? 'HOLD' : null;
      if (st) {
        var reason = (raw.match(/(?:because|reason[:\s]|as |since|due to|:|—| - )\s*(.+)$/i) || [])[1] || '';
        return overrideApp(state, appIds[0], st, reason.trim());
      }
    }
    if (/(clear|remove|undo|cancel) (the )?override/.test(low) && appIds.length) return overrideApp(state, appIds[0], null, '');

    // ---- path to yes
    if (appIds.length && /(what would it take|path to yes|how (can|could|do|does|would) .* (get|be|become) (approved|accepted|a yes|selected)|what (does|do|should) .* (need|have) to (get|be) (approved|accepted)|what.* (change|fix).* (approv|yes)|how to get .* approved|make .* approved)/.test(low)) return { html: pathHtml(state, appIds[0]), focus: appIds[0] };

    // ---- message to the applicant
    if (appIds.length && /(message|draft|whatsapp|e-?mail|letter|write to|notify|inform|communicat|what (do|should) we (tell|say))/.test(low)) {
      var langAsk = (low.match(/\b(kannada|hindi|english)\b/) || [])[1];
      var M = root.FranchiseMessages || (typeof require !== 'undefined' ? require('./messages.js') : null);
      if (M) {
        var rr = res(result, appIds[0]);
        var dr = M.draft(rr, langAsk ? langAsk.charAt(0).toUpperCase() + langAsk.slice(1) : null);
        return { html: '<p>Draft for ' + appLink(rr.app.id) + ' in <b>' + dr.language + '</b> (their preferred language is ' + esc(rr.app.language) + '):</p><pre class="msg-draft">' + esc(dr.text) + '</pre><p class="muted">Open the applicant to copy it or switch language.</p>', focus: rr.app.id, tab: 'message' };
      }
    }

    // ---- portfolio: openings calendar, training cohorts, this week's actions
    if (!appIds.length && /(cohort|training batch|batches|calendar|openings?|when .* open|this week|due (this|next) week|action items|to-?do list)/.test(low)) return { html: portfolioHtml(result, low), view: /cohort|batch|calendar|opening/.test(low) ? 'onboarding' : null };

    var isWhatIf =/^(what if|what happens if|suppose|hypothetically|if )/.test(low);
    var isQuestion = (/^(why|how|what|which|who|when|where|is|are|does|do|did|can|could|would|will|was|were|should|show|list|explain|tell|give|compare|summar|any)\b/.test(low) || /\?\s*$/.test(low)) && !isWhatIf;
    var updateVerb = /(\bnow\b|found|secured|has got|got a|increased|decreased|raised|reduced|changed|updated|moved|shift|withdr|dropped|signed|arranged|sanctioned|approved|no longer|instead|can invest|wants to|corrected|actually|has \d|have \d|added|closed|opened|lost|bought|rented|leased|backed out|is ready|ready to)/.test(low);

    if (isQuestion && /\bif\b/.test(low) && (appIds.length || terIds.length)) { isWhatIf = true; isQuestion = false; } // "Would APP-5 be approved if ...?"
    if ((isWhatIf || !isQuestion) && (appIds.length || terIds.length || /store|outlet/.test(low))) {
      var u = parseUpdate(raw, data, appIds, terIds);
      if (u) {
        var applied = applyUpdate(data, u, raw);
        if (!applied.lines.length) return { html: '<p>That matches what I already have - nothing to change.</p>' };
        var after = E.evaluate(applied.data, { today: state.today });
        var changes = diff(result, after);
        var focus = appIds.concat(after.results.filter(function (r) { return r.territoryId && terIds.indexOf(r.territoryId) >= 0; }).map(function (r) { return r.app.id; }));
        var html = (isWhatIf ? '<p class="whatif">What-if preview - <b>nothing has been saved</b>.</p>' : '<p><b>Updated.</b></p>') + list(applied.lines);
        if (u.notes.length) html += '<p class="muted">' + u.notes.join(' ') + '</p>';
        html += renderDiff(changes, focus);
        if (appIds.length === 1) {
          var r1 = res(after, appIds[0]);
          html += '<div class="nested">' + explain(r1, after) + '</div>';
        }
        if (isWhatIf) html += '<p>Say it without "what if" to apply it.</p>';
        else html += '<p class="muted">Type <i>undo</i> to reverse this.</p>';
        return isWhatIf ? { html: html } : { html: html, data: applied.data, result: after, committed: true, focus: appIds[0] };
      }
      if (!isQuestion && updateVerb) return { html: '<p>I understood this is new information about ' + appIds.concat(terIds).join(', ') + ', but not which detail changed. Try e.g. <i>"' + (appIds[0] || 'APP-001') + ' has found a 500 sq ft ground-floor space"</i>, <i>"can now invest 30 lakh"</i>, <i>"has 4 years of retail experience"</i>, <i>"wants to launch in 6 months"</i> or <i>"has withdrawn"</i>.</p>' };
    }

    if (/(how do you (score|decide)|scoring|criteria|rules|assumption|methodology|how does (this|it) work)/.test(low)) return { html: SCORING };

    if (appIds.length >= 2 && /(compar|vs\.?|versus|better|differ|between|over|instead of|lose|lost|beat|ahead|chosen|picked|preferred)/.test(low)) return { html: compare(appIds.slice(0, 3), result), focus: appIds[0] };

    if (appIds.length) {
      var r = res(result, appIds[0]);
      if (/(next|step|onboard|train|prepar|plan|timeline|launch|open(ing)? date|when will|ready|to-?do|payback|how long)/.test(low)) return { html: planHtml(r), focus: r.app.id };
      if (/(score|breakdown|points|marks)/.test(low)) return { html: '<p>' + appLink(r.app.id) + ' scored <b>' + r.score + '/100</b>:</p>' + list(r.breakdown.map(function (b) { return esc(b.k) + ': <b>' + b.pts + '</b>' + (b.max ? '/' + b.max : '') + ' <span class="muted">(' + esc(b.note) + ')</span>'; })), focus: r.app.id };
      var html2 = explain(r, result);
      if (appIds.length > 1) html2 += '<p class="muted">Also mentioned: ' + appIds.slice(1).map(appLink).join(', ') + ' - ask about them separately or say "compare".</p>';
      return { html: html2, focus: r.app.id };
    }

    if (terIds.length) return { html: terIds.map(function (id) { return terHtml(ter(result, id), result); }).join('<hr>') };

    var statusWords = [['APPROVED', /approved|accepted|moving forward|go ahead|selected/], ['CONDITIONAL', /conditional/], ['WAITLIST', /wait ?list/], ['HOLD', /on hold|\bhold\b|pending|stuck/], ['REJECTED', /reject|declin|turned down/], ['WITHDRAWN', /withdr/]];
    for (var i = 0; i < statusWords.length; i++) if (statusWords[i][1].test(low)) return { html: statusList(statusWords[i][0], result) };

    var city = findCity(raw);
    if (city && /(free|available|open|which pin|where)/.test(low)) {
      var ts = result.territories.filter(function (t) { return t.city === city; });
      if (!ts.length) return { html: '<p>The brand has no target territory in ' + city + ' right now.</p>' };
      return { html: ts.map(function (t) { return terHtml(t, result); }).join('<hr>') };
    }
    if (city) {
      var cr = result.results.filter(function (r) { return r.app.city === city; });
      return { html: '<p>' + cr.length + ' applicant(s) for ' + city + ':</p>' + list(cr.map(function (r) { return appLink(r.app.id) + ' ' + chip(r.status) + ' ' + esc(r.app.name) + ' · score ' + r.score; })) };
    }
    if (/(territor|slots)/.test(low)) return { html: result.territories.map(function (t) { return '<p><b>' + t.id + '</b> ' + t.city + ' · ' + t.priority + ' · ' + t.filled + '/' + t.slots + ' filled' + (t.allocated.length ? ' (' + t.allocated.map(appLink).join(', ') + ')' : '') + '</p>'; }).join('') };
    if (/(best|top|strongest|highest)/.test(low)) {
      var top = result.results.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
      return { html: list(top.map(function (r) { return appLink(r.app.id) + ' ' + esc(r.app.name) + ' · ' + r.score + ' ' + chip(r.status); })) };
    }
    if (/cannibal|overlap|existing store|near(by)? store/.test(low)) {
      var ov = result.results.filter(function (r) { return r.cannibalisation || r.blocking.some(function (b) { return b.code === 'store_pin'; }); });
      return { html: '<p>Existing stores: ' + data.stores.map(function (s) { return s.id + ' (' + s.pin + ')'; }).join(', ') + '.</p>' + (ov.length ? '<p>Applicants clashing with them:</p>' + list(ov.map(function (r) { return appLink(r.app.id) + ' pin ' + r.app.pin + ' - ' + (r.cannibalisation ? 'next to ' + r.cannibalisation : 'same pin as a store'); })) : '<p>No applicant clashes with an existing store.</p>') };
    }
    if (/(summary|overview|status|how many|stats|dashboard|report)/.test(low)) return { html: summary(result) };
    if (/(data|issue|incomplete|missing|contradict|error)/.test(low)) {
      var bad = result.results.filter(function (r) { return r.flags.length || r.blocking.some(function (b) { return /pin_|inv_missing|duplicate|city/.test(b.code); }); });
      return { html: bad.length ? '<p>' + bad.length + ' application(s) with incomplete or contradictory data:</p>' + list(bad.map(function (r) { return appLink(r.app.id) + ' - ' + esc(r.blocking.map(function (b) { return b.text; }).concat(r.flags).join(' ')); })) : '<p>No data issues found.</p>' };
    }
    return { html: '<p>I did not catch an application or territory in that. ' + HELP.replace('<p>I can explain decisions and take new information. Try:</p>', '</p><p>Try:</p>') };
  }

  var api = { diff: diff, renderDiff: renderDiff, commitChange: commitChange, respond: respond, parseUpdate: parseUpdate, findApps: findApps, explain: explain, planHtml: planHtml, esc: esc, chip: chip };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FranchiseChat = api;
})(this);
