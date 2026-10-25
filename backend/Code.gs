/**
 * Veloce / FranchiseFlow backend: a Google Sheet used as an append-only event store.
 * One tab per workspace ("ws_<code>"), one row per event: uid | ts | type | appId | payload(JSON).
 * GET  ?ws=CODE&after=N   -> events in rows after N
 * POST {ws, events:[...]} -> appends events (deduplicated by uid)
 * Deploy: Extensions > Apps Script > paste > Deploy > New deployment > Web app,
 *         Execute as: Me, Who has access: Anyone. Copy the /exec URL into config.js.
 */
var HEADER = ['uid', 'ts', 'type', 'appId', 'payload'];

function wsName_(ws) {
  ws = String(ws || 'public').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24) || 'public';
  return 'ws_' + ws;
}

function sheet_(ws, create) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = wsName_(ws);
  var sh = ss.getSheetByName(name);
  if (!sh && create) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.ping) return json_({ ok: true, pong: true });
    var sh = sheet_(p.ws, false);
    if (!sh) return json_({ ok: true, events: [], last: 1 });
    var last = sh.getLastRow();
    var after = Math.max(1, Number(p.after || 1));
    var events = [];
    if (last > after) {
      var rows = sh.getRange(after + 1, 1, last - after, HEADER.length).getValues();
      rows.forEach(function (r) {
        var payload = {};
        try { payload = JSON.parse(r[4] || '{}'); } catch (err) { payload = {}; }
        events.push({ uid: String(r[0]), ts: String(r[1]), type: String(r[2]), appId: String(r[3]), payload: payload });
      });
    }
    return json_({ ok: true, events: events, last: last });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = JSON.parse(e.postData.contents);
    var sh = sheet_(body.ws, true);
    var incoming = (body.events || []).slice(0, 50);
    // skip events already stored (a client may resend after a timeout)
    var last = sh.getLastRow();
    var known = {};
    if (last > 1) {
      var from = Math.max(2, last - 300);
      sh.getRange(from, 1, last - from + 1, 1).getValues().forEach(function (r) { known[r[0]] = true; });
    }
    var rows = [];
    incoming.forEach(function (ev) {
      if (!ev || !ev.uid || known[ev.uid]) return;
      var payload = JSON.stringify(ev.payload || {});
      if (payload.length > 45000) payload = payload.slice(0, 45000); // a cell holds 50k characters
      rows.push([String(ev.uid), String(ev.ts), String(ev.type).slice(0, 20), String(ev.appId || '').slice(0, 20), payload]);
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);
    return json_({ ok: true, added: rows.length, last: sh.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) { /* not held */ }
  }
}
