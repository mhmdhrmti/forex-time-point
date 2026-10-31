# Forex Time Point

A minimalist 24-hour market clock built with Next.js (App Router), TypeScript and Tailwind CSS.

## Features

- **24-hour dial** with large hour numerals, a live hand (when viewing today), digital time and date in the selected zone
- **Time ranges as triangles**: a low-opacity wedge from the centre to the start and end of each range
- **Trading sessions** (Sydney, Tokyo, London, New York) as wide, distinctly coloured, low-opacity lanes outside the triangles, with live Open/Closed status and per-session toggles
- **Trading-day picker**: defaults to today; step with ‹ › or pick any date
- **Forex Factory calendar** for the chosen day, with dates on every item, impact and currency filters, and forecast/previous values
- **Market-closed indicators**: weekends (Fri 22:00 – Sun 22:00 UTC), global holidays, and bank holidays that close the matching session; shown as a banner, hatching on the dial, in the session list and in the news list
- **GMT time zone selector** (GMT-12 to GMT+14, including half/quarter-hour zones); defaults to the device zone
- **Time points** (and ranges) you define; stored in UTC so they follow the zone you switch to
- **15-minute alerts** for pinned events: in-app toast, optional desktop notification and a short beep (use *Enable alerts* once)
- **Dark / light / auto theme**, responsive from phones to wide desktops
- **Saved settings** (in this browser's `localStorage`): time zone, theme, pinned events, your own events, points, ranges, session visibility, filters and the selected tab

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Data source

News and holidays come from Forex Factory's public weekly calendar export
(`ff_calendar_thisweek.json` / `ff_calendar_nextweek.json`), fetched server-side in
`src/app/api/calendar/route.ts`, parsed in `src/lib/calendar.ts`, and cached for 30 minutes
(the last good copy is served if the feed errors or rate-limits).

- The feed only covers **this week and next week**. Other dates show an explanatory note; weekends are still marked closed.
- Check Forex Factory's terms before using the feed commercially.
- If the feed is unreachable the app shows an error with a Retry button. It never substitutes made-up data.

## Notes and limitations

- Time zones are fixed GMT offsets and session hours are standard UTC hours. Daylight saving is not applied automatically, so change the offset when your region shifts.
- Holidays map to sessions by currency (AUD/NZD → Sydney, JPY/CNY → Tokyo, GBP/EUR/CHF → London, USD/CAD → New York). That is an approximation; a holiday listed for "All" closes everything.
- Alerts need the tab to be open (no server push yet). Settings live per browser, not per account.

## Structure

```
src/app/api/calendar/  Forex Factory proxy route (server)
src/lib/               time maths, calendar parsing + closure logic, sessions/timezones, localStorage hook
src/components/        Clock (SVG), NewsPanel, MarksPanel, StatusBanner, ThemeToggle, Logo, Dashboard
src/app/               layout, page, global styles, icon.svg (favicon)
```
