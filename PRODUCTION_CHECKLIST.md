# Seastar CMS V3 Production Checklist

## Before Deployment

- Rotate every credential that has ever been shared in chat, commit history, screenshots, or local notes.
- Set a new `SESSION_SECRET` with a long random value and keep it only in the deployment secret store.
- Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_EMAIL` in the worker environment.
- Configure `GOOGLE_CLIENT_ID`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, and `NAVER_CALLBACK_URL`.
- Bind `AUTH_KV` or replace it with a durable production store before opening the service to users.
- Serve the app only over `https`.

## Authentication

- Keep `window.SEASTAR_ENABLE_DEMO_AUTH` disabled in production builds.
- Do not ship any real administrator password inside HTML, JavaScript, example config, or sample screenshots.
- Restrict local administrator login to the worker-backed flow only.
- Review Google and Naver redirect URLs against the exact production domain before go-live.
- Verify that pending social users cannot access the main workspace until an admin approves and assigns a group.

## Data And Access

- Confirm group spaces are stored in the backend and survive worker restarts.
- Back up uploaded project data, approval history, and group space content on a regular schedule.
- Verify that exported workbook data can be re-imported without losing `Nodes`, `ValidationDetails`, or `BOM`.
- Review access boundaries so non-admin users only see their assigned group space.

## Validation

- Run the sample `sch` and `node` workbook import test and confirm route validation still passes.
- Re-check the cable list against the original `sch` headers to confirm every required schedule field is visible.
- Confirm `TOTAL LENGTH = GRAPH_LENGTH + FROM_REST + TO_REST` for representative cables in each system.
- Verify BOM totals by `SYSTEM`, `TYPE`, and `DECK` after import and after manual edits.
- Test Google login, Naver login, admin approval, group assignment, logout, and session restore on the staging domain.

## Release Gate

- No browser console `ReferenceError` or `TypeError` on first load.
- No worker startup without `SESSION_SECRET`.
- No hardcoded production credentials in tracked files.
- No failed import/export roundtrip on the latest customer workbook set.
