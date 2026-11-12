# WeatherBoard

A personal weather dashboard built with React, Vite, and Tailwind CSS. Built as part of the Edspire Frontend Technical Challenge.

## Live URL
[INSERT YOUR VERCEL URL HERE]

## Setup Instructions
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file in the root with:
   `VITE_WEATHER_API_KEY=your_openweather_key`
   `VITE_GEODB_API_KEY=your_rapidapi_key`
4. Run `npm run dev`.

## Architecture & Decisions
- **Vite + React:** Chosen for fast HMR and modern build tooling.
- **Tailwind CSS:** For rapid, utility-first styling that matches the "Linear/Vercel" aesthetic requested.
- **API Integration:** OpenWeatherMap for data, GeoDB via RapidAPI for autocomplete. Handled with `fetch` and standard `useEffect` debouncing.
- **PWA:** Custom `sw.js` and `manifest.json` to allow installation and offline caching.
- **LocalStorage:** Used for saving favourites and persisted across sessions. Wrapped in `try/catch` for graceful degradation.