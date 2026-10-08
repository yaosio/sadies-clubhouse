# GitHub Pages

`.github/workflows/pages.yml`. Read this when changing how the game is put on GitHub Pages.

- On every push to `main` it runs `npm run build` and publishes `dist/` (the real game, no test label) at
  https://yaosio.github.io/<repo name>/ (the address ends with the repository's name, so renaming the repository changes it; nothing in the build depends on it). It runs no checks: the check workflow does that.
- The repo setting it needs: Settings > Pages > Source = "GitHub Actions". With "Deploy from a branch" Pages
  serves the repo's files, which have no `index.html` at the top, so it shows `README.md` instead of the game.
- No secrets; only GitHub's built-in Pages permission. The game's paths are relative, so the sub-folder URL works.
- A second place to play (made 2026-10-06 by Yaosio's wish). The Artifact link stays the published game.
