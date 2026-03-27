# Seastar V3 Split Source Layout

`assets/seastar-v3.js` is the runtime bundle.

For maintenance work, edit the files in this folder and rebuild the bundle with:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-seastar-v3.ps1
```

Source ownership by feature:

- `00-bootstrap-core.js`
  - app bootstrap
  - state model
  - DOM cache
  - common render helpers
  - import normalization helpers
- `10-routing-engine.js`
  - node graph build
  - shortest path logic
  - `CHECK_NODE` waypoint routing
  - route validation core
- `20-cable-dashboard.js`
  - cable list
  - top editor
  - save, duplicate, delete, force route
  - cable detail rendering
- `30-nodes-and-maps.js`
  - node tab
  - 2D map
  - 3D map
  - node tray width summaries
- `40-auth-project-foundation.js`
  - auth/session UI
  - login overlay
  - project payload structure
  - project load/save lifecycle
- `50-import-export-bom-reports-utils.js`
  - Excel import/export
  - BOM
  - diagnostics
  - reports
  - workbook helpers
- `60-auth-groupspace-final.js`
  - group approvals
  - admin flows
  - final event wiring
  - final render orchestration

Editing rules:

- Keep runtime behavior stable by preserving execution order.
- Add new functions to the closest feature file instead of the bundle.
- If a change touches multiple areas, update the feature file that owns the primary UI or data flow and rebuild.
- Treat `assets/seastar-v3.js` as generated output.
