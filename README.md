# scms

Seastar CMS V3 production workspace.

## What is in this repo

- `seastar-cms-v3.html`
  - main application shell
- `assets/`
  - runtime JS, CSS, logo, video, embedded node data
- `assets/src-js/`
  - split maintenance sources by feature
- `backend/auth-worker.js`
  - Cloudflare Worker for auth, group approval, project save/load
- `tools/`
  - build helpers for regenerating the runtime bundle

## Local maintenance flow

Edit the split sources, then rebuild the runtime bundle:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-seastar-v3.ps1
```

Cross-platform build:

```bash
node ./tools/build-seastar-v3.js
```

## Cloudflare Worker deployment

This repo is prepared for:

- production worker: `scms.designssir.workers.dev`
- preview workers: `*-scms.designssir.workers.dev`

Static assets are served from the repo root through Wrangler assets, while API requests run through `backend/auth-worker.js`.

## Required Cloudflare secrets and vars

Set these in Cloudflare before enabling production auth:

- `SESSION_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `NAVER_CALLBACK_URL`
- `APP_REDIRECT_URL`

Optional but recommended:

- `AUTH_KV`
  - for persistent auth/group/project data storage

## GitHub Actions deployment

The workflow at `.github/workflows/deploy.yml` deploys on push to `main`.

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

If Cloudflare runtime secrets are not configured yet, deploy will still succeed but:

- local admin login stays disabled
- Google and Naver login stay disabled
- server persistence falls back to in-memory storage
