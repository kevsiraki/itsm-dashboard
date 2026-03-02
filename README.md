# ITSM Dashboard

Operational dashboard for osTicket-style incident/request queues. The app polls a remote API every 60 seconds, computes SLA and throughput analytics in-memory, and renders an executive view with KPIs, charts, searchable ticket data, and active breach alerts.

## What this app does

- Pulls ticket records from a REST endpoint (`src/constants/dashboard.js` -> `API_URL`).
- Calculates queue health metrics (open/closed/pending, breach rate, percentiles, trend signals).
- Displays:
  - A header with live risk indicators and feed controls.
  - KPI cards with sparkline charts.
  - Trend/composition/workload charts.
  - Searchable/sortable ticket table (desktop + mobile card layout).
  - Active SLA breach list.
- Supports dark/light theme with persistence in `localStorage`.
- Supports CSV export of currently visible rows.

## Tech stack

- React 18
- Vite 5
- Recharts 2
- Plain CSS (no CSS framework)

## Project structure

```txt
.
|- src/
|  |- App.jsx                    # orchestration, polling, state, derived analytics
|  |- main.jsx                   # React bootstrap
|  |- index.css                  # global tokens/theme variables/base styles
|  |- App.css                    # component/layout styling and responsive behavior
|  |- TicketModal.jsx            # standalone ticket detail modal (currently unused)
|  |- components/
|  |  |- WindowHeader.jsx        # toolbar, header, executive strip
|  |  |- KpiRow.jsx              # KPI cards + mini charts
|  |  |- ChartsPanel.jsx         # main analytics charts
|  |  |- TicketsTable.jsx        # filters, sorting, table/cards, CSV export
|  |  |- SlaAlerts.jsx           # active breach list
|  |  |- QuantMetrics.jsx        # advanced quant cards (currently not rendered)
|  |- constants/
|  |  |- dashboard.js            # API URL, SLA threshold, chart color constants
|  |- utils/
|     |- metrics.js              # metric/stat math + CSV export + grouping helpers
|     |- ticketHelpers.js        # date/status/priority formatting helpers
|- vite.config.js                # relative base path for static hosting
|- Jenkinsfile                   # CI/CD build + rsync deployment + notifications
```

## Run locally

### Prerequisites

- Node.js 18+ recommended
- npm 9+ recommended

### Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Configuration

### `src/constants/dashboard.js`

- `API_URL`: remote endpoint returning ticket array JSON.
- `SLA_SECONDS`: breach threshold (default `48 * 3600`, i.e. 48h).
- `STATUS_COLORS`: fallback palette for status pie slices.
- `PRIORITY_COLORS`: explicit palette by priority label.

## Data contract (ticket shape)

The UI tolerates partial data, but these fields drive most behavior:

```js
{
  id: number | string,
  number: string,
  subject: string,
  status: string,
  dept: string,
  created: string,      // parseable date/time; supports "YYYY-MM-DD HH:mm:ss"
  priority_id: number,  // expected 1..4
  message: string,
  user: {
    name: { name: string },
    email: { email: string }
  }
}
```

Fallback behavior:

- Missing `user` fields render as `-`.
- Unknown `priority_id` renders raw value or `-`.
- Unparseable `created` is excluded from age/time-series calculations.

## App architecture and data flow

1. `main.jsx` mounts `<App />` in React strict mode.
2. `App.jsx` owns all top-level state:
   - `tickets`, `loading`, `error`
   - `lastUpdated`
   - `paused` data feed toggle
   - `theme` (`dark`/`light`) persisted in `localStorage`
   - `query` + `sortBy` for table filtering/sorting
3. Polling loop in `useEffect`:
   - Fetches `API_URL` immediately and then every 60 seconds.
   - Stops fetch updates if paused.
   - Guards state updates with `mounted` ref.
4. Derived datasets are computed with `useMemo` and passed down to presentational components.

## Derived metrics and formulas

### Core queue metrics

Computed in `App.jsx` from full ticket set:

- `total`: total ticket count.
- `open`, `closed`, `pending`: status substring matching on lowercase status text.
- `highPrio`: `priority_id >= 3`.
- `emergency`: `priority_id === 4`.
- `breaches`: tickets with age in seconds `> SLA_SECONDS`.
- `avgAgeSec`: arithmetic mean of valid ticket ages.
- `avgAge`: `formatHours(avgAgeSec)`.
- `breachRate`: `round((breaches / total) * 100)`.
- `openRate`: `round((open / total) * 100)`.
- `closedRate`: `round((closed / total) * 100)`.

### Time-series datasets

- `trendData`: daily created-count series + 3-point moving average.
- `throughput`: last 24 hours grouped by hour + 4-point moving average.
- `statusData`: status distribution for pie chart.
- `priorityData`: fixed Low/Normal/High/Emergency backlog profile.
- `deptData`: top 6 departments by ticket count.

### Quant stats (computed, partially hidden in UI)

- Percentiles: P50/P90/P99 ticket age (`percentile`).
- Dispersion: standard deviation (`stddev`).
- Smoothing: EWMA (`ewma`, alpha 0.25 for age signal).
- Z-score (`zscore`) of latest age against distribution.
- Rate of change (`rateOfChange`) between latest two age points.
- Sharpe-like ratio (`mean / stddev`).

