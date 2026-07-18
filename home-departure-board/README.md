# home-departure-board

A clean kiosk-friendly departure board for `Adolf-Ehrmann-Bad` in Karlsruhe-Neureut toward `Karlsruhe Hbf`, with a secondary Karlsruhe weather widget.

## What It Shows

- The next relevant S-Bahn/tram/train departure prominently at the top.
- The following departures underneath.
- Small walking and bike reference chips: `8 min` and `4 min`.
- A subtle `Live data` or `Demo data` indicator.
- A small last-updated timestamp and stale-data warning.
- Current Karlsruhe weather from Open-Meteo.

Cancelled departures are greyed and marked `fällt aus`. Urgency is communicated by color only.

## Tech Stack

- Frontend: Angular standalone components, RxJS polling, plain CSS.
- Backend: Node.js, Express, TypeScript.
- Shared package: TypeScript models, filtering, display-time formatting, urgency logic, and central defaults.

## Project Structure

```text
home-departure-board/
  packages/
    shared/       Shared config, models, formatting, filtering, tests
    backend/      Express API, transport/weather providers, tests
    frontend/     Angular standalone app and kiosk UI
```

## Requirements

- Node.js `20.11+`
- pnpm `9+`
- Docker Desktop or Docker Engine with Docker Compose, recommended for kiosk/tablet use

## Install

```bash
cd home-departure-board
corepack enable
pnpm install
```

On Windows PowerShell:

```powershell
cd home-departure-board
corepack enable
pnpm install
```

## Deploy On Vercel

This repository is Vercel-ready. The app does not need Docker on Vercel.

When importing the GitHub repository in Vercel, use these settings:

```text
Root Directory: home-departure-board
Install Command: corepack enable && pnpm install --frozen-lockfile
Build Command: pnpm build
Output Directory: packages/frontend/dist/frontend/browser
```

These same values are also committed in `vercel.json`.

The frontend calls `/api` on the same deployed domain. Vercel serves those backend routes through `api/[...path].js`, which loads the compiled Express app from `packages/backend/dist/server.js`. Nothing in the Vercel deployment calls `localhost`.

Recommended environment variables in Vercel:

```env
NODE_ENV=production
TZ=Europe/Berlin
MOCK_FALLBACK_ENABLED=true
KVV_EFA_BASE_URL=https://projekte.kvv-efa.de/sl3/
KVV_EFA_REQUEST_TIMEOUT_MS=8000
```

All other values have production-safe defaults, including `ORIGIN_STOP_ID=7001114`, `DESTINATION_STOP_ID=7000090`, `PREFERRED_LINES=S1,S11`, Karlsruhe weather coordinates, and mock fallback.

After deployment, test:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/
https://YOUR-VERCEL-DOMAIN.vercel.app/api/health
https://YOUR-VERCEL-DOMAIN.vercel.app/api/departures
```

Vercel provides HTTPS automatically, so the phone PWA install flow works better there than on a plain LAN `http://SERVER-IP:3000` URL.

## Run Locally

Start backend and frontend together:

```bash
pnpm dev
```

Open:

```text
http://localhost:4200
```

The Angular dev server proxies `/api` to the Express backend on `http://localhost:3000`.

Run only the backend:

```bash
pnpm start:backend
```

Run only the frontend:

```bash
pnpm start:frontend
```

## Test, Lint, Build

```bash
pnpm test
pnpm lint
pnpm build
```

The tests cover display-time formatting, urgency calculation, filtering, and the mock departure provider.

## Backend API

```text
GET /api/departures
GET /api/weather
GET /api/health
```

`/api/departures` returns normalized departures plus provider metadata:

```ts
type Departure = {
  id: string;
  line: string;
  destination: string;
  plannedTime: string;
  realtimeTime?: string;
  delayMinutes?: number;
  platform?: string;
  cancelled: boolean;
  minutesUntilDeparture: number;
  displayTime: string;
  urgency: "safe" | "warning" | "critical" | "cancelled";
  rawDirection?: string;
};
```

`/api/weather` returns:

```ts
type WeatherSummary = {
  temperatureCelsius: number;
  description: string;
  icon: string;
  precipitationProbability?: number;
  updatedAt: string;
};
```

## Configuration

Copy `.env.example` to `.env` and adjust values there.

Defaults:

```env
ORIGIN_STOP_NAME=Adolf-Ehrmann-Bad
ORIGIN_STOP_ID=7001114
DESTINATION_STOP_NAME=Karlsruhe Hbf
DESTINATION_STOP_ID=7000090
PREFERRED_LINES=S1,S11
WALKING_MINUTES=8
BIKE_MINUTES=4
DEPARTURE_POLLING_INTERVAL_MS=30000
WEATHER_POLLING_INTERVAL_MS=600000
MOCK_FALLBACK_ENABLED=true
NIGHT_MODE_START_HOUR=20
NIGHT_MODE_END_HOUR=7
KVV_EFA_BASE_URL=https://projekte.kvv-efa.de/sl3/
```

Shared defaults live in `packages/shared/src/config.ts`. Filtering terms and urgency colors are centralized there for later adjustment.

## Data Sources

Transport data is fetched only by the backend. The frontend never calls KVV/EFA directly.

