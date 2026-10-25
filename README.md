# FranchiseFlow

**Case 1 – Franchise Partner Acquisition, Geo-Selection & Onboarding Engine** (AI x Ops Hackathon)

Upload the Applications + Territories Excel. For every applicant, FranchiseFlow decides what should happen and why, allocates territory slots (never two stores in one pin code), and builds an onboarding and training plan for everyone moving forward. Then ask follow-ups in plain English or give it new information, and it re-runs every decision and shows what changed.

- No login, no API keys, no rate limits. Everything runs in the browser, and the uploaded file never leaves the judge's machine.
- Deterministic: the same file always gives the same answer, and every decision lists its reasons.

## How judges use it
1. Open the link → **Upload Excel** (or **Try with sample data**).
2. Click any row for the full reasoning, score breakdown, next steps, week-by-week onboarding plan, training plan and payback estimate.
3. Use the chat on the right:
   - Questions: `Why is APP-007 on hold?` · `Next steps for APP-003` · `Compare APP-013 and APP-014` · `Show on hold` · `TER-03` · `How do you score?`
   - New information: `APP-012 has now found a ground-floor space` · `APP-005 can now invest 30 lakh` · `APP-002 has withdrawn` · `TER-02 now has 2 open slots` · `A new store opened in 570008`
   - `What if …` previews without saving; `undo` reverts.
4. **Export decisions (.xlsx)** downloads the decisions, territory allocation and change log.

## Decision logic (summary)
| Step | What happens |
|---|---|
| Data checks | City vs pin prefix, missing pin/investment, space status vs size/notes contradictions, duplicates, text in number columns ("35 lakhs", "seven", "600 sqft") |
| Hard rules | Never two stores per pin (existing stores + applicants). Pin outside target territories → offer free pins. Investment < 70% of setup cost → reject |
| Fit score /100 | Funds 25 · Space readiness 25 · Retail experience 20 · Business background 10 · Timeline realism 10 · Territory priority 10 · ± adjustments (cannibalisation, contradictions, signals in notes) |
| Allocation | Per territory, best score first, one pin each. A pin loser re-enters with a *relocation score* (space points reset, since moving means losing their shop) |
| Outcomes | Approved · Conditional (slot held 30 days) · Waitlisted · On hold · Rejected · Withdrawn |
| Onboarding | Agreement/KYC → site audit → fit-out (by tier) + hiring → training in the partner's language (fast/full track, shadowing at the nearest store) → soft launch → 30/60/90-day reviews; festival deadlines checked |

All assumptions are in `ASSUMPTIONS` at the top of `engine.js` and in the app's **How decisions are made** panel.

## Files
- `index.html`, `styles.css`, `app.js`: UI
- `engine.js`: decision engine (pure functions)
- `loader.js`: Excel reader (matches sheets and columns by content, tolerates template variations)
- `chat.js`: rule-based conversational layer (questions, updates, what-if, undo)
- `sample/`: sample test file in the judges' format and a blank template
- `tools/make_sample.py`: regenerates the sample files · `tools/test.js`: `node tools/test.js` smoke test

## Run locally
```bash
python -m http.server 8765
```
Then open http://localhost:8765. Any static host works (GitHub Pages, Netlify, Vercel).
