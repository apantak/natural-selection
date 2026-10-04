# Will You Accept This Bone?

A host-run, offline party game for adults. One phone, 3 to 8 players.

## Develop

```sh
npm install
npm run dev
```

Checks: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.

## Deploy

`.github/workflows/deploy.yml` builds, tests and publishes `dist/` to GitHub Pages on every push to `main`.

One-time setup before the first push: in the repo, open **Settings → Pages** and set **Source** to **GitHub Actions**. Without it, `actions/configure-pages` fails with "Get Pages site failed" and nothing deploys. The repo must be public, or on a plan that allows Pages for private repos.

The app is served from `/natural-selection/`. If the repo is renamed, change `base` in `vite.config.ts` to match.
