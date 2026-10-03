# The weekly Safari look

`.github/workflows/safari.yml` and `tools/webkit-smoke.mjs`. Read this when changing either.

- Every Monday, the built game is opened in WebKit, the engine under Safari and every iPhone, by
  `tools/webkit-smoke.mjs` (the real checks only use Chromium, which Playwright can't swap for Safari).
- A short look, not a replay of the checks: the clubhouse as a phone and a desktop opens, draws, keeps
  producing frames, shows the letter only the first time, and has no page error; then every activity
  started from its address is drawn and error-free.
- It is not part of `npm run check` and never blocks a pull request. A red run shows on the repository's
  Actions page (pictures kept a week), worth a look when starting new work. Locally it needs
  `npx playwright install webkit`, which Claude's own machine can't download, so only GitHub runs it.
