# FranchiseFlow

**Case 1 – Franchise Partner Acquisition, Geo-Selection & Onboarding Engine** (AI x Ops Hackathon)

Upload the Applications + Territories Excel. For every applicant FranchiseFlow decides what should happen and why, allocates territory slots (never two stores in one pin code), and builds an onboarding plan, training plan and a message in the partner's language for everyone moving forward. Then talk to it: ask why, or give it new information, and it re-runs every decision and shows what changed.

No login, no API keys, no rate limits. It runs entirely in the browser and is deterministic: the same file always gives the same answer.

## What's inside
| View | What it shows |
|---|---|
| **Overview** | Funnel by outcome, slots filled, first openings, and *Needs your attention* (close calls, contradictory forms, questions to ask) |
| **Decisions** | Board by outcome (Approved · Conditional · Waitlisted · On hold · Not proceeding) or table; search and city filter |
| **Map** | Karnataka with each target city; click a city to see every pin as a tile: our store, approved, wanted, free |
| **Onboarding** | Opening calendar (phase Gantt), training cohorts by language and month, actions due this week |
| **Partner passport** | Decision and reasons, score breakdown, **Path to yes**, live what-if, onboarding journey, training plan, payback, **message in Kannada/Hindi/English**, manager override |
| **Assistant** | Why · next steps · compare · path to yes · draft message · cohorts · new facts · new applicants · overrides · what-if · undo |

## Decision logic
| Step | What happens |
|---|---|
| Data checks | City vs pin prefix, missing pin/investment, space vs size/notes contradictions, duplicates, text in number columns |
| Hard rules | One store per pin (existing stores and applicants). Investment < 70% of setup cost → reject. Fit < 40 → reject |
| Fit score /100 | Funds 25 · Space 25 · Experience 20 · Business 10 · Timeline 10 · Territory priority 10 · ± adjustments (cannibalisation, contradictions, signals in notes) |
| Allocation | Per territory, best score first, one pin each. Applicants whose pin is unusable compete at a *relocation score* and get a free pin nobody else asked for |
| Confidence | Close calls, contradictory forms and borderline rejects → *Review*; overrides → *Manual* |
| Onboarding | Agreement/KYC → site audit → fit-out (by tier) + hiring → training in the partner's language (fast/full track, shadowing at the nearest store) → soft launch → 30/60/90-day reviews |

All assumptions live in `ASSUMPTIONS` at the top of `engine.js`.

## Files
`index.html` · `styles.css` · `app.js` (UI) · `engine.js` (decisions, path to yes, portfolio) · `loader.js` (Excel reader) · `chat.js` (assistant) · `messages.js` (partner messages) · `sample/` (test file + blank template) · `tools/` (`make_sample.py`, `test.js`)

## Run locally
```bash
python -m http.server 8765
```
Then open http://localhost:8765. Any static host works (GitHub Pages, Netlify, Vercel). Smoke test: `node tools/test.js`.
