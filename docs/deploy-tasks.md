# Production Deployment Tasks
> **For Claude Code:** Work through these tasks top to bottom. Complete each checklist item before moving to the next section. If a step fails, stop and report the error rather than continuing.

---

## TASK 1 — GitHub Repository Hygiene

**Goal:** Ensure the repo is clean and safe to deploy publicly.

### Steps

- [ ] Check if `.env` or `.env.local` is tracked by git:
  ```bash
  git ls-files | grep -E "^\.env"
  ```
  If any `.env*` files appear in the output, remove them from tracking:
  ```bash
  git rm --cached .env .env.local 2>/dev/null || true
  ```

- [ ] Verify `.gitignore` contains the right entries. Open `.gitignore` and confirm these lines exist — add them if missing:
  ```
  .env
  .env.local
  .env*.local
  node_modules/
  .next/
  ```

- [ ] Verify `node_modules` is not committed:
  ```bash
  git ls-files | grep node_modules | head -5
  ```
  Expected output: nothing. If files appear, run `git rm -r --cached node_modules/`.

- [ ] Confirm the project builds locally:
  ```bash
  npm ci && npm run build
  ```
  Expected: build completes without errors.

- [ ] Stage and push a clean commit:
  ```bash
  git add .gitignore
  git commit -m "chore: ensure .env and node_modules are gitignored" --allow-empty
  git push origin main
  ```

### ✅ Done when
- `git ls-files | grep -E "^\.env"` returns nothing
- `git ls-files | grep node_modules` returns nothing
- `npm run build` succeeds locally

---

## TASK 2 — GitHub Actions CI/CD Workflow

**Goal:** Automatically run build + lint on every Pull Request so broken code can't be merged.

### Steps

- [ ] Create the workflow directory:
  ```bash
  mkdir -p .github/workflows
  ```

- [ ] Create the workflow file `.github/workflows/ci.yml` with this exact content:

  ```yaml
  name: CI

  on:
    pull_request:
      branches: [main]

  jobs:
    build-test:
      runs-on: ubuntu-latest

      steps:
        - name: Checkout code
          uses: actions/checkout@v4

        - name: Set up Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build
          run: npm run build
          env:
            NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
  ```

- [ ] Commit and push the workflow:
  ```bash
  git add .github/workflows/ci.yml
  git commit -m "ci: add GitHub Actions build + test workflow on PRs"
  git push origin main
  ```

- [ ] Add GitHub Actions Secrets so the build can access Supabase env vars:
  - Go to your GitHub repo → **Settings → Secrets and variables → Actions**
  - Add secret: `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
  - Add secret: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → your Supabase publishable key

- [ ] Test the workflow: create a test branch, open a Pull Request against `main`, and verify the "CI" check runs and passes in the GitHub Actions tab.

### ✅ Done when
- `.github/workflows/ci.yml` exists in the repo
- Opening a PR triggers the `build-test` job automatically
- A build error in a PR causes the check to fail (merge is blocked)

---

## TASK 3 — Health Check Endpoint

**Goal:** Give Vercel (and future monitoring tools) a URL to ping to confirm the app is alive.

### Steps

- [ ] Create the health check API route. In Next.js App Router, create this file:
  `app/api/health/route.ts`

  ```ts
  import { NextResponse } from 'next/server'

  export async function GET() {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
      },
      { status: 200 }
    )
  }
  ```

  > **If you use Pages Router** (i.e. your project has `pages/` not `app/`), create `pages/api/health.ts` instead:
  > ```ts
  > import type { NextApiRequest, NextApiResponse } from 'next'
  > export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  >   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
  > }
  > ```

- [ ] Test it locally:
  ```bash
  npm run dev &
  sleep 3
  curl http://localhost:3000/api/health
  ```
  Expected output: `{"status":"ok","timestamp":"...","env":"development"}`

- [ ] Commit and push:
  ```bash
  git add app/api/health/route.ts   # or pages/api/health.ts
  git commit -m "feat: add /api/health endpoint for monitoring"
  git push origin main
  ```

### ✅ Done when
- `GET /api/health` returns `{ status: 'ok' }` with HTTP 200 locally

---

## TASK 4 — Vercel Deployment

**Goal:** Deploy the app to Vercel with environment variables configured.

> **Claude Code cannot do this step — it requires browser interaction.**
> Hand this back to the human to complete steps 4a–4d, then return for step 4e.

### Step 4a — Human: Deploy to Vercel (do this in your browser)

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **Add New → Project**
3. Import your GitHub repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key
5. Click **Deploy**
6. Copy the **Preview URL** and **Production URL** once deployment completes

### Step 4b — Note your URLs here (fill in and save)
```
Preview URL:    https://____________________________
Production URL: https://____________________________
```

### Step 4c — Claude Code: Verify the deployment is live

Once the human provides the production URL, run:
```bash
PROD_URL="https://your-app.vercel.app"   # ← replace with real URL
curl "$PROD_URL/api/health"
```
Expected: `{"status":"ok","timestamp":"...","env":"production"}`

### ✅ Done when
- Production URL responds to `/api/health` with HTTP 200
- Vercel dashboard shows deployment as **Ready**

---

## TASK 5 — Deliverable Summary

**Goal:** Compile everything needed for the board submission.

- [ ] Verify the final checklist:

  | Item | Status |
  |------|--------|
  | `.env` not in git | ☐ |
  | `node_modules` not in git | ☐ |
  | `npm run build` passes locally | ☐ |
  | `.github/workflows/ci.yml` exists | ☐ |
  | CI triggers on PRs | ☐ |
  | `/api/health` endpoint returns 200 | ☐ |
  | App deployed to Vercel | ☐ |
  | Production `/api/health` returns 200 | ☐ |

- [ ] Output the board answers by running:
  ```bash
  echo "=== BOARD ANSWERS ==="
  echo ""
  echo "Preview URL: (paste from Vercel)"
  echo "Production URL: (paste from Vercel)"
  echo ""
  echo "CI/CD Workflow Snippet:"
  cat .github/workflows/ci.yml
  echo ""
  echo "What triggers this? → Every pull request against main"
  echo "What fails the pipeline? → Build errors (npm run build fails) stop the merge"
  echo "CI/CD = Automated build & test on each PR before merge — a quality gate"
  ```

---

## Reference: What Each Piece Does

| File | Purpose |
|------|---------|
| `.gitignore` | Keeps secrets and build artifacts out of git |
| `.github/workflows/ci.yml` | Runs build on every PR — blocks broken code from merging |
| `app/api/health/route.ts` | Gives Vercel and monitors a URL to confirm app is alive |
| Vercel environment variables | Injects secrets into the production build safely |

---

*Generated by Claude.ai — work through tasks 1 → 3 → 4 → 5 in order.*
