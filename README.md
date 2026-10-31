# Forex Time Point

A minimalist 24-hour market clock built with Next.js (App Router), TypeScript and Tailwind CSS.

## Features

- **24-hour dial** with a live hand, digital readout and date in the selected time zone
- **Trading sessions** (Sydney, Tokyo, London, New York) as concentric arcs, with live Open/Closed status and per-session visibility toggles
- **GMT time zone selector** (GMT-12 to GMT+14, including half/quarter-hour zones); defaults to the device zone
- **Time points and intervals** you define; stored in UTC so they follow the zone you switch to
- **Daily news and events** panel with impact filter; pin any event to the clock
- **15-minute alerts** for pinned events: in-app toast, optional desktop notification and a short beep (use *Enable alerts* once to grant permission)
- Everything you configure persists in `localStorage`

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Notes and limitations

- **The news feed is sample data** (`src/lib/data.ts`), not a live economic calendar. Swap `SAMPLE_EVENTS` for a real provider; events only need `id`, `title`, `region`, `impact` and `utcMinutes`.
- Time zones are fixed GMT offsets. Daylight saving is not applied automatically, so change the offset when your region shifts. Session hours are standard UTC hours for the same reason.
- Alerts need the tab to be open (no server push yet).

## Structure

```
src/lib/        time maths, session/timezone/sample data, localStorage hook
src/components/ Clock (SVG), NewsPanel, MarksPanel, Dashboard
src/app/        layout, page, global styles
```
