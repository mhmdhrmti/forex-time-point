# Forex Time Point

A minimalist 24-hour market clock built with Next.js (App Router), TypeScript and Tailwind CSS.

## Features

- **24-hour dial** with large hour numerals and a live hand (when viewing today); the digital time, date and open/closed status sit above it so the dial stays clean
- **Time ranges as wedges**: tip at the centre, a curved, borderless outer end, low opacity with a soft fade toward the centre
- **Trading sessions** (Sydney, Tokyo, London, New York) as wide, distinctly coloured, low-opacity lanes outside the wedges, with live Open/Closed status and per-session toggles
- **Trading-day picker**: defaults to today; step with ‹ › or pick any date. Events are fetched per week from Forex Factory whenever you move to a new week
- **Forex Factory calendar** for the chosen day, with dates on every item, impact and currency filters, and forecast/previous values
- **Select an event** to highlight it in the list and on the dial; you get an alert N minutes before it starts (2/5/10/15/30, saved). Selections persist across dates and reloads
- **Market-closed indicators**: weekends (Fri 22:00 – Sun 22:00 UTC), global holidays, and bank holidays that close the matching session; shown as a banner, a red-tinted clock face, in the session list and in the news list
- **GMT time zone selector** (GMT-12 to GMT+14, including half/quarter-hour zones); defaults to the device zone
- **Time points** (and ranges) you define; stored in UTC so they follow the zone you switch to
- **Alerts** for selected events: in-app toast, optional desktop notification and a short beep (use *Enable alerts* once)
- **Dark / light / auto theme**, responsive from phones to wide desktops
- **Saved settings** (in this browser's `localStorage`): time zone, theme, pinned events, your own events, points, ranges, session visibility, filters and the selected tab

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Data source

`GET /api/calendar?week=YYYY-MM-DD` (`src/app/api/calendar/route.ts`) returns the Forex Factory events for the Sunday-start week containing that date; the client requests a week the first time you view a date in it.

- **This week / next week**: Forex Factory's public JSON export (`ff_calendar_thisweek.json` / `ff_calendar_nextweek.json`), parsed in `src/lib/calendar.ts`.
- **Any other week**: the Forex Factory calendar web page, parsed best-effort in `src/lib/ffpage.ts` (assumes the page renders times in UTC). This path is **unverified against the live site**, and Forex Factory may block server-side requests; if it does, the news panel shows the reason with a Retry button.
- Results are cached per week (30 min for nearby weeks, 12 h otherwise); the last good copy is served if a refresh fails.
- Check Forex Factory's terms before using the data commercially. The app never substitutes made-up data.

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
