# Seastar CMS V3 Source Layout

The application now uses a two-layer structure:

1. Split maintenance source
   - `assets/src-js/*.js`
2. Runtime delivery bundle
   - `assets/seastar-v3.js`

This keeps browser delivery simple while making the codebase easier to maintain by feature.

## Why this layout

- The browser still loads one script file.
- Maintenance work happens in smaller feature files.
- Rebuild is deterministic because the bundle is generated in filename order.
- Existing HTML and deployment paths do not need to change.

## Feature map

- `assets/src-js/00-bootstrap-core.js`
  - constants
  - initial state
  - DOM references
  - base helpers
- `assets/src-js/10-routing-engine.js`
  - graph construction
  - path calculation
  - route validation
- `assets/src-js/20-cable-dashboard.js`
  - cable grid
  - top editor
  - cable actions
- `assets/src-js/30-nodes-and-maps.js`
  - node list
  - 2D/3D sync
  - tray width analysis
- `assets/src-js/40-auth-project-foundation.js`
  - auth boot
  - session state
  - project serialization
- `assets/src-js/50-import-export-bom-reports-utils.js`
  - workbook import/export
  - BOM tabs
  - diagnostics
  - reports
- `assets/src-js/60-auth-groupspace-final.js`
  - admin approval
  - group space
  - final UI bindings

## Update workflow

1. Edit the smallest relevant file in `assets/src-js`.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-seastar-v3.ps1
```

3. Re-check syntax on:
   - `assets/seastar-v3.js`
   - `backend/auth-worker.js`
4. Smoke test the changed UI flow.

## Maintenance note

The current split was created from the working monolith without changing execution order. That means some legacy duplication may still exist inside feature files. Clean-up should be done carefully and validated after each change so behavior does not regress.
