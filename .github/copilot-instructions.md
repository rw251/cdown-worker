# Copilot Instructions

## Overview
- Cloudflare Worker `cdown-get-latest` polls the Apterous wiki for Countdown episode pages, parses the raw wiki markup, and mirrors structured data into Cloudflare KV + R2 so downstream sites can serve fresh episode information.
- A scheduled Worker cron drives the automated flow; the HTTP `fetch` handler exposes debugging endpoints for ad-hoc runs, inspection of stored state, and manual replays of specific episode IDs.

## Runtime & Infrastructure
- Built with Wrangler (`npm run dev` / `npm run deploy`) targeting the Workers runtime (`type: module` ES builds).
- Storage bindings (see `wrangler.toml`): `CDOWN_KV` (KV namespace), `CDOWN_BUCKET` (R2 bucket), and `send_email` binding for Mailgun-backed notifications.
- Environment expects secrets: `MAILGUN_API_KEY` and `EMAILS_TO`. Scheduled trigger runs hourly Tuesday–Saturday (`crons = ["1 * * * 2-6"]`).

## End-to-End Flow (`src/index.js`)
1. `scheduled` handler runs `getNextEpisode(env)` when the calculated retrieval time passes.
2. `getNextEpisode`:
   - Reads `LAST_SUCCESSFUL_EPISODE_DATE` and `LAST_SUCCESSFUL_EPISODE_NUMBER` from KV.
   - Computes the next weekday slot via `getNextEpisodeDateAndTimeAndTime`.
   - Pulls the wiki page (`internalGetEpisode`) and feeds it into `parseEpisode`.
   - On success, writes the raw wiki to KV, the parsed JSON into R2, and updates `players.json`, `series.json`, and the log file.
   - Persists the incremented KV markers so the next cron run advances.
3. Errors trigger `sendEmail` with the captured log. Successes e-mail the aggregated log as confirmation.
- The HTTP `fetch` handler aids debugging:
  - `/init` seeds KV with a baseline episode number.
  - `/log`, `/kv`, `/players`, `/series`, and `/list` expose the current diagnostic state.
  - `/get/<episode>` replays the full ingestion for a supplied episode ID without waiting for cron.

## Parsing Pipeline (`src/episodeParsing.js`)
- Extracts presenter, arithmetician, lexicographer, guest(s), player metadata, per-round results, and series classification from wiki markup.
- Maintains `lastFirstShownDate` ordering checks and pushes ambiguities through `logMessage` so investigators see them in the Worker email.
- `processRounds` normalises letters, numbers, conundrum, and TTT rounds, with numerous heuristics for malformed markup (mis-declarations, pulled episodes, duplicate conundrum solutions, etc.).
- `parseEpisode` returns an object `{ e, d, s, p1, p2, g, l, r, p, a }`. If parsing fails or indicates a pulled episode, it returns `false`, signalling the caller to skip persistence.
- Offline helpers `parseEpisodes` / `getDateFromEpisode` rely on Node `fs` access and `fileUtils.js` for legacy tooling; they are not invoked inside the Worker runtime but stay available for batch scripts/tests.

## Support Modules
- `src/log.js`: simple in-memory log buffer (`initLog`, `logMessage`, `getMessages`, `thereAreMessagesToBeLogged`) shared by the Worker and parser.
- `src/email.js`: constructs `FormData` payloads for Mailgun and POSTs to the domain configured via secrets.
- `src/fileUtils.js`: Node-specific helpers that map episode numbers to the archival directory structure on disk; used only by offline parsing flows.

## Data Model & Storage
- R2 bucket (`CDOWN_BUCKET`):
  - `LOG` file holds the most recent run messages.
  - `<episodeNumber>.json` stores parsed episode structures.
  - `players.json` maps player slug → array of episode numbers, kept deduplicated.
  - `series.json` tracks overall series metadata; per-series files (`series-<seriesSlug>.json`) contain episode/date lookups.
- KV namespace (`CDOWN_KV`):
  - Scalar markers `LAST_SUCCESSFUL_EPISODE_DATE` (ISO string) and `LAST_SUCCESSFUL_EPISODE_NUMBER`.
  - Raw wiki source keyed by episode number for reference/debugging.

## Local Development & Testing
- Initialise logs with `initLog()` before calling parsing helpers to avoid leaking state between runs.
- Use `npm run dev` to run Wrangler's local Worker (enables the `--test-scheduled` flag for cron simulation) and hit endpoints like `http://localhost:8787/get/8156`.
- Jest tests (`npm test`) live under `test/episodeParsing.test.js` and validate representative parsing cases; they run under Node with `--experimental-vm-modules`.
- When adjusting parsing heuristics, add targeted fixtures to the Jest suite and verify logs stay empty (`getMessages().length === 0`).

## Extension Guidelines
- Prefer enriching `parseEpisode` helpers instead of embedding ad-hoc regexes inside the Worker; it keeps parsing logic centralised and testable.
- Any new persistence should route through the existing KV/R2 bindings; keep writes idempotent because cron retries can re-run the same episode.
- Log all unexpected wiki formats via `logMessage` so operators receive actionable email diagnostics.
- When introducing new environment secrets or bindings, reflect them in `wrangler.toml` and document required values alongside deployment steps (see `README.md`).
