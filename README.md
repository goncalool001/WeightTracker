# Weight Tracker (Web)

A modern, local-first weight-tracking dashboard — a web rebuild of the original
PyQt6 desktop app. Track daily weight, see weekly averages, trends and a goal
projection, and import/export the same `.xlsx` format the desktop app used.

- **Local-first & private** — data lives in your browser (IndexedDB). No server,
  no account, no tracking.
- **Excel compatible** — import your existing `weight_data.xlsx` and export an
  identical two-sheet workbook anytime. Your current history is bundled and
  loads automatically on first launch.
- **Installable PWA** — add it to your phone's home screen; works offline.
- **Responsive** — mobile, tablet and desktop layouts.
- **Light & dark themes** — system-aware with a manual toggle.

## Features

- Log / update / delete daily weights (upsert keyed on date).
- Daily chart with area fill, value labels, and a **Trend** or **7-day average**
  overlay.
- Weekly-average bar chart with week-over-week deltas, trend line, goal line and
  a projected goal date.
- KPI cards: total entries, latest, this week, vs last week, since week 1, and
  trend rate (kg/week).
- Time-range filter: 7D / 30D / 90D / YTD / All.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 18 + TypeScript + Vite |
| Charts | Apache ECharts (`echarts-for-react`) |
| Styling | Tailwind CSS (CSS-variable theming) |
| State | Zustand |
| Persistence | IndexedDB (`idb-keyval`) |
| Cloud sync (optional) | Firebase Auth + Firestore |
| Excel I/O | SheetJS (`xlsx`) |
| Dialogs/Tooltips | Radix UI |
| Toasts | Sonner |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest + Testing Library |

## Architecture

```
UI (React)  ⇄  Store (Zustand)  ⇄  Domain (pure TS math)
                     ⇅
         Data layer (Excel · IndexedDB · seed)
```

- `src/domain` — framework-free, unit-tested business logic (weekly averages,
  least-squares trend, moving average, deltas, metrics, goal projection). A
  faithful port of the desktop app's calculations.
- `src/data` — Excel import/export, IndexedDB persistence, and the bundled seed.
- `src/store` — Zustand store + memoised derived-state selectors.
- `src/components` — reusable UI, charts, metrics, tables, layout.
- `src/features` — dashboard, log-entry, file (import/export) features.

## Getting started

Requires **Node.js 18+**.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run test     # run the domain unit tests
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build locally
```

## Cloud sync (Firebase) — optional

The app is **local-first**: it works fully offline with no account. Configuring
Firebase additionally syncs your entries and goal across devices in real time.
Sign in with Google on your PC and your phone, and they stay in sync (changes
made offline sync automatically when you reconnect). Without Firebase config,
the sync UI is hidden and the app stays purely local.

### One-time Firebase setup (free, no credit card)

1. Create a project at <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (Production mode).
4. **Firestore → Rules**: paste the contents of [`firestore.rules`](firestore.rules) and **Publish**.
5. **Project settings (⚙) → General → Your apps → Web app (`</>`)** to register
   a web app and copy the config values.
6. Put those values in `.env.local` (copy from [`.env.example`](.env.example))
   for local dev, and add the same variables in Vercel (next section).
7. After deploying, add your domains under **Authentication → Settings →
   Authorized domains** (e.g. `localhost`, `your-app.vercel.app`).

The `VITE_FIREBASE_*` values are **not secrets** — they ship in the frontend.
Access is enforced by the Firestore rules, which lock each user's data to their
own account.

## Deployment (Vercel)

The app is a static bundle, deployable to any static host. Recommended flow:

1. Push this folder to a GitHub repository.
2. At <https://vercel.com> → **Add New → Project** → import the repo.
   Framework **Vite**, build `npm run build`, output `dist` (auto-detected; also
   in [`vercel.json`](vercel.json)).
3. **Settings → Environment Variables**: add the six `VITE_FIREBASE_*` values
   (only if you want sync). Redeploy after adding them.
4. Open the deployed URL; install it as a PWA via the browser's
   "Install app" / "Add to Home Screen".

Other hosts (Netlify, Cloudflare Pages, GitHub Pages) work too — build with
`npm run build` and serve `dist/`.

## Data & privacy

- **Signed out / no Firebase:** data lives only in your browser (IndexedDB).
  Clearing site data removes it — use **Export** for an `.xlsx` backup.
- **Signed in:** data also lives in your private Firestore tree
  (`users/{your-uid}`), readable only by you, and syncs across your devices.
- On first sign-in, any local-only history is uploaded; on a per-date conflict
  the cloud value wins. Importing an `.xlsx` replaces the dataset (with a
  confirmation) and propagates to the cloud.
