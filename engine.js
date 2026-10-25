/* FranchiseFlow decision engine
 * Pure functions: data in -> decisions out. No network, no randomness, so the
 * same file always gives the same answer and every decision can be explained.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Assumptions (shown in the UI and the deck; tweak here)
  // ---------------------------------------------------------------------------
  var CITIES = {
    'Bengaluru':        { state: 'Karnataka', prefix: '560', tier: 1 },
    'Mysuru':           { state: 'Karnataka', prefix: '570', tier: 2 },
    'Mangaluru':        { state: 'Karnataka', prefix: '575', tier: 2 },
    'Hubballi-Dharwad': { state: 'Karnataka', prefix: '580', tier: 2 },
    'Belagavi':         { state: 'Karnataka', prefix: '590', tier: 2 },
    'Tumakuru':         { state: 'Karnataka', prefix: '572', tier: 3 },
    'Davanagere':       { state: 'Karnataka', prefix: '577', tier: 3 }
  };
  var CITY_ALIASES = [
    [/bengal|bangal|blr/i, 'Bengaluru'], [/mysu|mysor/i, 'Mysuru'],
    [/mangal|mangaluru|mangalore/i, 'Mangaluru'], [/hub|dharwa/i, 'Hubballi-Dharwad'],
    [/belag|belgaum|belgav/i, 'Belagavi'], [/tumk|tumak/i, 'Tumakuru'],
    [/davan|davang/i, 'Davanagere']
  ];
  // Rough road distance order between cities, used to pick a shadowing store
  // when the applicant's city has none.
  var NEAREST_CITY = {
    'Tumakuru': ['Bengaluru', 'Mysuru'], 'Davanagere': ['Hubballi-Dharwad', 'Bengaluru'],
    'Mangaluru': ['Mysuru', 'Bengaluru'], 'Belagavi': ['Hubballi-Dharwad', 'Bengaluru'],
    'Hubballi-Dharwad': ['Belagavi', 'Bengaluru'], 'Mysuru': ['Bengaluru'], 'Bengaluru': ['Mysuru']
  };

  var ASSUMPTIONS = {
    // Total cost to open a store (franchise fee + fit-out + first inventory + deposit), ₹ lakh
    setupCost: { 1: 35, 2: 25, 3: 18 },
    // Below this share of setup cost we reject; between this and 100% it is a condition
    rejectBelowRatio: 0.7,
    minSpaceSqft: 300,
    idealSpaceSqft: [400, 1200],
    // Expected monthly sales (₹ lakh) for a ground-floor store of ideal size
    monthlySales: { 1: 9, 2: 6.5, 3: 4.5 },
    partnerNetMargin: 0.15,
    floorFootfall: { 'Ground': 1, 'Mall unit': 0.9, 'Upper': 0.55, 'Not known': 0.8 },
    // "Same catchment" proxy: pin codes in the same city within this numeric distance
    catchmentPinDistance: 2,
    cannibalisationPenalty: 6,
    minScoreToProceed: 40,
    // Rubric weights: how many of the 100 points each factor is worth (normalised to 100 if they don't add up)
    weights: { funds: 25, space: 25, experience: 20, business: 10, timeline: 10, territory: 10 },
    // Weeks for each onboarding step
    weeks: { siteHunt: 6, agreement: 2, siteApproval: 1, fitOut: { 1: 7, 2: 6, 3: 5 }, preLaunch: 1 }
  };

  var STATUS = {
    APPROVED:    { label: 'Approved', order: 1, blurb: 'Slot confirmed - start onboarding' },
    CONDITIONAL: { label: 'Conditional', order: 2, blurb: 'Slot reserved for 30 days while conditions are met' },
    WAITLIST:    { label: 'Waitlisted', order: 3, blurb: 'Eligible, but no slot right now' },
    HOLD:        { label: 'On hold', order: 4, blurb: 'Needs information or a new location before we can decide' },
    REJECTED:    { label: 'Rejected', order: 5, blurb: 'Does not meet the minimum bar' },
    WITHDRAWN:   { label: 'Withdrawn', order: 6, blurb: 'Applicant has withdrawn' }
  };

  var RETAIL_WORDS = /(store|shop|retail|outlet|showroom|boutique|kirana|supermarket|mart|franchise|footwear|apparel|garment|cloth|optical|optician|eyewear|pharmac|medical store|chemist|mobile|electronics|bakery|jewel|stationery|textile|salon|cafe|restaurant|grocery|provision|dealer|distributor|trader|trading)/i;
  var ADJACENT_WORDS = /(business|sales|marketing|entrepreneur|own|manag|wholesale|agency|real estate|contractor|hotel|import|export|fmcg|bank|insurance)/i;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function clean(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function isBlank(v) { var s = clean(v); return s === '' || /^(na|n\/a|nil|none|-|null|tbd|\?)$/i.test(s); }

  function toNumber(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = clean(v).toLowerCase().replace(/,/g, '');
    if (!s || isBlank(s)) return null;
    var m = s.match(/-?\d+(\.\d+)?/);
    if (!m) {
      var words = { zero: 0, none: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20 };
      for (var w in words) if (new RegExp('\\b' + w + '\\b').test(s)) return words[w];
      return null;
    }
    return parseFloat(m[0]);
  }

  // Investment in lakh. Handles "25", "25 lakh", "₹25,00,000", "1.2 crore".
  function toLakh(v) {
    var n = toNumber(v);
    if (n === null) return null;
    var s = clean(v).toLowerCase();
    if (/cr/.test(s)) return n * 100;
    if (n >= 10000) return n / 100000; // given in rupees
    return n;
  }

  function normCity(v) {
    var s = clean(v);
    if (!s) return '';
    for (var c in CITIES) if (c.toLowerCase() === s.toLowerCase()) return c;
    for (var i = 0; i < CITY_ALIASES.length; i++) if (CITY_ALIASES[i][0].test(s)) return CITY_ALIASES[i][1];
    return s;
  }
  function cityFromPin(pin) {
    for (var c in CITIES) if (pin && pin.indexOf(CITIES[c].prefix) === 0) return c;
    return '';
  }
  function normPin(v) {
    var s = clean(v).replace(/\.0+$/, '').replace(/\s/g, '');
    var m = s.match(/\d{6}/);
    return m ? m[0] : '';
  }
  function normTier(v) { var n = toNumber(v); return n && n >= 1 && n <= 3 ? n : null; }
  function normFloor(v) {
    var s = clean(v).toLowerCase();
    if (!s) return 'Not known';
    if (/mall/.test(s)) return 'Mall unit';
    if (/ground|gf|street|road[- ]?facing/.test(s)) return 'Ground';
    if (/upper|first|1st|second|2nd|third|basement|above/.test(s)) return 'Upper';
    return 'Not known';
  }
  function normSpace(v) {
    var s = clean(v).toLowerCase();
    if (/own/.test(s)) return 'Owned';
    if (/rent|lease/.test(s)) return 'Rented';
    return 'Not yet identified';
  }
  function normLanguage(v) {
    var s = clean(v).toLowerCase();
    if (/kan/.test(s)) return 'Kannada';
    if (/hin/.test(s)) return 'Hindi';
    if (/eng/.test(s)) return 'English';
    return '';
  }
  function normPriority(v) {
    var s = clean(v).toLowerCase();
    if (/high/.test(s)) return 'High';
    if (/low/.test(s)) return 'Low';
    return 'Medium';
  }
  function canonicalAppId(id) {
    var m = clean(id).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
  function round(n, d) { var p = Math.pow(10, d || 0); return Math.round(n * p) / p; }
  function fmtL(n) { return n === null || n === undefined ? '?' : '₹' + round(n, 1) + ' L'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function addWeeks(date, w) { var d = new Date(date.getTime()); d.setDate(d.getDate() + Math.round(w * 7)); return d; }
  function fmtDate(d) {
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  // ---------------------------------------------------------------------------
  // Notes reading: picks up signals the fixed columns miss
  // ---------------------------------------------------------------------------
  function readSignals(text) {
    var s = clean(text).toLowerCase();
    var sig = [];
    if (!s) return sig;
    if (/(loan|borrow|financ|emi|mudra|need funding|bank support)/.test(s) && !/(loan (is |has been )?(approved|sanctioned|cleared)|no loan|without (a )?loan|(no longer|doesn.?t|does not|won.?t) need (a |the )?loan|self[- ]funded)/.test(s))
      sig.push({ key: 'loan', text: 'Part of the money depends on a loan', penalty: 4 });
    if (/(not sure|unsure|maybe|just exploring|exploring options|thinking about|undecided|if things work out)/.test(s))
      sig.push({ key: 'uncertain', text: 'Notes suggest the applicant is still undecided', penalty: 5 });
    if (/(partner|brother|sister|father|wife|husband|friend|co-?invest|family)/.test(s))
      sig.push({ key: 'coinvestor', text: 'Another person is involved (family / co-investor) - add them to KYC', penalty: 0 });
    if (/(looking for|searching|yet to find|finding a|need (a )?(shop|space|place))/.test(s))
      sig.push({ key: 'nospace_note', text: 'Notes say the applicant is still looking for a space', penalty: 0 });
    if (/(other (city|town)|relocat|shift(ing)? to|move to)/.test(s))
      sig.push({ key: 'relocate', text: 'Notes mention another city or relocation', penalty: 3 });
    var fest = s.match(/diwali|deepavali|dasara|dussehra|ugadi|christmas|new year|sankranti|onam|eid|festival|wedding season/);
    if (fest) sig.push({ key: 'deadline', text: 'Applicant wants to open around ' + fest[0] + ' - check the date against the realistic launch', penalty: 0 });
    if (/(already (run|own|have) (a )?franchise|franchise (owner|partner) of|runs? (a |an )?\w+ franchise)/.test(s))
      sig.push({ key: 'franchise_exp', text: 'Has run a franchise before', bonus: 4 });
    if (/(full[- ]?time|quit|resign|dedicated|will run (it )?myself|personally)/.test(s))
      sig.push({ key: 'committed', text: 'Will run the store full-time', bonus: 2 });
    if (/(part[- ]?time|weekends only|absentee|manager will run|someone else will run|(continue|keep) (my|his|her|their) job|alongside (my|his|her|their) job)/.test(s))
      sig.push({ key: 'absentee', text: 'May not run the store day to day (has a job or plans to hire a manager)', penalty: 3 });
    if (/(competitor|another (eyewear|brand)|already selling)/.test(s))
      sig.push({ key: 'conflict', text: 'Possible conflict of interest with a competing brand', penalty: 6 });
    if (/(withdraw|not interested|no longer interested|cancel)/.test(s))
      sig.push({ key: 'withdraw', text: 'Notes say the applicant is withdrawing', penalty: 0 });
    return sig;
  }

  function businessRelevance(text) {
    var s = clean(text);
    if (!s || isBlank(s)) return { pts: 0, label: 'No business background given' };
    if (/(no business|never|fresher|student|homemaker|house ?wife|unemployed)/i.test(s)) return { pts: 1, label: 'No business background' };
    if (RETAIL_WORDS.test(s)) return { pts: 10, label: 'Retail / shop background' };
    if (ADJACENT_WORDS.test(s)) return { pts: 6, label: 'Business background (not retail)' };
    return { pts: 3, label: 'Salaried / unrelated background' };
  }

  // ---------------------------------------------------------------------------
  // Main evaluation
  // ---------------------------------------------------------------------------
  /**
   * data = { applications: [...], territories: [...], stores: [...] } (already normalised
   * by normalise*()). opts.today: Date. Returns { results, territories, insights }.
   */
  function evaluate(data, opts) {
    opts = opts || {};
    var today = opts.today ? new Date(opts.today) : new Date();
    var A = ASSUMPTIONS;

    var stores = data.stores.slice();
    var storePins = {};
    stores.forEach(function (s) { storePins[s.pin] = s; });

    var territories = data.territories.map(function (t) {
      return Object.assign({}, t, { allocated: [], waitlist: [], applicants: [] });
    });
    var pinToTerritory = {};
    territories.forEach(function (t) { t.pins.forEach(function (p) { pinToTerritory[p] = t; }); });

    // Pins taken today = existing stores. Approved applicants are added as we allocate.
    var results = data.applications.map(function (app) { return assess(app); });

    // Duplicate detection (same person + city applied twice): keep the stronger row
    var seen = {};
    results.forEach(function (r) {
      var key = r.app.name.toLowerCase().replace(/\s+/g, ' ') + '|' + r.app.city;
      if (!r.app.name) return;
      if (seen[key]) {
        var first = seen[key];
        var weaker = first.score >= r.score ? r : first;
        var stronger = weaker === r ? first : r;
        weaker.blocking.push({ code: 'duplicate', text: 'Looks like a duplicate of ' + stronger.app.id + ' (same name and city). We keep one application per person.', action: 'Call to confirm whether this is the same person as ' + stronger.app.id + '; keep one application and close the other.' });
        weaker.duplicateOf = stronger.app.id;
      } else seen[key] = r;
    });

    // ---- Allocation: best score first, one store per pin, respect open slots
    var taken = {}; // pin -> appId
    // Manager overrides: a forced approval jumps the queue (it still can't break the one-store-per-pin
    // rule or use a pin we can't trust); a forced hold/reject never enters allocation.
    var HARD = /^(store_pin|pin_missing|pin_mismatch|city)$/;
    results.forEach(function (r) {
      var o = r.app.override;
      if (!o || r.preStatus === 'WITHDRAWN') return;
      if (o.status === 'APPROVED') {
        var hard = r.blocking.filter(function (b) { return HARD.test(b.code); });
        if (hard.length || !r.territory) { r.overrideBlocked = hard.length ? hard[0].text : 'Pin is not in a target territory.'; return; }
        r.forceApprove = true;
        r.blocking = [];
        r.preStatus = 'ELIGIBLE';
      }
    });
    // Applicants whose own pin can't be used (store already there, or outside target pins) compete like
    // pin losers: at a relocation score, because moving means giving up the shop they have.
    results.forEach(function (r) {
      if (r.preStatus !== 'ELIGIBLE' || !r.blocking.length) return;
      if (!r.blocking.every(function (b) { return b.code === 'store_pin' || b.code === 'no_territory'; })) return;
      var b = r.blocking[0];
      var t = r.territory;
      if (b.code === 'no_territory') {
        t = territories.filter(function (x) { return x.city === r.app.city && x.slots > 0; })
          .sort(function (x, y) { return ({ High: 0, Medium: 1, Low: 2 })[x.priority] - ({ High: 0, Medium: 1, Low: 2 })[y.priority]; })[0];
      }
      if (!t) return;
      var sp = r.breakdown.filter(function (x) { return x.k === 'Space readiness'; })[0];
      r.territory = t;
      r.relocating = true;
      r.relocateWhy = b.text;
      r.relocationScore = Math.max(0, r.score - (sp ? sp.pts : 0) + 5);
      r.blocking = [];
    });
    var eligible = results.filter(function (r) {
      if (r.app.override && r.app.override.status !== 'APPROVED') return false;
      return r.preStatus === 'ELIGIBLE' && !r.blocking.length;
    });
    function rank(r) { return (r.forceApprove ? 1000 : 0) + (r.relocating ? r.relocationScore : r.score); }
    eligible.sort(function (a, b) {
      return rank(b) - rank(a) || readiness(b) - readiness(a) || a.idNum - b.idNum;
    });
    var queue = eligible.slice();
    function enqueue(r) {
      var i = 0;
      while (i < queue.length && (rank(queue[i]) > rank(r) || (rank(queue[i]) === rank(r) && queue[i].idNum < r.idNum))) i++;
      queue.splice(i, 0, r);
    }
    while (queue.length) {
      var r = queue.shift();
      var t = r.territory;
      var pin = r.app.pin;
      if (!r.relocating && taken[pin]) {
        // Their pin is gone. Moving means giving up the shop they have there, so they re-enter
        // the queue scored as if they had no space yet - fair to applicants who are ready elsewhere.
        var sp = r.breakdown.filter(function (b) { return b.k === 'Space readiness'; })[0];
        r.relocating = true;
        r.pinLostTo = taken[pin];
        r.relocationScore = Math.max(0, r.score - (sp ? sp.pts : 0) + 5);
        enqueue(r);
        continue;
      }
      var full = t.allocated.length >= t.slots;
      if (r.relocating) {
        var winner = r.pinLostTo ? byId(results, r.pinLostTo) : null;
        var free = freePins(t);
        if (winner) r.competitor = winner.app.id;
        var lostTxt = winner ? 'Pin ' + pin + ' went to ' + winner.app.id + ' (score ' + winner.score + ' vs ' + r.score + ') - the brand never opens two stores in one pin code.' : r.relocateWhy;
        var lostShort = winner ? 'Lost pin ' + pin + ' to ' + winner.app.id : (/already has our store/.test(r.relocateWhy) ? 'Pin ' + pin + ' already has our store' : 'Pin ' + pin + ' is outside our target areas');
        r.reasons.unshift({ t: '-', text: lostTxt });
        if (!full && free.length) {
          // prefer a pin no other applicant asked for, so a relocation never takes someone's ready shop
          var wanted = {};
          results.forEach(function (x) { if (x !== r && x.preStatus !== 'WITHDRAWN') wanted[x.app.pin] = true; });
          free.sort(function (p, q) { return (wanted[p] ? 1 : 0) - (wanted[q] ? 1 : 0); });
          var newPin = free[0];
          taken[newPin] = r.app.id;
          t.allocated.push(r.app.id);
          r.proposedPin = newPin;
          r.suggestedPins = free;
          r.status = 'CONDITIONAL';
          r.conditions.unshift('Relocate: find a ground-floor or mall unit in pin ' + newPin + ' (reserved for you for 45 days; other free pins: ' + (free.slice(1, 4).join(', ') || 'none') + ').');
          r.reasons.push({ t: '+', text: 'Even after losing the space points for moving (relocation score ' + r.relocationScore + '), still among the best for ' + t.id + ' - free pin ' + newPin + ' reserved.' });
          r.headline = lostShort + ', but they are strong enough to keep a slot in ' + t.id + ' - pin ' + newPin + ' reserved if they relocate.';
        } else {
          r.status = 'WAITLIST';
          r.headline = lostShort + '; moving would cost them their shop (relocation score ' + r.relocationScore + '), and ' + t.id + '\'s slot(s) went to partners ready elsewhere.';
          r.suggestedPins = free;
          r.reasons.push({ t: '-', text: 'Relocation score ' + r.relocationScore + ' (no space in a new pin) is below the partners who took ' + t.id + '\'s slots: ' + t.allocated.join(', ') + '.' });
          r.actions.unshift('First backup for ' + t.id + ': offer a free pin (' + (free.slice(0, 3).join(', ') || 'none free now') + ') if an approved partner drops out.');
          t.waitlist.push(r.app.id);
        }
        continue;
      }
      if (full) {
        var last = byId(results, t.allocated[t.allocated.length - 1]);
        r.status = 'WAITLIST';
        r.headline = 'Qualified, but all ' + t.slots + ' slot(s) in ' + t.id + ' went to higher-scoring applicants.';
        r.reasons.push({ t: '-', text: t.id + ' has ' + t.slots + ' open slot(s); they went to ' + t.allocated.join(', ') + ' (lowest winning score ' + (last ? last.score : '-') + ' vs ' + r.score + ').' });
        r.actions.unshift('Keep warm: first in line if a slot in ' + t.id + ' opens or an approved partner drops out.');
        r.competitor = t.allocated[t.allocated.length - 1];
        t.waitlist.push(r.app.id);
        continue;
      }
      taken[pin] = r.app.id;
      t.allocated.push(r.app.id);
      r.status = r.conditions.length && !r.forceApprove ? 'CONDITIONAL' : 'APPROVED';
      if (r.forceApprove) { r.headline = 'Approved by manager override - slot ' + t.allocated.length + ' of ' + t.slots + ' in ' + t.id + '.'; continue; }
      r.headline = r.status === 'APPROVED'
        ? 'Strong fit (' + r.score + '/100) and pin ' + pin + ' is free - slot ' + t.allocated.length + ' of ' + t.slots + ' in ' + t.id + '.'
        : 'Good fit (' + r.score + '/100) - slot in ' + t.id + ' reserved for 30 days while ' + r.conditions.length + ' condition(s) are cleared.';
    }

    // Alternative pins are only offered once allocation is done, so we never offer a pin someone just won
    results.forEach(function (r) {
      r.blocking.forEach(function (b) {
        if (b.code !== 'store_pin' && b.code !== 'no_territory') return;
        var pool = b.code === 'store_pin' && r.territory ? [r.territory] : territories.filter(function (x) { return x.city === r.app.city && x.allocated.length < x.slots; });
        var pins = [];
        pool.forEach(function (x) { freePins(x).forEach(function (p) { if (pins.indexOf(p) < 0) pins.push(p); }); });
        r.suggestedPins = pins;
        b.action = pins.length ? 'Offer a free pin instead: ' + pins.slice(0, 4).join(', ') + '.' : 'No free pin left in ' + (r.territory ? r.territory.id : r.app.city) + ' right now - keep on file.';
        if (!pins.length && r.blocking.length === 1 && r.preStatus === 'ELIGIBLE') {
          r.preStatus = 'WAITLIST';
          r.headline = (b.code === 'store_pin' ? 'Pin ' + r.app.pin + ' already has our store' : 'Pin ' + r.app.pin + ' is outside our target areas') + ', and every slot in ' + (r.territory ? r.territory.id : r.app.city) + ' is now filled - kept on the waitlist.';
          r.reasons.unshift({ t: '-', text: b.text });
          r.blocking = [];
          r.actions.push('Offer a free pin as soon as a slot opens in ' + (r.territory ? r.territory.id : r.app.city) + '.');
        }
      });
    });

    // Anything not decided yet keeps its pre-status
    results.forEach(function (r) {
      var o = r.app.override;
      if (o && r.preStatus !== 'WITHDRAWN' && o.status !== 'APPROVED') {
        r.status = o.status;
        r.headline = 'Manager decision: ' + (o.reason || 'no reason given') + '.';
        r.reasons.unshift({ t: '!', text: 'Set to ' + STATUS[o.status].label + ' by a manager override: ' + (o.reason || 'no reason given') + '.' });
        return;
      }
      if (o && o.status === 'APPROVED' && r.overrideBlocked && !r.status) {
        r.reasons.unshift({ t: '!', text: 'Manager asked to approve, but that would break a hard rule: ' + r.overrideBlocked });
      }
      if (r.forceApprove) r.reasons.unshift({ t: '!', text: 'Approved by a manager override: ' + (o.reason || 'no reason given') + '. (Engine fit score on its own: ' + r.score + '/100.)' });
      if (r.status) return;
      if (r.preStatus === 'WITHDRAWN') { r.status = 'WITHDRAWN'; return; }
      if (r.preStatus === 'REJECTED') { r.status = 'REJECTED'; return; }
      if (r.preStatus === 'WAITLIST') { r.status = 'WAITLIST'; return; }
      r.status = 'HOLD';
      if (!r.headline) r.headline = r.blocking.map(function (b) { return b.text; }).join(' ');
    });

    // Build onboarding plans for those moving forward, and actions for everyone else
    results.forEach(function (r) {
      if (r.status === 'APPROVED' || r.status === 'CONDITIONAL') r.plan = buildPlan(r, stores, today);
      r.blocking.forEach(function (b) { if (b.action) r.actions.push(b.action); });
      r.statusLabel = STATUS[r.status].label;
      r.statusBlurb = STATUS[r.status].blurb;
      if (r.territory) {
        var tt = r.territory;
        r.territoryId = tt.id;
        tt.applicants.push(r.app.id);
      }
      delete r.territory; // keep results serialisable
    });

    territories.forEach(function (t) {
      t.filled = t.allocated.length;
      t.remaining = Math.max(0, t.slots - t.allocated.length);
      t.freePins = freePins(t);
    });

    // Confidence: tell the manager which decisions deserve a human look
    results.forEach(function (r) {
      r.confidence = 'high'; r.reviewNote = '';
      var comp = r.competitor ? byId(results, r.competitor) : null;
      if (r.app.override) { r.confidence = 'manual'; r.reviewNote = 'Manager override: ' + (r.app.override.reason || 'no reason'); return; }
      if (r.status === 'WITHDRAWN') return;
      if (r.flags.length) { r.confidence = 'review'; r.reviewNote = (/blank/i.test(r.flags[0]) ? 'Form is incomplete: ' : 'Form contradicts itself: ') + r.flags[0] + '.'; return; }
      if (r.status === 'WAITLIST' && comp && comp.score - r.score <= 3) { r.confidence = 'review'; r.reviewNote = 'Close call: only ' + (comp.score - r.score) + ' point(s) behind ' + comp.app.id + '.'; return; }
      if (r.status === 'APPROVED' || r.status === 'CONDITIONAL') {
        var rival = results.filter(function (x) { return x.status === 'WAITLIST' && x.territoryId === r.territoryId && r.score - x.score <= 3 && r.score >= x.score; })[0];
        if (rival) { r.confidence = 'review'; r.reviewNote = 'Close call: ' + rival.app.id + ' is only ' + (r.score - rival.score) + ' point(s) behind.'; return; }
      }
      if (r.status === 'REJECTED' && r.score >= A.minScoreToProceed - 5) { r.confidence = 'review'; r.reviewNote = 'Borderline: score ' + r.score + ' is within 5 points of the bar.'; return; }
      if (r.status === 'HOLD') { r.confidence = 'waiting'; r.reviewNote = 'Waiting on one answer from the applicant.'; }
    });

    return { results: results, territories: territories, insights: buildInsights(results, territories), assumptions: A, evaluatedAt: today.toISOString() };

    // --------------------------------------------------------------------- //
    function freePins(t) {
      return t.pins.filter(function (p) { return !storePins[p] && !taken[p]; });
    }

    function assess(app) {
      var r = {
        app: app, idNum: canonicalAppId(app.id) || 9999, score: 0, breakdown: [], reasons: [], conditions: [],
        blocking: [], actions: [], flags: [], signals: readSignals(app.notes + ' ' + app.business),
        status: null, preStatus: 'ELIGIBLE', headline: '', territory: null
      };
      if (app.clearedSignals) r.signals = r.signals.filter(function (s) { return app.clearedSignals.indexOf(s.key) < 0; });
      var city = app.city, info = CITIES[city];

      // -- withdrawn
      if (app.withdrawn === true || (app.withdrawn !== false && r.signals.some(function (s) { return s.key === 'withdraw'; }))) {
        r.preStatus = 'WITHDRAWN';
        r.headline = 'Applicant has withdrawn - release any reserved slot.';
        r.reasons.push({ t: '!', text: 'Marked as withdrawn' + (app.withdrawn ? ' (update received).' : ' (from notes).') });
        return r;
      }

      // -- location checks
      if (!info) {
        r.blocking.push({ code: 'city', text: 'City "' + (app.cityRaw || 'blank') + '" is not one the brand operates in.', action: 'Confirm the city - we expand only in the 7 listed Karnataka cities.' });
      }
      if (!app.pin) {
        r.blocking.push({ code: 'pin_missing', text: 'Pin code is missing or not 6 digits ("' + (app.pinRaw || 'blank') + '").', action: 'Ask the applicant for the exact 6-digit pin code of the proposed store.' });
      } else if (info && app.pin.indexOf(info.prefix) !== 0) {
        var pinCity = cityFromPin(app.pin);
        r.blocking.push({ code: 'pin_mismatch', text: 'Pin ' + app.pin + ' does not belong to ' + city + (pinCity ? ' (it is a ' + pinCity + ' pin)' : '') + ' - city and pin contradict each other.', action: 'Confirm whether the store is in ' + city + ' or ' + (pinCity || 'the pin\'s city') + ', and the correct pin.' });
      }
      var tier = info ? info.tier : null;
      var t = app.pin ? pinToTerritory[app.pin] : null;
      if (t && t.city && t.city !== city) t = null; // contradicting city/pin: don't trust the territory match
      r.territory = t;

      // -- money
      var cost = tier ? A.setupCost[tier] : null;
      var inv = app.investment;
      if (inv === null || inv === undefined) {
        r.blocking.push({ code: 'inv_missing', text: 'Investment capacity is blank, so we cannot check affordability.', action: 'Ask for investment capacity and proof of funds.' });
      }

      // -- score: funds (25)
      var fundsPts = 0, ratio = null;
      if (inv !== null && cost) {
        ratio = inv / cost;
        fundsPts = ratio >= 1.3 ? 25 : ratio >= 1 ? 17 + (ratio - 1) / 0.3 * 8 : ratio >= 0.8 ? 8 + (ratio - 0.8) / 0.2 * 9 : Math.max(0, ratio / 0.8 * 8);
        if (ratio < A.rejectBelowRatio) {
          r.preStatus = 'REJECTED';
          r.reasons.push({ t: '-', text: 'Can invest ' + fmtL(inv) + ' but a Tier ' + tier + ' store needs about ' + fmtL(cost) + ' (only ' + Math.round(ratio * 100) + '%).' });
          var cheaper = Object.keys(CITIES).filter(function (c) { return A.setupCost[CITIES[c].tier] <= inv * 1.0; });
          if (cheaper.length) r.actions.push('Suggest re-applying for a Tier ' + CITIES[cheaper[0]].tier + ' city (needs ' + fmtL(A.setupCost[CITIES[cheaper[0]].tier]) + '), e.g. ' + cheaper.slice(0, 2).join(' or ') + '.');
          else r.actions.push('Send a polite decline; invite to re-apply when capital reaches ' + fmtL(cost * 0.8) + '.');
        } else if (ratio < 1) {
          r.conditions.push('Close the funding gap: show proof of ' + fmtL(cost) + ' (has ' + fmtL(inv) + ') - via partner bank loan or co-investor - within 21 days.');
          r.reasons.push({ t: '-', text: 'Funds ' + fmtL(inv) + ' are ' + Math.round(ratio * 100) + '% of the ~' + fmtL(cost) + ' setup cost.' });
        } else {
          r.reasons.push({ t: '+', text: 'Funds ' + fmtL(inv) + ' cover the ~' + fmtL(cost) + ' setup cost for a Tier ' + tier + ' city' + (ratio >= 1.3 ? ' with a healthy buffer.' : '.') });
        }
      }
      r.breakdown.push({ k: 'Funds', pts: round(fundsPts), max: 25, note: inv !== null ? fmtL(inv) + ' vs ' + fmtL(cost) + ' needed' : 'not given' });

      // -- experience (20) + business relevance (10)
      var yrs = app.experience;
      if (yrs === null || yrs === undefined) { r.flags.push('Retail experience blank - treated as 0 years'); yrs = 0; }
      var expPts = Math.min(20, 20 * (1 - Math.exp(-yrs / 3)));
      var biz = businessRelevance(app.business);
      if (yrs === 0 && biz.pts >= 10) { r.flags.push('Says 0 years retail experience but describes a retail business - check'); }
      r.breakdown.push({ k: 'Retail experience', pts: round(expPts), max: 20, note: yrs + ' yr' + (yrs === 1 ? '' : 's') });
      r.breakdown.push({ k: 'Business background', pts: biz.pts, max: 10, note: biz.label });
      if (yrs >= 3) r.reasons.push({ t: '+', text: yrs + ' years of retail experience.' });
      else if (yrs === 0) r.reasons.push({ t: '-', text: 'No retail experience - will need the extended training track and an experienced store manager.' });
      else r.reasons.push({ t: '~', text: yrs + ' year(s) of retail experience - standard training plus extra shadowing.' });

      // -- space (25)
      var space = app.space, floor = app.floor, size = app.size;
      var spacePts;
      var nospaceNote = !app.spaceUpdated && r.signals.some(function (s) { return s.key === 'nospace_note'; });
      if (space !== 'Not yet identified' && nospaceNote) {
        r.flags.push('Says space is ' + space + ' but notes say still looking - contradiction');
        r.conditions.push('Confirm the space: form says "' + space + '" but notes say still searching. Share address, photos and lease/ownership proof.');
      }
      if (space === 'Not yet identified') {
        spacePts = 5;
        if (app.sizeRaw) r.flags.push('Space size given (' + app.sizeRaw + ' sq ft) but no space identified - size ignored');
        r.conditions.push('Find a ground-floor or mall unit of ' + A.idealSpaceSqft[0] + '+ sq ft in pin ' + (app.pin || '?') + ' within 45 days (brand site team shares 3 leads).');
        r.reasons.push({ t: '-', text: 'No shop space yet - adds ~6 weeks for site search.' });
      } else {
        var floorPts = { 'Ground': 25, 'Mall unit': 22, 'Not known': 13, 'Upper': 8 }[floor];
        if (space === 'Rented' && floorPts > 13) floorPts -= 2; // owned = no rent risk
        var sizeMult = 1;
        if (!size) { sizeMult = 0.8; r.conditions.push('Share the size, photos and frontage of the ' + space.toLowerCase() + ' space for a site audit.'); }
        else if (size < A.minSpaceSqft) { sizeMult = 0.45; r.conditions.push('Space of ' + size + ' sq ft is below the ' + A.minSpaceSqft + ' sq ft minimum - find a larger unit.'); }
        else if (size < A.idealSpaceSqft[0]) sizeMult = 0.85;
        else if (size > A.idealSpaceSqft[1]) sizeMult = 0.9;
        spacePts = floorPts * sizeMult;
        if (floor === 'Upper') {
          r.conditions.push('Upper-floor units get roughly half the walk-ins - move to a ground-floor or mall unit (or brand sign-off after site audit).');
          r.reasons.push({ t: '-', text: space + ' space is on an upper floor - weak footfall.' });
        } else if (floor === 'Not known') {
          r.conditions.push('Site visit to confirm floor and frontage.');
          r.reasons.push({ t: '~', text: space + ' space, floor not known yet.' });
        } else {
          r.reasons.push({ t: '+', text: space + ' ' + floor.toLowerCase() + (floor === 'Mall unit' ? '' : '-floor') + ' space' + (size ? ' of ' + size + ' sq ft' : '') + ' - ready for fit-out.' });
        }
        if (size && size > A.idealSpaceSqft[1]) r.reasons.push({ t: '~', text: size + ' sq ft is larger than needed - higher rent/fit-out cost.' });
      }
      r.breakdown.push({ k: 'Space readiness', pts: round(spacePts), max: 25, note: space + (space !== 'Not yet identified' ? ', ' + floor + (size ? ', ' + size + ' sq ft' : '') : '') });

      // -- timeline (10)
      var needWeeks = estimateWeeks(app, tier);
      var needMonths = Math.ceil(needWeeks / 4.33);
      var target = app.launchMonths;
      var tlPts;
      if (target === null || target === undefined) { tlPts = 6; r.flags.push('Target launch blank - assumed flexible'); }
      else if (target >= needMonths && target <= 12) tlPts = 10;
      else if (target > 12) { tlPts = 5; r.reasons.push({ t: '~', text: 'Wants to open in ' + target + ' months - would block a slot for over a year.' }); }
      else if (target >= needMonths - 1) { tlPts = 7; r.reasons.push({ t: '~', text: 'Target of ' + target + ' month(s) is tight; realistic is ~' + needMonths + '.' }); }
      else { tlPts = 3; r.reasons.push({ t: '-', text: 'Target of ' + target + ' month(s) is not realistic; earliest is ~' + needMonths + ' months.' }); }
      r.breakdown.push({ k: 'Timeline realism', pts: tlPts, max: 10, note: (target === null || target === undefined ? '?' : target) + ' mo target vs ~' + needMonths + ' mo needed' });
      r.realisticMonths = needMonths;

      // -- territory (10)
      var terPts = 0;
      if (t) {
        terPts = { High: 10, Medium: 6, Low: 3 }[t.priority];
        r.reasons.push({ t: t.priority === 'Low' ? '~' : '+', text: 'Pin ' + app.pin + ' is in ' + t.id + ' (' + t.priority + ' priority, ' + t.slots + ' open slot' + (t.slots === 1 ? '' : 's') + ').' });
      }
      r.breakdown.push({ k: 'Territory priority', pts: terPts, max: 10, note: t ? t.id + ' - ' + t.priority : 'not in a target territory' });

      // -- location blockers (only once pin and city are trustworthy)
      var pinOk = app.pin && !r.blocking.some(function (b) { return b.code === 'pin_mismatch' || b.code === 'pin_missing' || b.code === 'city'; });
      if (pinOk && storePins[app.pin]) {
        var s = storePins[app.pin];
        var alt = t ? t.pins.filter(function (p) { return !storePins[p]; }) : [];
        r.blocking.push({ code: 'store_pin', text: 'Pin ' + app.pin + ' already has our store ' + s.id + ' (opened ' + s.year + '). We never open two stores in one pin code.',
          action: alt.length ? 'Offer a different pin in ' + t.id + ': ' + alt.slice(0, 4).join(', ') + '.' : 'Offer a location in another target territory in ' + city + '.' });
        r.suggestedPins = alt;
      } else if (pinOk && !t) {
        var cityTer = territories.filter(function (x) { return x.city === city && x.slots > 0; });
        if (cityTer.length) {
          var pins = [];
          cityTer.forEach(function (x) { x.pins.forEach(function (p) { if (!storePins[p]) pins.push(p); }); });
          r.blocking.push({ code: 'no_territory', text: 'Pin ' + app.pin + ' is not inside any territory the brand is growing in, but ' + city + ' has open territories (' + cityTer.map(function (x) { return x.id; }).join(', ') + ').',
            action: 'Ask if the applicant can open in a target pin instead: ' + pins.slice(0, 5).join(', ') + '.' });
          r.suggestedPins = pins;
        } else {
          r.preStatus = r.preStatus === 'REJECTED' ? 'REJECTED' : 'WAITLIST';
          r.headline = r.headline || 'The brand is not opening stores in ' + city + (app.pin ? ' (pin ' + app.pin + ')' : '') + ' right now - kept on file.';
          r.reasons.push({ t: '-', text: 'No target territory with open slots covers ' + city + ' / ' + app.pin + '.' });
          r.actions.push('Keep on file; re-contact when ' + city + ' opens for expansion.');
        }
      }
      if (pinOk) {
        stores.forEach(function (s) {
          if (s.pin !== app.pin && s.pin.substr(0, 3) === app.pin.substr(0, 3) && Math.abs(+s.pin - +app.pin) <= A.catchmentPinDistance) {
            r.cannibalisation = s.id;
          }
        });
        if (r.cannibalisation) {
          var cs = byId(stores, r.cannibalisation, 'id');
          r.reasons.push({ t: '-', text: 'Neighbouring pin to our store ' + cs.id + ' (' + cs.pin + ') - some catchment overlap / cannibalisation risk.' });
        }
      }

      // -- signals from notes
      var adj = 0;
      r.signals.forEach(function (s) {
        if (s.penalty) adj -= s.penalty;
        if (s.bonus) adj += s.bonus;
        if (s.key === 'loan' && !r.conditions.some(function (c) { return /funding gap/.test(c); })) r.conditions.push('Share the loan sanction letter (notes say funding depends on a loan).');
        if (s.key === 'conflict') r.conditions.push('Declare and exit any competing-brand business before signing.');
        if (s.key === 'uncertain') r.conditions.push('Commitment call with the expansion manager and a refundable token deposit.');
        if (s.key !== 'withdraw' && s.key !== 'nospace_note') r.reasons.push({ t: s.penalty ? '-' : s.bonus ? '+' : '~', text: s.text + '.' });
      });
      if (r.cannibalisation) adj -= A.cannibalisationPenalty;
      adj -= Math.min(6, r.flags.length * 2);
      // Rescale each factor from its natural scale to the team's rubric weights (out of 100)
      var WK = { 'Funds': 'funds', 'Space readiness': 'space', 'Retail experience': 'experience', 'Business background': 'business', 'Timeline realism': 'timeline', 'Territory priority': 'territory' };
      var wsum = 0; Object.keys(A.weights).forEach(function (k) { wsum += Math.max(0, +A.weights[k] || 0); });
      r.breakdown.forEach(function (b) {
        var key = WK[b.k];
        if (!key || !b.max) return;
        var w = wsum ? Math.max(0, +A.weights[key] || 0) * 100 / wsum : 0;
        b.pts = round(b.pts / b.max * w);
        b.max = round(w);
      });
      if (adj) r.breakdown.push({ k: 'Adjustments', pts: adj, max: 0, note: [r.cannibalisation ? 'catchment overlap' : '', r.flags.length ? r.flags.length + ' data issue(s)' : '', r.signals.filter(function (s) { return s.penalty || s.bonus; }).map(function (s) { return s.key; }).join(', ')].filter(Boolean).join('; ') });

      var total = 0; r.breakdown.forEach(function (b) { total += b.pts; });
      r.score = Math.max(0, Math.min(100, Math.round(total)));

      if (r.preStatus === 'ELIGIBLE' && r.score < A.minScoreToProceed && !r.blocking.length) {
        r.preStatus = 'REJECTED';
        var gaps = r.breakdown.filter(function (b) { return b.max; }).sort(function (a, b) { return a.pts / a.max - b.pts / b.max; }).slice(0, 3).map(function (b) { return b.k.toLowerCase(); });
        r.headline = 'Overall fit ' + r.score + '/100 is below the ' + A.minScoreToProceed + ' bar - weakest on ' + gaps.join(', ') + '.';
        r.reasons.push({ t: '-', text: 'Overall fit score ' + r.score + '/100 is below the ' + A.minScoreToProceed + ' bar.' });
        r.actions.push('Decline politely with the top two gaps; invite to re-apply once space and funds are in place.');
      }
      if (r.preStatus === 'REJECTED' && !r.headline) r.headline = r.reasons.filter(function (x) { return x.t === '-'; }).map(function (x) { return x.text; })[0] || 'Below minimum bar.';
      return r;
    }
  }

  function readiness(r) { // tie-breaker: who can open sooner
    return (r.app.space !== 'Not yet identified' ? 2 : 0) + (r.app.floor === 'Ground' ? 1 : 0) - r.conditions.length * 0.1;
  }
  function byId(list, id, key) {
    key = key || null;
    for (var i = 0; i < list.length; i++) { var x = list[i]; if ((key ? x[key] : x.app.id) === id) return x; }
    return null;
  }

  function estimateWeeks(app, tier) {
    var W = ASSUMPTIONS.weeks;
    var w = W.agreement + W.siteApproval + (W.fitOut[tier || 2]) + W.preLaunch;
    if (app.space === 'Not yet identified' || app.floor === 'Upper') w += W.siteHunt;
    return w;
  }

  // ---------------------------------------------------------------------------
  // Onboarding plan
  // ---------------------------------------------------------------------------
  function buildPlan(r, stores, today) {
    var app = r.app, info = CITIES[app.city], tier = info.tier, W = ASSUMPTIONS.weeks;
    var novice = (app.experience || 0) < 2;
    var lang = app.language || 'English';
    var needSite = app.space === 'Not yet identified' || app.floor === 'Upper';
    var steps = [];
    var wk = 0;
    function step(name, weeks, owner, detail, parallel) {
      var s = { name: name, start: wk, end: wk + weeks, owner: owner, detail: detail };
      steps.push(s);
      if (!parallel) wk += weeks;
      return s;
    }
    if (r.conditions.length && !needSite) step('Clear conditions', 2, 'Partner + Expansion manager', r.conditions.join(' '), true);
    if (needSite) step('Site search & lock-in', W.siteHunt, 'Partner + Brand site team', 'Brand shares 3 pre-vetted ground-floor leads in pin ' + app.pin + '; partner signs LOI.');
    step('Agreement, KYC & franchise fee', W.agreement, 'Partner + Legal', 'Sign franchise agreement' + (lang !== 'English' ? ' (with ' + lang + ' summary)' : '') + ', submit KYC/GST, pay franchise fee.');
    step('Site audit & layout approval', W.siteApproval, 'Brand projects team', 'Measure site, approve layout and signage, raise fit-out PO.');
    var fit = step('Fit-out & branding', W.fitOut[tier], 'Brand-empanelled contractor', 'Interiors, signage, fixtures, POS hardware, IT/network.');
    var staff = Math.max(2, Math.min(5, Math.round((app.size || 450) / 175)));
    steps.push({ name: 'Hire ' + staff + ' store staff', start: fit.start + 1, end: fit.start + 4, owner: 'Partner + Brand HR', detail: 'Brand shares JD and shortlists; ' + (novice ? 'must include a store manager with 2+ yrs retail experience.' : 'partner can act as store manager.') });
    var trainWeeks = novice ? 3 : 1;
    var shadow = shadowStore(app, stores);
    steps.push({ name: 'Partner & staff training (' + lang + ')', start: fit.end - trainWeeks, end: fit.end, owner: 'Brand training team',
      detail: trainWeeks + '-week ' + (novice ? 'full-track' : 'fast-track') + ' programme in ' + lang + (shadow ? '; in-store shadowing at ' + shadow.id + ' (' + shadow.city + ', ' + shadow.pin + ')' : '') + '.' });
    step('Inventory, POS go-live & soft launch', W.preLaunch, 'Partner + Ops', 'Receive opening stock, test billing, soft launch to friends & local residents.');
    var launch = addWeeks(today, wk);
    steps.push({ name: 'Grand opening + 30/60/90-day reviews', start: wk, end: wk + 13, owner: 'Area manager', detail: 'Weekly sales call for 4 weeks, then reviews at day 30/60/90 against target.' });
    steps.forEach(function (s) {
      s.startISO = addWeeks(today, s.start).toISOString(); s.endISO = addWeeks(today, s.end).toISOString();
      s.startDate = fmtDate(addWeeks(today, s.start)); s.endDate = fmtDate(addWeeks(today, s.end));
    });

    var modules = [
      { name: 'Brand, products & customer promise', days: 2 },
      { name: 'POS billing, inventory & re-ordering app', days: 2 },
      { name: 'Selling & customer service on the floor', days: novice ? 3 : 1 },
      { name: 'Visual merchandising & store standards', days: 1 },
      { name: 'Local marketing & opening-week plan', days: 1 }
    ];
    if (novice) {
      modules.push({ name: 'Retail basics: P&L, cash handling, shrinkage', days: 2 });
      modules.push({ name: 'Hiring and managing a store team', days: 1 });
      modules.push({ name: 'Shadow shifts in a live store', days: 5 });
    } else modules.push({ name: 'Shadow shift in a live store', days: 2 });

    var festival = festivalCheck(r, launch, today);
    var targetMonths = app.launchMonths;
    var launchMonths = round(wk / 4.33, 1);
    var gap = targetMonths !== null && targetMonths !== undefined ? round(launchMonths - targetMonths, 1) : null;

    // Payback estimate
    var A = ASSUMPTIONS;
    var footfall = A.floorFootfall[app.floor] || 0.8;
    if (needSite) footfall = 1; // assumes a ground-floor site gets found
    var sizeF = app.size ? Math.min(1.2, Math.max(0.7, app.size / 600)) : 1;
    var sales = A.monthlySales[tier] * footfall * sizeF;
    var profit = sales * A.partnerNetMargin;
    var cost = A.setupCost[tier];
    var payback = Math.round(cost / profit);

    return {
      steps: steps, weeks: wk, launchDate: fmtDate(launch), launchISO: launch.toISOString(), festival: festival, launchMonths: launchMonths, targetMonths: targetMonths, gapMonths: gap,
      training: { language: lang, track: novice ? 'Full track (new to retail)' : 'Fast track (experienced)', weeks: trainWeeks, modules: modules, shadowStore: shadow ? shadow.id + ' - ' + shadow.city + ' (' + shadow.pin + ')' : 'Virtual sessions + Bengaluru flagship' },
      staff: staff,
      economics: { setupCost: cost, monthlySales: round(sales, 1), monthlyProfit: round(profit, 2), paybackMonths: payback },
      nextSteps: nextSteps(r, needSite, lang)
    };
  }

  // Festival dates the applicant may be aiming for (Karnataka retail peaks)
  var FESTIVALS = { diwali: ['2026-11-08', '2027-10-29', '2028-10-17'], deepavali: ['2026-11-08', '2027-10-29', '2028-10-17'],
    dasara: ['2026-10-20', '2027-10-09', '2028-09-27'], dussehra: ['2026-10-20', '2027-10-09', '2028-09-27'],
    ugadi: ['2027-04-07', '2028-03-27'], sankranti: ['2027-01-14', '2028-01-15'], christmas: ['2026-12-25', '2027-12-25'], 'new year': ['2027-01-01', '2028-01-01'] };
  function festivalCheck(r, launch, today) {
    var sig = r.signals.filter(function (s) { return s.key === 'deadline'; })[0];
    if (!sig) return null;
    var name = (sig.text.match(/around (.+?) -/) || [])[1];
    var dates = FESTIVALS[name];
    if (!dates) return { text: 'Applicant mentioned ' + name + ' - confirm the date they need on the welcome call.' };
    var next = dates.map(function (d) { return new Date(d + 'T00:00:00+05:30'); }).filter(function (d) { return d > today; });
    if (!next.length) return null;
    var label = name.charAt(0).toUpperCase() + name.slice(1);
    if (launch <= next[0]) return { ok: true, text: 'On track to open before ' + label + ' (' + fmtDate(next[0]) + ').' };
    return { ok: false, text: label + ' ' + fmtDate(next[0]) + ' is not achievable (earliest opening ' + fmtDate(launch) + '). ' + (next[1] ? 'Plan a festive launch campaign for ' + label + ' ' + next[1].getFullYear() + ' instead, or a pre-launch pop-up.' : '') };
  }

  function shadowStore(app, stores) {
    var same = stores.filter(function (s) { return s.city === app.city; });
    if (!same.length) {
      var near = NEAREST_CITY[app.city] || [];
      for (var i = 0; i < near.length && !same.length; i++) same = stores.filter(function (s) { return s.city === near[i]; });
    }
    if (!same.length) return null;
    same.sort(function (a, b) { return Math.abs(+a.pin - +app.pin) - Math.abs(+b.pin - +app.pin); });
    return same[0];
  }

  function nextSteps(r, needSite, lang) {
    var out = [];
    var d = 0;
    r.conditions.forEach(function (c) { out.push({ by: r.status === 'CONDITIONAL' ? 'Condition' : 'Also do', text: c }); });
    out.push({ by: 'Within 3 days', text: 'Welcome call with the assigned expansion manager (' + lang + '-speaking) and onboarding portal invite.' });
    out.push({ by: 'Within 7 days', text: 'Upload KYC, PAN, GST, bank statement (proof of funds) and ' + (needSite ? 'shortlisted site options.' : 'property papers / rent agreement for the site.') });
    out.push({ by: 'Within 14 days', text: 'Review and sign the franchise agreement; pay the franchise fee to lock the slot.' });
    out.push({ by: 'Before fit-out ends', text: 'Hire store staff and complete training in ' + lang + '.' });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Portfolio-level insights for the expansion team
  // ---------------------------------------------------------------------------
  function buildInsights(results, territories) {
    var out = [];
    territories.forEach(function (t) {
      var apps = results.filter(function (r) { return r.territoryId === t.id; });
      if (t.slots > 0 && !apps.length) out.push({ level: t.priority === 'High' ? 'high' : 'med', text: t.id + ' (' + t.city + ', ' + t.priority + ' priority) has ' + t.slots + ' open slot(s) and no applicants - run a local partner-acquisition campaign.' });
      else if (t.remaining > 0 && t.priority === 'High') out.push({ level: 'med', text: t.id + ' (' + t.city + ') still has ' + t.remaining + ' unfilled slot(s) at High priority - follow up with on-hold applicants first.' });
      var contested = {};
      apps.forEach(function (r) { contested[r.app.pin] = (contested[r.app.pin] || 0) + 1; });
      for (var p in contested) if (contested[p] > 1) out.push({ level: 'low', text: contested[p] + ' applicants want pin ' + p + ' in ' + t.id + ' - only one can have it.' });
    });
    var holds = results.filter(function (r) { return r.status === 'HOLD'; });
    if (holds.length) out.push({ level: 'low', text: holds.length + ' application(s) on hold - most need one missing fact or a new pin; see the action column.' });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Normalisation of raw rows (from Excel) into engine objects
  // ---------------------------------------------------------------------------
  function normaliseApplication(row) {
    var cityRaw = clean(row.city), pinRaw = clean(row.pin);
    // combined "City · State · Pin" column
    if (row.combined) {
      var parts = clean(row.combined).split(/[·•|,;\/]|\s-\s/).map(clean).filter(Boolean);
      parts.forEach(function (p) {
        if (/\d{6}/.test(p) && !pinRaw) pinRaw = p;
        else if (!cityRaw && normCity(p) in CITIES) cityRaw = p;
      });
      if (!pinRaw) { var m = clean(row.combined).match(/\d{6}/); if (m) pinRaw = m[0]; }
      if (!cityRaw) cityRaw = parts[0] || '';
    }
    var pin = normPin(pinRaw);
    var city = normCity(cityRaw);
    if (!city && pin) city = cityFromPin(pin);
    var space = normSpace(row.space);
    var size = toNumber(row.size);
    if (size !== null && size <= 0) size = null;
    var exp = toNumber(row.experience);
    if (exp !== null && exp < 0) exp = null;
    return {
      id: clean(row.id) || '',
      name: clean(row.name),
      city: city, cityRaw: cityRaw, state: clean(row.state) || (CITIES[city] ? CITIES[city].state : ''),
      pin: pin, pinRaw: pinRaw,
      investment: toLakh(row.investment),
      investmentRaw: clean(row.investment),
      experience: exp,
      business: clean(row.business),
      space: space,
      spaceRaw: clean(row.space),
      size: space === 'Not yet identified' ? null : size,
      sizeRaw: size,
      floor: normFloor(row.floor),
      launchMonths: toNumber(row.launch),
      language: normLanguage(row.language) || 'English',
      notes: clean(row.notes),
      withdrawn: row.withdrawn ? true : undefined
    };
  }

  function normaliseTerritory(row) {
    var cityRaw = clean(row.city) || clean(row.combined);
    var city = normCity(cityRaw.split(/[·•|,]/)[0]);
    var pinsText = typeof row.pins === 'number' ? String(row.pins) : clean(row.pins);
    var pins = (pinsText.match(/\d{6}/g) || []).filter(function (p, i, a) { return a.indexOf(p) === i; });
    if (!city && pins.length) city = cityFromPin(pins[0]);
    var slots = toNumber(row.slots);
    return {
      id: clean(row.id),
      city: city,
      tier: normTier(row.tier) || (CITIES[city] ? CITIES[city].tier : null),
      pins: pins,
      slots: slots === null ? 1 : Math.max(0, Math.round(slots)),
      priority: normPriority(row.priority)
    };
  }

  function normaliseStore(row) {
    return { id: clean(row.id), city: normCity(row.city) || cityFromPin(normPin(row.pin)), pin: normPin(row.pin), year: toNumber(row.year) };
  }

  var DEFAULT_STORES = [
    ['ST-01', 'Bengaluru', '560001', 2019], ['ST-02', 'Bengaluru', '560034', 2020], ['ST-03', 'Bengaluru', '560038', 2021],
    ['ST-04', 'Bengaluru', '560066', 2022], ['ST-05', 'Bengaluru', '560076', 2023], ['ST-06', 'Mysuru', '570009', 2021],
    ['ST-07', 'Mysuru', '570017', 2024], ['ST-08', 'Mangaluru', '575001', 2022], ['ST-09', 'Hubballi-Dharwad', '580020', 2023],
    ['ST-10', 'Belagavi', '590001', 2024]
  ].map(function (s) { return { id: s[0], city: s[1], pin: s[2], year: s[3] }; });

  // ---------------------------------------------------------------------------
  // Path to yes: the smallest realistic changes that would move an applicant forward.
  // Tries each lever on its own, then all applicant-side levers together, re-running the
  // whole allocation each time (so slot competition is respected).
  // ---------------------------------------------------------------------------
  function pathToYes(data, id, opts) {
    var base = evaluate(data, opts);
    var r = byId(base.results, id);
    if (!r || r.status === 'APPROVED' || r.status === 'WITHDRAWN') return { current: r, options: [] };
    var a = r.app, info = CITIES[a.city], tier = info ? info.tier : 2, cost = ASSUMPTIONS.setupCost[tier];
    var levers = [];
    function lever(label, patch, side) { levers.push({ label: label, patch: patch || {}, side: side || 'applicant' }); }
    var codes = r.blocking.map(function (b) { return b.code; });
    if (codes.indexOf('pin_mismatch') >= 0 && cityFromPin(a.pin)) lever('Confirm the store is in ' + cityFromPin(a.pin) + ' (matches pin ' + a.pin + ')', { city: cityFromPin(a.pin) });
    if ((codes.indexOf('store_pin') >= 0 || codes.indexOf('no_territory') >= 0) && r.suggestedPins && r.suggestedPins.length) lever('Move the store to free pin ' + r.suggestedPins[0], { pin: r.suggestedPins[0] });
    if (a.investment === null || a.investment === undefined) lever('Declare an investment of ' + fmtL(cost), { investment: cost });
    else if (a.investment < cost) lever('Raise funds to ' + fmtL(cost) + ' (+' + fmtL(cost - a.investment) + ')', { investment: cost });
    if (a.space === 'Not yet identified' || a.floor === 'Upper' || a.floor === 'Not known') lever('Secure a ground-floor shop of ~450 sq ft', { space: a.space === 'Not yet identified' ? 'Rented' : a.space, floor: 'Ground', size: a.size && a.size >= 300 ? a.size : 450, spaceUpdated: true });
    else if (!a.size || a.size < ASSUMPTIONS.minSpaceSqft) lever('Confirm a shop of at least 400 sq ft', { size: 450 });
    var sigs = { loan: 'Get the bank loan sanctioned', uncertain: 'Confirm commitment with a token deposit', conflict: 'Exit the competing brand', absentee: 'Commit to running the store full-time' };
    r.signals.forEach(function (s) { if (sigs[s.key]) lever(sigs[s.key], { clearedSignals: (a.clearedSignals || []).concat([s.key]) }); });
    if (a.launchMonths !== null && a.launchMonths !== undefined && r.realisticMonths && a.launchMonths < r.realisticMonths) lever('Accept a realistic launch of ' + r.realisticMonths + ' months', { launchMonths: r.realisticMonths });
    if ((r.status === 'WAITLIST' || r.status === 'HOLD') && r.territoryId) {
      var t = base.territories.filter(function (x) { return x.id === r.territoryId; })[0];
      if (t && t.remaining === 0) levers.push({ label: 'Brand adds one more slot in ' + t.id, patch: {}, ter: { id: t.id, slots: t.slots + 1 }, side: 'brand' });
    }

    function run(patches, ter) {
      var d = clone(data);
      var app = d.applications.filter(function (x) { return x.id === id; })[0];
      patches.forEach(function (p) {
        Object.keys(p).forEach(function (k) {
          if (k === 'clearedSignals') app.clearedSignals = (app.clearedSignals || []).concat(p[k]).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
          else app[k] = p[k];
        });
      });
      if (ter) d.territories.forEach(function (x) { if (x.id === ter.id) x.slots = ter.slots; });
      var res = byId(evaluate(d, opts).results, id);
      return { status: res.status, score: res.score };
    }
    var order = { APPROVED: 1, CONDITIONAL: 2, WAITLIST: 3, HOLD: 4, REJECTED: 5, WITHDRAWN: 6 };
    var options = levers.map(function (l) {
      var o = run([l.patch], l.ter);
      return { label: l.label, side: l.side, status: o.status, score: o.score, better: order[o.status] < order[r.status] || o.score > r.score, patch: l.patch, ter: l.ter };
    });
    var mine = levers.filter(function (l) { return l.side === 'applicant'; });
    if (mine.length > 1) {
      var all = run(mine.map(function (l) { return l.patch; }));
      var merged = {};
      mine.forEach(function (l) { Object.keys(l.patch).forEach(function (k) { merged[k] = k === 'clearedSignals' ? (merged[k] || []).concat(l.patch[k]) : l.patch[k]; }); });
      options.push({ label: 'All of the applicant-side steps together', side: 'combined', status: all.status, score: all.score, better: order[all.status] < order[r.status] || all.score > r.score, patch: merged });
    }
    options.sort(function (x, y) { return order[x.status] - order[y.status] || y.score - x.score; });
    return { current: { status: r.status, score: r.score }, options: options };
  }

  // ---------------------------------------------------------------------------
  // Portfolio view for the expansion team: opening calendar, training cohorts, this week's actions
  // ---------------------------------------------------------------------------
  function portfolio(result) {
    var moving = result.results.filter(function (r) { return r.plan; });
    var openings = moving.map(function (r) {
      return { id: r.app.id, name: r.app.name, city: r.app.city, status: r.status, launchISO: r.plan.launchISO, launchDate: r.plan.launchDate, steps: r.plan.steps, language: r.plan.training.language };
    }).sort(function (a, b) { return a.launchISO < b.launchISO ? -1 : 1; });
    var cohorts = {};
    moving.forEach(function (r) {
      var tr = r.plan.steps.filter(function (s) { return /training/i.test(s.name); })[0];
      if (!tr) return;
      var d = new Date(tr.startISO);
      var monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var key = r.plan.training.language + '|' + monthKey;
      if (!cohorts[key]) cohorts[key] = { language: r.plan.training.language, monthKey: monthKey, month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear(), members: [], firstStart: tr.startISO };
      cohorts[key].members.push({ id: r.app.id, name: r.app.name, city: r.app.city, track: r.plan.training.track });
      if (tr.startISO < cohorts[key].firstStart) cohorts[key].firstStart = tr.startISO;
    });
    var actions = [];
    result.results.forEach(function (r) {
      if (r.plan) r.plan.nextSteps.forEach(function (s) { if (/3 days|7 days|Condition/.test(s.by)) actions.push({ id: r.app.id, name: r.app.name, by: s.by, text: s.text, kind: s.by === 'Condition' ? 'condition' : 'partner' }); });
      else if (r.status === 'HOLD' && r.actions[0]) actions.push({ id: r.app.id, name: r.app.name, by: 'Ask now', text: r.actions[0], kind: 'question' });
    });
    return { openings: openings, cohorts: Object.keys(cohorts).sort().map(function (k) { return cohorts[k]; }).sort(function (a, b) { return a.monthKey < b.monthKey ? -1 : a.monthKey > b.monthKey ? 1 : a.language < b.language ? -1 : 1; }), actions: actions };
  }

  // ---------------------------------------------------------------------------
  // Rubric: the team edits these from the dashboard; the portal uses the same values
  // ---------------------------------------------------------------------------
  var DEFAULT_RUBRIC = JSON.parse(JSON.stringify({
    weights: ASSUMPTIONS.weights, setupCost: ASSUMPTIONS.setupCost, rejectBelowRatio: ASSUMPTIONS.rejectBelowRatio,
    minScoreToProceed: ASSUMPTIONS.minScoreToProceed, minSpaceSqft: ASSUMPTIONS.minSpaceSqft, idealSpaceSqft: ASSUMPTIONS.idealSpaceSqft,
    catchmentPinDistance: ASSUMPTIONS.catchmentPinDistance, cannibalisationPenalty: ASSUMPTIONS.cannibalisationPenalty
  }));
  function getRubric() {
    var r = {};
    Object.keys(DEFAULT_RUBRIC).forEach(function (k) { r[k] = JSON.parse(JSON.stringify(ASSUMPTIONS[k])); });
    return r;
  }
  function setRubric(rb) {
    rb = rb || DEFAULT_RUBRIC;
    Object.keys(DEFAULT_RUBRIC).forEach(function (k) {
      if (rb[k] === undefined || rb[k] === null) return;
      ASSUMPTIONS[k] = JSON.parse(JSON.stringify(rb[k]));
    });
  }

  var api = {
    getRubric: getRubric, setRubric: setRubric, DEFAULT_RUBRIC: DEFAULT_RUBRIC,
    CITIES: CITIES, ASSUMPTIONS: ASSUMPTIONS, STATUS: STATUS, DEFAULT_STORES: DEFAULT_STORES,
    evaluate: evaluate, pathToYes: pathToYes, portfolio: portfolio, normaliseApplication: normaliseApplication, normaliseTerritory: normaliseTerritory, normaliseStore: normaliseStore,
    helpers: { clean: clean, toNumber: toNumber, toLakh: toLakh, normCity: normCity, normPin: normPin, normFloor: normFloor, normSpace: normSpace, normLanguage: normLanguage, normPriority: normPriority, canonicalAppId: canonicalAppId, fmtL: fmtL, clone: clone, cityFromPin: cityFromPin }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FranchiseEngine = api;
})(this);
