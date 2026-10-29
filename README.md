# Quiz 12 & 13 — Static site with CI/CD to GitHub Pages

- **Quiz 12:** ESLint quality gate before deploy
- **Quiz 13:** page-load welcome message (`site/js/welcome.js`) + Jest test job before deploy

See [DOCUMENTATION.md](DOCUMENTATION.md) for details.


- `site/` — the static site (HTML/CSS/JS)
- `.github/workflows/deploy.yml` — on every push to `main`:
  1. **Lint** — runs ESLint (`npm run lint`); a missing semicolon (`semi` rule) fails the build
  2. **Test** — runs Jest (`npm test`) on `site/js/welcome.js` (only if lint passed)
  3. **Package** — uploads `site/` as a Pages artifact (only if lint and test passed)
  4. **Deploy** — publishes the artifact to GitHub Pages

Run locally with `npm ci && npm run lint && npm test`.