### Risk classification

`riskLevel` logic in `App.jsx`:

- `Critical`: breach rate >= 25 OR emergency >= 5
- `Elevated`: breach rate >= 12 OR emergency >= 2
- `Stable`: otherwise

## Component reference

### `App` (`src/App.jsx`)

Role: container/orchestrator. Handles polling, state, all derived analytics, and composition of child components.

Renders:

- `WindowHeader`
- `KpiRow`
- `ChartsPanel`
- `TicketsTable`
- `SlaAlerts`
- `QuantMetrics` import exists but render block is commented out.

### `WindowHeader` (`src/components/WindowHeader.jsx`)

Props:

- `isDark`, `setTheme`
- `paused`, `setPaused`
- `lastUpdated`
- `riskLevel`, `breachRate`, `closureGap`, `openRate`, `emergency`, `p50Hours`, `ageROC`

Behavior:

- Theme toggle button.
- Pause/resume polling button.
- Displays executive meta cards and strip metrics.

### `KpiRow` (`src/components/KpiRow.jsx`)

Props:

- `metrics`
- `trendData`
- `throughput`
- `p99Hours`

Behavior:

- Renders 6 KPI cards.
- Uses small Recharts visualizations (line/area sparklines) in selected cards.

### `ChartsPanel` (`src/components/ChartsPanel.jsx`)

Props:

- `trendData`
- `statusData`
- `priorityData`
- `deptData`
- `chartTick`, `chartGrid`, `tooltipProps`

Behavior:

- Renders four charts:
  - Ticket Intake Trend (Area + moving average line)
  - Current Status Mix (Donut/Pie)
  - Priority Backlog Profile (Bar)
  - Department Workload (Bar)

### `TicketsTable` (`src/components/TicketsTable.jsx`)

Props:

- `loading`, `error`
- `query`, `setQuery`
- `sortBy`, `setSortBy`
- `visible` (already filtered/sorted records)

Behavior:

- Search input across `subject`, `number`, and requester name.
- Sort selector:
  - Created newest/oldest
  - Priority highest first
  - Ticket number A-Z
- CSV export (`exportCSV(visible, 'tickets.csv')`).
- Desktop table view + mobile card view.
- Loading, error, and empty states.

### `SlaAlerts` (`src/components/SlaAlerts.jsx`)

Props:

- `slaBreaches`

Behavior:

- Lists up to 8 current breach tickets.
- Shows requester, creation timestamp, and overdue hours pill.

### `QuantMetrics` (`src/components/QuantMetrics.jsx`) - currently not rendered

Props:

- `p50Hours`, `p90Hours`, `p99Hours`, `ageEwmaHours`, `ageStdHours`, `ageZ`, `ageROC`, `ageSharpe`

Behavior:

- Grid of advanced quant cards.
- Intended for deeper analytics view.

### `TicketModal` (`src/TicketModal.jsx`) - currently unused

Props:

- `ticket`
- `onClose`

Behavior:

- Detail modal for one ticket (status, dept, priority, full message).
- Not imported by `App` in current implementation.

## Utility reference

### `src/utils/metrics.js`

- `percentile(values, p)`
- `movingAverage(values, window)`
- `groupByHour(tickets, hours)`
- `secondsSinceCreated(created)`
- `exportCSV(rows, filename)`
- `mean(values)`
- `stddev(values)`
- `ewma(values, alpha)`
- `zscore(values, x)`
- `rateOfChange(values)`
- `sharpeLike(values)`

### `src/utils/ticketHelpers.js`

- `parseDate(s)`
- `prettyDate(s)`
- `statusDot(status)` (`green`, `yellow`, `gray`)
- `priorityLabel(priorityId)` (`Low`, `Normal`, `High`, `Emergency`)
- `formatHours(seconds)`

## Theming and UI behavior

- Theme token system in `src/index.css` using CSS variables.
- `data-theme="dark|light"` on `<html>` controls token set.
- Component styles and responsive breakpoints in `src/App.css`.
- Breakpoints adjust:
  - KPI grid density
  - chart panel layout (2-column to 1-column)
  - controls stacking
  - desktop table -> mobile cards at narrow widths

## Error handling and resilience

- Non-200 API response sets `error` banner with status text.
- Non-array payload coerces to empty array.
- Invalid/missing dates are ignored in date-derived analytics.
- Polling cleanup clears interval on unmount.

## Build and deployment

### Vite config

`vite.config.js` uses `base: './'` to support relative asset paths for static hosting/subdirectory deployment.

### Jenkins pipeline (`Jenkinsfile`)

Stages:

1. Install system packages (`rsync`, `openssh-client`) in node Docker agent.
2. Checkout source.
3. `npm ci`.
4. Build (`npm run build`) and verify `dist/` exists.
5. Deploy with `rsync --delete` over SSH to configured server path.
6. Send success/failure notification through internal Discord relay service.

## Known implementation notes

- `QuantMetrics` is computed in `App.jsx` but currently commented out in JSX.
- `TicketModal` exists but is not wired into current UX.
- No test suite is configured in `package.json`.

## Suggested next improvements

- Add automated tests for metric utilities and rendering of key states.
- Add runtime validation for API payload shape.
- Expose API URL/SLA threshold through environment variables for easier environment promotion.
- Wire ticket detail modal from table row click.
