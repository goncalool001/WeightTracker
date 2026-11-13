# Weight Tracker

A weight tracker for the phone and the desktop: log a weigh-in in two taps,
see where you are against your goal, and learn what moves the scale. It is a
web rebuild of the original PyQt6 desktop app, installable as a PWA, in
English and Portuguese, with light and dark themes.

## What it does

**Today**
- A pill at the top says what the screen covers: the goal in force since it
  was set (the default), an earlier goal, or the whole history. A goal that
  changes direction (a cut, then a bulk) starts a new stretch, so the weight
  lost before a bulk never counts against it; goals in a row with the same
  direction are one stretch. With the whole history shown, a loss counts as
  progress.
- Four cards: last weigh-in, total lost or gained since the stretch began,
  week on week and month on month. Weeks and months are calendar periods
  (weeks start on Monday): this period so far against the whole period
  before. A change that runs across two goals is shown without a verdict.
- Way to the goal: a scale from the start weight to the goal, with what is
  left, the expected arrival (a date range, once the goal has two weeks of
  its own weigh-ins) and the weekly pace. With a target pace set, it says
  whether you are on, below or above it. While maintaining, it shows the
  range and how many days the weight has stayed past the goal it passed,
  with an early warning when the 7-day average is drifting towards a limit.
- An earlier goal is shown as it ended: final weigh-in, total, how long it
  ran and its average pace.
- Last 30 days: one cell per day, green when the weigh-in moved towards the
  goal in force that day, red when it moved away, empty when there was no
  weigh-in. Press and slide across it to read each day's weight and change.
- Daily chart of the stretch being shown, with the 7-day average (calendar
  window, at least 2 weigh-ins; gaps are drawn dashed, nothing is
  interpolated) or a trend line, ranges from 7 days to the whole goal or
  custom dates, each goal's line over its own dates, and a comparison with
  the period before.
- Weekly or monthly change as columns, with the target pace as a dashed line.
- Insights in plain sentences: pace, best week, weekday pattern, and the note
  category most linked to your swings once there is enough data.

**Logging**
- A bar fixed to the bottom of the phone (a panel on desktop) with a decimal
  keypad; the button says when it replaces the day's weigh-in, and every
  save, edit and delete can be undone.
- Notes about the day before, as categories (food, hydration, activity,
  sleep and wellbeing, health, context, measurement) plus free text.

**Entries**
- Every weigh-in, editable, beside weekly or monthly averages. Each change is
  judged by the goal in force at the time (a loss is green during a cut, a
  gain during a bulk; with no goal, a loss is).
- "What explains the swings": how far a weigh-in sits from your previous
  7-day average after a day with each category, against days with none, with
  an 80% range and the number of weigh-ins behind it (5–9 is marked
  indicative). These are patterns in your data, not causes.

**Goal**
- Lose weight to a target, gain weight to a target, or maintain a range.
- An optional target pace in kg per week on goals to lose or gain. On pace
  means within a quarter of it (at least 0.1 kg a week either way); slower,
  or the wrong way, is below pace; quicker is above pace, shown as a warning
  rather than a success.
- A history of every goal; any goal's target or range, pace and dates can be
  edited (periods may not overlap) and any goal deleted, both with undo.

**Data**
- Import CSV or Excel (Date and Weight columns, optional Categories and
  Note). Every row is checked before saving: invalid dates, repeated dates,
  dates in the future and weights outside 30–250 kg are left out and listed.
  Choose to add and update, or replace everything.
- Export to `.xlsx` or `.csv` with dates, weights, categories (in the current
  language, separated by `;`) and notes. An export imports back unchanged.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 18, TypeScript, Vite |
| Styling | Tailwind CSS with CSS-variable themes |
| Charts | Apache ECharts (`echarts-for-react`) |
| State | Zustand |
| Local storage | IndexedDB (`idb-keyval`) |
| Cloud sync (optional) | Firebase Auth (Google) + Firestore |
| Files | SheetJS (`xlsx`) |
| Dialogs | Radix UI |
| Toasts | Sonner |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest + Testing Library |

## Structure

```
UI (screens, features, components)  ⇄  Store (Zustand)  ⇄  Domain (pure TS)
                                            ⇅
                       Data (IndexedDB · Firestore sync · CSV/XLSX)
```

- `src/domain` — framework-free, unit-tested logic: calendar averages,
  goals and what Today covers (`scope.ts`), status and projection, insights,
  category effects, import checks.
- `src/data` — file import/export, IndexedDB, Firestore sync, the dev seed.
- `src/store` — the Zustand store and memoised selectors.
- `src/screens` — Today, Entries, Goal and Data.
- `src/features` — the parts of each screen (today, log, entries, notes,
  goal, data, auth).
- `src/components` — shell, charts and shared UI.
- `src/i18n` — every string, in English and Portuguese.

## Getting started

Requires **Node.js 18+**.

```bash
npm install        # install dependencies
npm run dev        # dev server (http://localhost:5173)
npm run test       # unit tests
npm run lint       # ESLint
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
```

### Sample data in development

In the dev server only, `?seed` loads a sample history of 133 weigh-ins
(18 Apr – 25 Oct 2026) without touching your saved data:

- `?seed` — maintaining 76–78 kg since 26 Sep, after a goal to lose
- `?seed=lose` — two goals to lose in a row (one stretch), 75 kg ahead
- `?seed=gain` — a cut that ended on 10 Oct, then a goal to gain to 78 kg
- add `&tags` for illustrative note categories

The seed is not part of the production build.

## Cloud sync (Firebase) — optional

Without Firebase settings the app runs fully on the device and the sign-in
button is hidden. With them, signing in with Google syncs weigh-ins, notes
and goals across devices in real time, including changes made offline.

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method → Google → Enable.**
3. **Firestore Database → Create database** (production mode).
4. **Firestore → Rules**: paste [`firestore.rules`](firestore.rules) and publish.
5. **Project settings → Your apps → Web app**: register a web app and copy
   its config.
6. Put the values in `.env.local` (see [`.env.example`](.env.example)) and in
   your host's environment variables.
7. Add your domains under **Authentication → Settings → Authorized domains**.

The `VITE_FIREBASE_*` values are not secrets; they ship in the bundle. The
Firestore rules limit each account to its own data.

## Data & privacy

- **Without Firebase:** everything stays in the browser (IndexedDB). Clearing
  site data removes it, so export a backup now and then.
- **With Firebase:** data belongs to the signed-in account (`users/{uid}`)
  and only that account can read it. Signing out clears the local view; the
  cloud copy stays and returns on the next sign-in. On first sign-in, local
  weigh-ins not yet in the cloud are uploaded; where both have the same date,
  the cloud value wins.

## Deployment

A static bundle that runs on any static host. On Vercel: import the repo
(framework Vite, build `npm run build`, output `dist`, also set in
[`vercel.json`](vercel.json)), add the `VITE_FIREBASE_*` variables if you
want sync, and deploy. Then use the browser's "Install app" or "Add to Home
Screen".
