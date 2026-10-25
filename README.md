# FranchiseFlow · Veloce

**Case 1 – Franchise Partner Acquisition, Geo-Selection & Onboarding Engine** (AI x Ops Hackathon) · Team *Roadies – Hum bhi bana lenge*

Two connected apps for a fictional retail brand, **Veloce**:

| App | Who uses it | Link |
|---|---|---|
| **Expansion dashboard** (`index.html`) | Veloce's expansion team | https://jeet-doshi.github.io/franchiseflow/ |
| **Partner Portal** (`apply.html`) | People who want to open a Veloce store | https://jeet-doshi.github.io/franchiseflow/apply.html |

No login, no API keys. Decisions are rules you can read: the same data always gives the same answer.

## Partner Portal (English · हिन्दी · ಕನ್ನಡ)
1. **Pin code first.** If Veloce already has a store there (or a partner was shortlisted), it says so and offers the nearest open pins instead of a dead end.
2. **3-step application** with a **live shortlist chance** (Strong / Good / Needs work / Unlikely), a score breakdown and "how to improve" tips, each tested by re-running the engine.
3. **Track**: status timeline, the decision message in the applicant's language, and **questions from the team** with structured answers (pin, funds, shop, timeline, loan, commitment). Answers update the application, and the dashboard re-decides.

## Expansion dashboard
- **Upload the Excel** (Applications + Territories; existing stores built in), or load sample data. Portal applications merge in live, tagged *Portal*.
- **Overview** (funnel, attention queue incl. new portal applications and replies) · **Decisions** board · **Map** (every pin code) · **Onboarding** (opening calendar, training cohorts, due this week) · **Rubric** (edit weights and thresholds, preview who moves, apply, undo).
- **Partner passport** for every applicant: decision and reasons, path to yes, what-if, onboarding plan, message in their language, manager override, and **Conversation** for portal applicants.
- **Assistant**: plain-English questions and updates; every change re-runs all decisions and shows the knock-on effects.

## Data
- **Google Sheet as the database** (`backend/Code.gs`, set up per `backend/SETUP.md`, URL in `config.js`). Every action is one appended row, one tab per workspace, so concurrent writes never overwrite each other.
- **Workspaces** keep testers apart: each dashboard gets its own code (shown with a QR in *Partner portal*). The portal opened without a code uses the shared `public` workspace.
- **Fallback**: if the Sheet can't be reached, both apps keep working in the browser and sync later. The Excel path never depends on the Sheet.

## Decision logic
| Step | What happens |
|---|---|
| Hard rules | One store per pin (existing stores and applicants). Investment below the rubric's % of setup cost → reject. Fit below the minimum → reject |
| Fit score /100 | Funds · Shop readiness · Retail experience · Business background · Timeline · Territory priority, weighted by the **Rubric** (default 25/25/20/10/10/10) ± adjustments (cannibalisation, contradictions, signals in notes) |
| Allocation | Per territory, best score first, one pin each. Applicants whose pin is unusable compete at a *relocation score* and get a free pin nobody else asked for |
| Confidence | Close calls, contradictory forms and borderline rejects → *Review*; overrides → *Manual* |
| Onboarding | Agreement/KYC → site audit → fit-out + hiring → training in the partner's language at the nearest store → soft launch → 30/60/90-day reviews |

## Files
`index.html` `app.js` (dashboard) · `apply.html` `portal.js` `portal.css` (portal) · `styles.css` · `engine.js` (decisions, rubric, path to yes) · `loader.js` (Excel) · `chat.js` (assistant) · `messages.js` (partner messages) · `questions.js` (preset questions) · `store.js` (shared data layer) · `config.js` · `backend/` · `sample/` · `tools/`

## Run locally
```bash
python -m http.server 8765
```
Open http://localhost:8765 (dashboard) and http://localhost:8765/apply.html (portal). Smoke test: `node tools/test.js`. Rollback point: tag `v1-submitted`.
