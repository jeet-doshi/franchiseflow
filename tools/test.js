// Node smoke test: node tools/test.js  (runs the sample through engine + chat)
global.window = global;
require('../sample-data.js');
const E = require('../engine.js');
const L = require('../loader.js');
const C = require('../chat.js');

const today = '2026-10-26T00:00:00+05:30';
const { data, report } = L.parseSheets(global.SAMPLE_SHEETS);
console.log('sheets', report.sheetsUsed, report.warnings);
let result = E.evaluate(data, { today });
for (const r of result.results) {
  console.log(r.app.id.padEnd(8), r.status.padEnd(12), String(r.score).padStart(3), ' ', r.headline.slice(0, 140));
}
console.log('\nTERRITORIES');
for (const t of result.territories) console.log(t.id, t.city, t.filled + '/' + t.slots, t.allocated.join(','), 'free', t.freePins.join(','));
console.log('\nINSIGHTS'); result.insights.forEach(i => console.log('-', i.text));

const strip = h => h.replace(/<li>/g, '\n  * ').replace(/<\/p>|<br>|<hr>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n').trim();
let state = { data, result, today };
const qs = process.argv.slice(2).length ? process.argv.slice(2) : [
  'Why is APP-007 on hold?',
  'APP-012 has now found a ground-floor space',
  'Next steps for APP-002',
  'what if APP-005 can now invest 30 lakh',
  'Compare APP-013 and APP-014',
  'APP-011 has withdrawn',
  'TER-04 now has 2 open slots',
  'undo',
  'show on hold',
  'Why was Pooja rejected?',
  'APP-004 loan has been approved',
  'APP-010 moved to pin 570010',
];
for (const q of qs) {
  const out = C.respond(q, state);
  console.log('\n>>> ' + q);
  if (out.undo) { console.log('(undo requested)'); continue; }
  console.log(strip(out.html));
  if (out.committed) state = { data: out.data, result: out.result, today };
}
