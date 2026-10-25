/* FranchiseFlow loader: turns an uploaded workbook into engine input.
 * Finds sheets and header rows by content, not exact names, so small template
 * differences (renamed sheets, merged "City · State · Pin" column, extra title rows) still load.
 */
(function (root) {
  'use strict';
  var E = root.FranchiseEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);

  function key(s) { return String(s === undefined || s === null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // field -> test on normalised header text. Order matters: first match wins per header.
  var APP_FIELDS = [
    ['combined', function (h) { return /city/.test(h) && /pin/.test(h); }],
    ['id', function (h) { return /(application|app)(id|no|number|ref)/.test(h) || h === 'id'; }],
    ['name', function (h) { return /name/.test(h); }],
    ['city', function (h) { return /city|town|location/.test(h) && !/tier|capacity/.test(h); }],
    ['state', function (h) { return /state/.test(h); }],
    ['pin', function (h) { return /pin|postal|zip/.test(h); }],
    ['investment', function (h) { return /invest|capital|budget|lakh/.test(h); }],
    ['experience', function (h) { return /experience|years/.test(h); }],
    ['business', function (h) { return /business|occupation|profession|background/.test(h); }],
    ['size', function (h) { return /size|sqft|area/.test(h); }],
    ['space', function (h) { return /space|premises|shop/.test(h); }],
    ['floor', function (h) { return /floor/.test(h); }],
    ['launch', function (h) { return /launch|month|timeline/.test(h); }],
    ['language', function (h) { return /language/.test(h); }],
    ['notes', function (h) { return /note|comment|remark|other/.test(h); }]
  ];
  var TER_FIELDS = [
    ['id', function (h) { return /territory(id)?$|^territoryid|^id$/.test(h); }],
    ['pins', function (h) { return /pin/.test(h); }],
    ['combined', function (h) { return /city/.test(h) && /state/.test(h); }],
    ['city', function (h) { return /city/.test(h) && !/tier|capacity/.test(h); }],
    ['tier', function (h) { return /tier/.test(h); }],
    ['slots', function (h) { return /slot|stores|open/.test(h); }],
    ['priority', function (h) { return /priority/.test(h); }]
  ];
  var STORE_FIELDS = [
    ['id', function (h) { return /store(id)?$|^storeid|^id$/.test(h); }],
    ['city', function (h) { return /city/.test(h); }],
    ['pin', function (h) { return /pin/.test(h); }],
    ['year', function (h) { return /open|year/.test(h); }]
  ];

  function mapHeaders(headerRow, fields) {
    var map = {}, used = {};
    headerRow.forEach(function (raw, col) {
      var h = key(raw);
      if (!h) return;
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i][0];
        if (used[f]) continue;
        if (fields[i][1](h)) { map[col] = f; used[f] = true; return; }
      }
    });
    return map;
  }

  function findTable(rows, fields, must) {
    var best = null;
    for (var r = 0; r < Math.min(rows.length, 15); r++) {
      var map = mapHeaders(rows[r] || [], fields);
      var got = Object.keys(map).map(function (c) { return map[c]; });
      var ok = must.every(function (m) { return m.split('|').some(function (x) { return got.indexOf(x) >= 0; }); });
      if (ok && (!best || got.length > best.count)) best = { row: r, map: map, count: got.length };
    }
    if (!best) return null;
    var out = [];
    for (var i = best.row + 1; i < rows.length; i++) {
      var row = rows[i] || [];
      if (!row.some(function (v) { return String(v === undefined || v === null ? '' : v).trim() !== ''; })) continue;
      var obj = {};
      for (var c in best.map) obj[best.map[c]] = row[c];
      out.push(obj);
    }
    return out;
  }

  /** sheets: [{ name, rows: array-of-arrays }] */
  function parseSheets(sheets) {
    var report = { warnings: [], sheetsUsed: {} };
    function pick(nameRe, fields, must) {
      var ordered = sheets.slice().sort(function (a, b) { return (nameRe.test(b.name) ? 1 : 0) - (nameRe.test(a.name) ? 1 : 0); });
      for (var i = 0; i < ordered.length; i++) {
        if (/gloss|readme|instruction/i.test(ordered[i].name)) continue;
        var t = findTable(ordered[i].rows, fields, must);
        if (t) return { name: ordered[i].name, rows: t };
      }
      return null;
    }
    var apps = pick(/applic/i, APP_FIELDS, ['id|name', 'investment', 'pin|combined']);
    var ters = pick(/territor/i, TER_FIELDS, ['pins', 'slots|priority']);
    var stores = pick(/exist|store/i, STORE_FIELDS, ['pin', 'id']);
    if (!apps) throw new Error('Could not find the Applications sheet (looked for columns like Application ID, Investment, Pin code).');
    if (!ters) throw new Error('Could not find the Territories sheet (looked for columns like Territory ID, Pin codes covered, Open slots).');

    report.sheetsUsed = { applications: apps.name, territories: ters.name, stores: stores ? stores.name : '(built-in list of 10 stores)' };
    var applications = apps.rows.filter(function (r) { return r.id || r.name; }).map(E.normaliseApplication);
    applications.forEach(function (a, i) { if (!a.id) { a.id = 'APP-' + String(i + 1).padStart(3, '0'); report.warnings.push('Row ' + (i + 1) + ' had no Application ID - labelled ' + a.id + '.'); } });
    var territories = ters.rows.filter(function (r) { return r.id || r.pins; }).map(E.normaliseTerritory);
    territories.forEach(function (t, i) { if (!t.id) t.id = 'TER-' + String(i + 1).padStart(2, '0'); });
    var storeList = stores ? stores.rows.filter(function (r) { return r.pin; }).map(E.normaliseStore) : [];
    if (!storeList.length) storeList = E.DEFAULT_STORES.slice();

    // Overlapping territories: a pin should belong to one territory
    var seen = {};
    territories.forEach(function (t) {
      t.pins.forEach(function (p) {
        if (seen[p]) report.warnings.push('Pin ' + p + ' appears in both ' + seen[p] + ' and ' + t.id + ' - using ' + seen[p] + '.');
        else seen[p] = t.id;
      });
    });
    territories.forEach(function (t) { t.pins = t.pins.filter(function (p) { return seen[p] === t.id; }); });

    return { data: { applications: applications, territories: territories, stores: storeList }, report: report };
  }

  /** Browser: File -> Promise<{data, report}> using SheetJS (global XLSX) */
  function parseFile(file) {
    return file.arrayBuffer().then(function (buf) {
      var wb = root.XLSX.read(buf, { type: 'array' });
      var sheets = wb.SheetNames.map(function (n) {
        return { name: n, rows: root.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) };
      });
      return parseSheets(sheets);
    });
  }

  var api = { parseSheets: parseSheets, parseFile: parseFile, mapHeaders: mapHeaders };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FranchiseLoader = api;
})(this);