The backend starts with `KvvEfaDepartureProvider`, using the KVV/EFA-style `XSLT_DM_REQUEST` departure monitor endpoint and stop ID `7001114`. If live transport data fails and `MOCK_FALLBACK_ENABLED=true`, the backend returns realistic mock departures and marks the response as `Demo data`.

Filtering keeps departures that clearly point toward Karlsruhe Hbf, Bad Herrenalb, Ittersbach, or southbound Ettlingen/Albgaubad services that pass Karlsruhe Hbf. It excludes obvious opposite direction departures such as `Hochstetten`.

Weather uses Open-Meteo for Karlsruhe:

```text
latitude 49.0069
longitude 8.4037
timezone Europe/Berlin
```

## Kiosk Mode Later

For a Raspberry Pi or wall display, run the Docker container and start Chromium:

```bash
docker compose up --build -d
chromium-browser --kiosk http://localhost:3000
```

If the browser runs on another device in the same network, use the server IP:

```bash
chromium-browser --kiosk http://SERVER-IP:3000
```

## Tablet Display

Use an old tablet as the screen, not as the server. Run this app on a laptop, mini PC, or Raspberry Pi on the same Wi-Fi network, then open the server URL from the tablet browser.

On the server device:

```bash
docker compose up --build -d
```

Find the server IP address:

```bash
hostname -I
```

On Windows:

```powershell
ipconfig
```

Then open this on the tablet:

```text
http://SERVER-IP:3000
```

For a Samsung Tab 3 Lite, keep the tablet plugged in, disable screen sleep if possible, and use the newest browser the device can run. This tablet is old enough that its built-in browser may not support the modern JavaScript emitted by Angular. If the page stays blank, try the latest available Chrome/Firefox for that Android version. If that still fails, use a newer display device or add a simple legacy HTML display endpoint served by the backend.

## PWA On Phones

The board is also prepared as a Progressive Web App named `Tren Casa`.

It includes:

- `manifest.webmanifest`
- app icons for Android and iPhone
- Apple home-screen metadata
- a lightweight service worker
- Docker support for serving the same app from a PC now and a mini PC later

### Run It On The Server

On the PC or mini PC:

```bash
docker compose up --build -d
```

Open it on the server itself:

```text
http://localhost:3000
```

Open it from a phone on the same Wi-Fi:

```text
http://SERVER-IP:3000
```

Example:

```text
http://192.168.1.50:3000
```

For daily use, give the PC or mini PC a fixed LAN address in your router, or reserve its DHCP address. That way the phone shortcut keeps working.

### Android

On Android Chrome:

1. Open `https://tren-casa-one.vercel.app/`.
2. Tap the `Installieren` button in the bottom status bar when it appears.
3. Confirm the browser installation prompt.

The browser menu remains available as a fallback: choose `Add to Home screen` or `Install app` and name it `Tren Casa`.

If the app is served over plain `http://SERVER-IP:3000`, Android may create a fast home-screen shortcut instead of a fully installed PWA. For full PWA install behavior, serve it over HTTPS.

### iPhone

On iPhone Safari:

1. Open `http://SERVER-IP:3000`.
2. Tap Share.
3. Tap `Add to Home Screen`.
4. Name it `Tren Casa`.

iPhone home-screen launch works well for quick access. For service-worker/PWA behavior, use HTTPS.

### HTTPS Note

Browsers require a secure origin for full PWA behavior on phones. `localhost` is treated as secure for development, but a LAN address such as `http://192.168.1.50:3000` is not.

Recommended options when this moves to the mini PC:

- simplest home-only access: keep using `Add to Home Screen` with `http://SERVER-IP:3000`
- best full PWA install: put the app behind HTTPS with a trusted certificate
- easiest private HTTPS/VPN route: use Tailscale or WireGuard and open the mini PC through that private network
- avoid exposing port `3000` directly to the public internet

## Docker

Docker is the recommended way to run the board continuously. The container builds the Angular frontend, serves it from the Express backend on port `3000`, restarts automatically, and keeps mock fallback enabled so the UI still works if KVV/EFA or Open-Meteo are temporarily unavailable.

On Windows, start Docker Desktop first and wait until it says the engine is running.

```bash
docker compose up --build -d
```

Then open:

```text
http://localhost:3000
```

Useful commands:

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

Optional configuration can go in a local `.env` file. You do not need one for the defaults to work.

```bash
cp .env.example .env
```

For a different host port:

```bash
HOST_PORT=8080 docker compose up --build -d
```

On Windows PowerShell:

```powershell
$env:HOST_PORT="8080"
docker compose up --build -d
```

The production container uses `TZ=Europe/Berlin`, includes a healthcheck at `/api/health`, and has `restart: unless-stopped` for kiosk/Raspberry Pi usage.

## Implementation Notes

- Express was chosen over NestJS for a smaller MVP and faster local setup.
- Angular uses standalone components only.
- The UI is designed for a small fullscreen display and avoids instructional status text such as "leave now".
- Night mode is automatic from `20:00` to `07:00`; the global CSS also includes a `prefers-color-scheme` fallback.
- If no relevant departures are available, the app shows `Aktuell fahren keine Bahnen Richtung Karlsruhe Hbf.`
- If live transport data is unavailable and mock fallback is disabled, it shows `Abfahrtsdaten aktuell nicht verfügbar.`
