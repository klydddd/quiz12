# Quiz 12 — CI/CD Lint Test Documentation

Removing one semicolon from `site/js/main.js` made the ESLint step fail. GitHub Actions then skipped the packaging and deployment jobs, so the broken code never reached GitHub Pages.

- **Repository:** https://github.com/klydddd/quiz12
- **Live site:** https://klydddd.github.io/quiz12/
- **Workflow runs:** https://github.com/klydddd/quiz12/actions

---

## 1. Setup

### Site

| Path | Purpose |
| --- | --- |
| `site/index.html` | Page markup |
| `site/css/style.css` | Styles (light/dark) |
| `site/js/main.js` | Click counter and page-load timestamp |

### Workflow (`.github/workflows/deploy.yml`)

It runs on every push to `main` and has three jobs that run in order:

1. **Lint JavaScript**: `npm ci` then `npm run lint` (ESLint on `site/`)
2. **Package site**: `needs: lint`, uploads `site/` as a Pages artifact with `actions/upload-pages-artifact`
3. **Deploy to GitHub Pages**: `needs: build`, publishes the artifact with `actions/deploy-pages`

Because of the `needs:` chain, a lint failure stops the pipeline before anything is packaged or deployed.

### Lint rule (`eslint.config.js`)

```js
rules: {
  semi: ["error", "always"],   // every statement must end with a semicolon
  quotes: ["error", "double"],
  "no-unused-vars": "error",
  "prefer-const": "error",
  eqeqeq: "error",
},
```

---

## 2. Baseline: a passing deploy

Commit `a3a8400` (*Add static site with lint + GitHub Pages deploy workflow*). [Run 39710535288](https://github.com/klydddd/quiz12/actions/runs/39710535288):

| Job | Result |
| --- | --- |
| Lint JavaScript | ✅ success |
| Package site | ✅ success |
| Deploy to GitHub Pages | ✅ success |

The site went live at https://klydddd.github.io/quiz12/ and returned HTTP 200.

---

## 3. Breaking it: omitting a semicolon

Commit `7f1dc0c` (*Test: omit a semicolon to verify lint blocks deployment*) changed line 4 of `site/js/main.js`:

```diff
 const countEl = document.getElementById("count");
-let count = 0;
+let count = 0
```

### Result: pipeline failed at lint

[Run 39711267819](https://github.com/klydddd/quiz12/actions/runs/39711267819):

| Job | Result |
| --- | --- |
| Lint JavaScript | ❌ failure |
| Package site | ⏭️ skipped |
| Deploy to GitHub Pages | ⏭️ skipped |

Steps in the lint job:

```
✓ Set up job
✓ Run actions/checkout@v4
✓ Run actions/setup-node@v4
✓ Run npm ci
X Run ESLint
```

ESLint output from the Actions log:

```
/home/runner/work/quiz12/quiz12/site/js/main.js
  4:14  error  Missing semicolon  semi

✖ 1 problem (1 error, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.

##[error]Process completed with exit code 1.
```

The live site stayed on the last good version because packaging and deployment never ran.

---

## 4. Fixing it

Commit `c9b6c6c` (*Fix: restore missing semicolon*) put the semicolon back:

```diff
-let count = 0
+let count = 0;
```

The next run passed every job:

| Job | Result |
| --- | --- |
| Lint JavaScript | ✅ success |
| Package site | ✅ success |
| Deploy to GitHub Pages | ✅ success |

https://klydddd.github.io/quiz12/ returned HTTP 200 again.

---

## 5. Run history (newest first)

| Commit | Change | Lint | Package | Deploy |
| --- | --- | --- | --- | --- |
| `c9b6c6c` | Restore missing semicolon | ✅ | ✅ | ✅ |
| `7f1dc0c` | Omit semicolon (intentional break) | ❌ | ⏭️ skipped | ⏭️ skipped |
| `a3a8400` | Initial site + workflow | ✅ | ✅ | ✅ |

---

## Reproduce locally

```bash
npm ci
npm run lint          # passes

# break it
sed -i '' 's/^let count = 0;$/let count = 0/' site/js/main.js
npm run lint          # 4:14 error Missing semicolon semi (exit code 1)

# fix it
sed -i '' 's/^let count = 0$/let count = 0;/' site/js/main.js
npm run lint          # passes
```
