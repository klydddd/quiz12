# Quiz 12: Software Configuration Management with CI/CD on GitHub Pages

| | |
| --- | --- |
| **Course** | SEN10 |
| **Public repository** | https://github.com/klydddd/quiz12 |
| **Live site** | https://klydddd.github.io/quiz12/ |
| **Workflow runs** | https://github.com/klydddd/quiz12/actions |
| **LLM used** | Claude (Claude Code CLI, model Claude Opus 5.5) |

---

## Table of contents

1. [Overview](#1-overview)
2. [Background: SCM, version control, CI/CD and DevOps](#2-background-scm-version-control-cicd-and-devops)
3. [Requirements checklist](#3-requirements-checklist)
4. [Project structure](#4-project-structure)
5. [The static site](#5-the-static-site)
6. [The GitHub Actions workflow](#6-the-github-actions-workflow)
7. [The automated quality check (ESLint)](#7-the-automated-quality-check-eslint)
8. [GitHub Pages setup](#8-github-pages-setup)
9. [Testing the quality gate: breaking a JS rule](#9-testing-the-quality-gate-breaking-a-js-rule)
10. [Run history](#10-run-history)
11. [How to reproduce](#11-how-to-reproduce)
12. [LLM prompts used](#12-llm-prompts-used)
13. [Issues encountered](#13-issues-encountered)
14. [Conclusion](#14-conclusion)

---

## 1. Overview

This project is a small static website (HTML, CSS and JavaScript) stored in a public GitHub repository. A GitHub Actions workflow publishes it to GitHub Pages automatically.

On every push to the `main` branch, the workflow:

1. **Lints** the JavaScript with ESLint, the automated quality check.
2. **Packages** the `site/` folder as a GitHub Pages artifact, but only if linting passed.
3. **Deploys** the artifact to GitHub Pages, but only if packaging succeeded.

To test the quality check, I pushed a commit that left out a required semicolon. The lint job failed, and the package and deploy jobs were skipped, so the broken code never reached the live site. A follow-up commit restored the semicolon and the pipeline passed again.

---

## 2. Background: SCM, version control, CI/CD and DevOps

**Software Configuration Management (SCM)** means identifying, controlling and tracking the artifacts that make up a software system: source code, configuration and build scripts. The goal is that every version of the system can be reproduced, audited and changed safely.

This project uses SCM practices in four ways:

| SCM concept | How this project applies it |
| --- | --- |
| **Version control** | Every change (site code, lint configuration, the workflow itself) is a Git commit in the GitHub repository. The history shows exactly what changed, when and why: the intentional break and its fix are separate, clearly labelled commits. |
| **Configuration as code** | The build and deployment process lives in `.github/workflows/deploy.yml`, and the quality rules live in `eslint.config.js`. Both are versioned with the code, so the pipeline itself can be reviewed and rolled back. |
| **Continuous Integration (CI)** | Every push is checked automatically by the ESLint job. A change that breaks a rule is caught within seconds instead of reaching users. |
| **Continuous Delivery/Deployment (CD)** | When the checks pass, the site is packaged and published to GitHub Pages with no manual steps. |
| **DevOps** | Development (writing code) and operations (publishing and hosting) are joined in one automated pipeline. The same push that changes the code also tests and releases it. |
| **Reproducibility** | `package-lock.json` pins the exact ESLint version. `npm ci` in the workflow installs the same dependencies on every run, so local results match CI results. |

---

## 3. Requirements checklist

| Requirement | Points | Where it is met |
| --- | --- | --- |
| Static site (HTML/CSS/JS) | 10 | `site/index.html`, `site/css/style.css`, `site/js/main.js` ([Section 5](#5-the-static-site)) |
| Hosted on GitHub Pages | ↑ | https://klydddd.github.io/quiz12/ ([Section 8](#8-github-pages-setup)) |
| GitHub Actions workflow that packages and publishes on every push | ↑ | `.github/workflows/deploy.yml`: `build` job packages, `deploy` job publishes ([Section 6](#6-the-github-actions-workflow)) |
| JS linter step that runs **before** deployment | 10 | `lint` job; `build` has `needs: lint`, `deploy` has `needs: build` ([Section 7](#7-the-automated-quality-check-eslint)) |
| Test it by breaking a JS rule (omit a semicolon) | ↑ | Commit `7f1dc0c` failed lint and blocked the deploy; commit `c9b6c6c` fixed it ([Section 9](#9-testing-the-quality-gate-breaking-a-js-rule)) |
| Public GitHub repository link | 5 | https://github.com/klydddd/quiz12 (visibility: **public**) |
| Share all LLM prompts | ↑ | [Section 12](#12-llm-prompts-used) |

---

## 4. Project structure

```
quiz12/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline: lint → package → deploy
├── site/                     # Everything in here is published to GitHub Pages
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── eslint.config.js          # Lint rules (includes semi: always)
├── package.json              # "lint" script + ESLint dev dependencies
├── package-lock.json         # Pinned dependency versions
├── .gitignore                # Ignores node_modules/
├── README.md
└── DOCUMENTATION.md          # This file
```

Only `site/` is published. Development files (`package.json`, the lint config and the workflow) stay in the repository but are not deployed.

---

## 5. The static site

### `site/index.html`

A single page with three cards:

- **Pipeline**: lists the four stages (push → lint → package → deploy).
- **Click counter**: `+`, `−` and Reset buttons driven by JavaScript, which shows the JS was deployed and runs.
- **Build info**: shows when the page loaded, filled in by JavaScript.

### `site/css/style.css`

Colours are CSS custom properties (`--bg`, `--card`, `--text`, `--accent` and others), with a dark theme under `@media (prefers-color-scheme: dark)`. The layout is a centred 720px column with 16px side padding, so it also works on phones.

### `site/js/main.js`

```js
"use strict";

const countEl = document.getElementById("count");
let count = 0;

function render() {
  countEl.textContent = String(count);
}

document.getElementById("increment").addEventListener("click", () => {
  count += 1;
  render();
});

document.getElementById("decrement").addEventListener("click", () => {
  count -= 1;
  render();
});

document.getElementById("reset").addEventListener("click", () => {
  count = 0;
  render();
});

const loadedAt = new Date();
const timeEl = document.getElementById("loaded-at");
timeEl.dateTime = loadedAt.toISOString();
timeEl.textContent = loadedAt.toLocaleString();

render();
```

Line 4 (`let count = 0;`) is the line I broke on purpose in the test.

---

## 6. The GitHub Actions workflow

File: `.github/workflows/deploy.yml`

```yaml
name: Lint and Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  lint:
    name: Lint JavaScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Run ESLint
        run: npm run lint

  build:
    name: Package site
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site

  deploy:
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### How it works

| Part | Explanation |
| --- | --- |
| `on: push: branches: [main]` | Runs the pipeline automatically on every push to `main`. |
| `workflow_dispatch` | Also allows a manual run from the Actions tab. |
| `permissions` | `pages: write` and `id-token: write` let the workflow publish to Pages. `contents: read` lets it check out the code. |
| `concurrency: pages` | Stops two deployments from running at the same time. |
| **`lint` job** | Checks out the code, installs Node.js 22, installs the pinned dev dependencies with `npm ci`, then runs `npm run lint`. If ESLint reports any error it exits with code 1, and the job fails. |
| **`build` job** (Package site) | `needs: lint`, so it only runs if linting passed. `upload-pages-artifact` packages the `site/` folder into a tar archive that GitHub Pages can deploy. |
| **`deploy` job** | `needs: build`, so it only runs if packaging succeeded. `deploy-pages` publishes the artifact. The `github-pages` environment records the live URL. |

The `needs:` chain is what makes the linter a **gate**: if lint fails, GitHub marks `build` and `deploy` as **skipped**, and the site that is already live stays as it was.

---

## 7. The automated quality check (ESLint)

### `package.json`

```json
{
  "name": "quiz12",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "eslint site"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.5",
    "eslint": "^9.39.5",
    "globals": "^17.13.0"
  }
}
```

### `eslint.config.js`

```js
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["site/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: globals.browser,
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "error",
      "prefer-const": "error",
      eqeqeq: "error",
    },
  },
];
```

| Rule | What it enforces |
| --- | --- |
| `js.configs.recommended` | ESLint's recommended rules (undefined variables, unreachable code and others). |
| **`semi: ["error", "always"]`** | **Every statement must end with a semicolon. This is the rule broken in the test.** |
| `quotes: ["error", "double"]` | Strings use double quotes. |
| `no-unused-vars` | No variables that are declared but never used. |
| `prefer-const` | Use `const` for variables that are never reassigned. |
| `eqeqeq` | Use `===` / `!==` instead of `==` / `!=`. |

`globals.browser` tells ESLint that `document`, `window` and similar names exist, so they aren't flagged as undefined.

---

## 8. GitHub Pages setup

1. I created the repository as **public** (`gh repo create quiz12 --public`).
2. I enabled GitHub Pages with **Source: GitHub Actions** (`build_type=workflow`) instead of deploying from a branch. GitHub Pages then serves whatever the `deploy-pages` action uploads.
3. Live URL: **https://klydddd.github.io/quiz12/**

---

## 9. Testing the quality gate: breaking a JS rule

### Step 1: Baseline (everything passes)

Commit `a3a8400`, *Add static site with lint + GitHub Pages deploy workflow*, in [run 39710535288](https://github.com/klydddd/quiz12/actions/runs/39710535288):

| Job | Result |
| --- | --- |
| Lint JavaScript | ✅ success |
| Package site | ✅ success |
| Deploy to GitHub Pages | ✅ success |

The site went live at https://klydddd.github.io/quiz12/ and returned HTTP 200.

### Step 2: Break the rule (omit a semicolon)

Commit `7f1dc0c`, *Test: omit a semicolon to verify lint blocks deployment*, changed line 4 of `site/js/main.js`:

```diff
 const countEl = document.getElementById("count");
-let count = 0;
+let count = 0
```

This is still valid JavaScript (automatic semicolon insertion would let the browser run it), but it violates the project's `semi: always` rule. The quality gate should catch exactly this kind of style violation.

### Step 3: Observe the failure

[Run 39711267819](https://github.com/klydddd/quiz12/actions/runs/39711267819):

| Job | Result |
| --- | --- |
| Lint JavaScript | ❌ **failure** |
| Package site | ⏭️ **skipped** |
| Deploy to GitHub Pages | ⏭️ **skipped** |

Steps inside the lint job:

```
✓ Set up job
✓ Run actions/checkout@v4
✓ Run actions/setup-node@v4
✓ Run npm ci
X Run ESLint
```

ESLint output from the GitHub Actions log:

```
/home/runner/work/quiz12/quiz12/site/js/main.js
  4:14  error  Missing semicolon  semi

✖ 1 problem (1 error, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.

##[error]Process completed with exit code 1.
```

`4:14` means line 4, column 14, the spot right after `let count = 0` where the semicolon should be. Because the lint job failed, the package and deploy jobs never ran, and the live site **kept serving the last good version**.

### Step 4: Fix it

Commit `c9b6c6c`, *Fix: restore missing semicolon*:

```diff
-let count = 0
+let count = 0;
```

| Job | Result |
| --- | --- |
| Lint JavaScript | ✅ success |
| Package site | ✅ success |
| Deploy to GitHub Pages | ✅ success |

The site was redeployed and https://klydddd.github.io/quiz12/ returned HTTP 200 again.

### Result

The test shows that the linter runs **before** deployment and **blocks** any deployment that breaks a JS rule. Fixing the code and pushing again is enough to get the pipeline back to green.

---

## 10. Run history

Newest first:

| Commit | Message | Lint | Package | Deploy | Live site updated? |
| --- | --- | --- | --- | --- | --- |
| `c9b6c6c` | Fix: restore missing semicolon | ✅ | ✅ | ✅ | Yes |
| `7f1dc0c` | Test: omit a semicolon to verify lint blocks deployment | ❌ | ⏭️ skipped | ⏭️ skipped | **No (blocked)** |
| `a3a8400` | Add static site with lint + GitHub Pages deploy workflow | ✅ | ✅ | ✅ | Yes |

The full history is at https://github.com/klydddd/quiz12/actions.

---

## 11. How to reproduce

### Run the linter locally

```bash
git clone https://github.com/klydddd/quiz12.git
cd quiz12
npm ci
npm run lint          # no output = passes
```

### Break and fix the rule locally

```bash
# break it (macOS sed; on Linux use: sed -i ...)
sed -i '' 's/^let count = 0;$/let count = 0/' site/js/main.js
npm run lint          # → 4:14 error Missing semicolon semi (exit code 1)

# fix it
sed -i '' 's/^let count = 0$/let count = 0;/' site/js/main.js
npm run lint          # passes again
```

### Trigger the pipeline

Push any commit to `main` and open the **Actions** tab. A push with a lint error shows a red ❌ on *Lint JavaScript* and grey "skipped" on the other two jobs.

---

## 12. LLM prompts used

**LLM:** Claude (Claude Code CLI, model Claude Opus 5.5). These are all the prompts I gave, in order:

### Prompt 1: build the site, workflow and lint test (via `/goal`)

> create a static site (HTML/CSS/JS) hosted on GitHub Pages with a GitHub Actions workflow that automatically packages and publishes the site whenever you push to your GitHub repository (10 pts). Include an automated quality check by adding a JS linter step that runs before deployment and test it by breaking a JS rule such as omitting a required semicolon (10 pts).

What the LLM did: created the `site/` files, `eslint.config.js`, `package.json` and `.github/workflows/deploy.yml`. It checked locally that a missing semicolon fails lint, created the public repo, enabled Pages with GitHub Actions as the source, and pushed. Then it pushed the semicolon-breaking commit and the fix commit, and checked each workflow run.

### Prompt 2: hosting correction

> do not host it in klase.me. just put it in github pages

What the LLM did: found that my user-site repository had a custom domain (`klase.me`) that GitHub applied to every project site on my account. It explained the options and asked me which to take.

**My answer to the LLM's question:** *Remove klase.me domain*. The LLM then cleared the custom domain so the site is served from https://klydddd.github.io/quiz12/.

### Prompt 3: documentation request

> create a documentation showing you broke it

### Prompt 4: documentation format

> create a documentation showing you broke it. write it in DOCUMENTATION.md

What the LLM did: wrote a first version of this file covering the break-and-fix test.

### Prompt 5: full documentation

> write a full documentation with regards to this Software configuration management is often associated with version control, CI/CD, and DevOps. Using your preferred LLM to assist you, create a static site (HTML/CSS/JS) hosted on GitHub Pages with a GitHub Actions workflow that automatically packages and publishes the site whenever you push to your GitHub repository (10 pts). Include an automated quality check by adding a JS linter step that runs before deployment and test it by breaking a JS rule such as omitting a required semicolon (10 pts). Submit the link to your GitHub repository (make sure it is set to public) and share all of your LLM prompts here (5 pts).

What the LLM did: expanded this file into the full documentation you are reading.

---

## 13. Issues encountered

| Issue | Cause | Resolution |
| --- | --- | --- |
| The site URL was `klase.me/quiz12/` instead of `github.io` | My user-site repo (`klydddd.github.io`) had the custom domain `klase.me`. GitHub serves every project site on the account under the user site's custom domain, so `klydddd.github.io/quiz12` redirected (HTTP 301) to `klase.me/quiz12`. | Removed the custom domain from the user-site repo's Pages settings. The site is now served at https://klydddd.github.io/quiz12/. |
| The first lint job waited about 7 minutes | It sat in GitHub's queue waiting for a free runner. | No action needed; later runs started within seconds. |
| Warning: "Node.js 20 is deprecated" | `actions/checkout@v4`, `setup-node@v4` and the Pages actions target Node 20, which GitHub now runs on Node 24. | Only a warning; the pipeline works. It can be cleared later by upgrading the actions to newer major versions. |

---

## 14. Conclusion

The project meets all the requirements:

- **A static HTML/CSS/JS site** hosted on **GitHub Pages** at https://klydddd.github.io/quiz12/.
- **A GitHub Actions workflow** that packages and publishes the site automatically on every push to `main`.
- **An automated quality check (ESLint)** that runs **before** deployment. The test showed it works: omitting a semicolon failed the pipeline and blocked deployment, and restoring it let the deploy go through.
- **A public repository**: https://github.com/klydddd/quiz12
- **All LLM prompts** are listed in [Section 12](#12-llm-prompts-used).

From an SCM point of view, every change to the code, the quality rules and the delivery pipeline is versioned in Git, checked automatically, and released without manual steps. That combination of version control, CI/CD and DevOps is what this activity set out to practise.
