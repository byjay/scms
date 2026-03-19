# Seastar CMS Function Verification Audit

Date: 2026-03-19
Workspace: `C:\Users\FREE\Desktop\cabel_0310`
Target: `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3`

## Executive Summary

- `v3` is the strongest routing and validation baseline in this workspace.
- `v3` is not yet the strongest node fill / tray engineering version.
- The missing gap is not the route engine. The gap is the old `tray-fill` / `v8` / `v9` class features:
  - area-based fill
  - tray cross-section drawing
  - fill-driven tray recommendation matrix
  - tray width override/edit/persist flow
- `git push` can auto-run build, but live deploy is still conditional on Cloudflare secrets and runtime configuration.

## Version Verdict

### Best by area

- Routing + validation: `seastar-cms-v3`
- Node fill / tray engineering: `old/tray-fill`, `seastar-cms-v8-enterprise`, `seastar-cms-v9-enterprise`
- Monolithic all-in-one legacy reference: `old/seastar-cms-v1.html`
- Weak later regression: `seastar-cms-v10-enterprise`

### Why `v3` wins on routing

- Canonical cable/node normalization:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\seastar-v3.js:732`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\seastar-v3.js:759`
- Missing targets are reported, not patched with fake nodes:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:163`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:185`
- `CHECK_NODE` waypoint routing and exact `FROM_REST + GRAPH + TO_REST` handling:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:295`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:322`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:355`
- Triple validation:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:438`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:545`

## Current `v3` Completion Status

### Completed well

- Cable import, node import, workbook roundtrip
- Weighted routing with Dijkstra
- `CHECK_NODE` ordered routing
- `FROM_REST` / `TO_REST` total length reflection
- Graph / route / map validation
- Sticky cable editor
- 2D route map
- 3D route companion
- Node list with routed cable aggregation
- BOM by system / type / deck
- Reports tab
- Server project save/load hooks

### Partially complete

- Node list analytics
  - Present, but based on `sum(CABLE_OUTDIA)` instead of cable area
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:63`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:75`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:135`
- Node 3D synchronization
  - List -> 2D/3D focus works
  - Interactive 3D control shell is weaker than old versions
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:22`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:257`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:405`

### Missing or weaker than older versions

- Sum of cable cross-sectional area per node
- True fill-based node list ordering
- Tray cross-section drawing for selected node
- Fill optimization matrix and clickable recommendation cells
- Tray width manual override/edit/apply flow
- Tray width persistence inside project JSON/server save
- Map-click to route/node selection parity from older 3D/Viz pages

## Critical Gaps

### 1. Node fill is not area-based yet

Current `v3` uses total outer diameter sum and width heuristics:

- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:75`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\30-nodes-and-maps.js:135`

This is weaker than:

- `C:\Users\FREE\Desktop\cabel_0310\old\seastar-cms-v0.html:2610`
- `C:\Users\FREE\Desktop\cabel_0310\old\seastar-cms-v1.html:2703`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\services\solver.ts:182`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v10-enterprise\src\services\analysis.ts:13`

### 2. Node panel does not have tray picture/layout

Current `v3` node panel shows:

- node list
- summary
- matched cables
- connected nodes
- 2D node map
- 3D node focus

It does not show tray packing visualization:

- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\seastar-cms-v3.html:595`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\seastar-cms-v3.html:605`

Better references:

- `C:\Users\FREE\Desktop\cabel_0310\old\seastar-cms-v0.html:1894`
- `C:\Users\FREE\Desktop\cabel_0310\old\seastar-cms-v1.html:1848`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\components\TrayVisualizer.tsx:171`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\components\TrayVisualizer.tsx:241`

### 3. Tray width override is not persisted

Current `v3` project payload persists cables, nodes, reports, and project metadata, but not a node tray override table:

- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\seastar-v3.js:3109`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\seastar-v3.js:3124`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\seastar-v3.js:3194`

Older tray engineering references have manual width/edit logic:

- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\App.tsx:102`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\App.tsx:133`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\App.tsx:597`

### 4. Routing still has a few correctness edge cases

- Uploaded node sheet cannot fully clear embedded relations if uploaded `relations` is blank:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:137`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:142`
- `parseNodeList()` dedupes repeated `CHECK_NODE`, so repeated loops cannot be expressed:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\50-import-export-bom-reports-utils.js:1126`
- Graph issue totals exclude coordinate-missing counts:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:167`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\assets\src-js\10-routing-engine.js:584`

## Older Code That Should Be Integrated Next

### Primary source to absorb

- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\services\solver.ts`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\components\TrayVisualizer.tsx`
- `C:\Users\FREE\Desktop\cabel_0310\old\tray-fill\App.tsx`

### Why

- Uses area-based fill:
  - `totalCableArea = sum(pi * (od/2)^2)`
- Has optimization matrix:
  - widths x tiers
- Has clickable recommendation:
  - `onMatrixCellClick`
- Has exportable tray report
- Has manual width control
- Has real tray packing drawing

### Secondary source to absorb

- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v8-enterprise\webapp\src\pages\TrayFill.tsx`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v8-enterprise\webapp\src\components\TrayVisualizer.tsx`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v9-enterprise\webapp\src\pages\TrayFill.tsx`
- `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v9-enterprise\webapp\src\components\TrayVisualizer.tsx`

## Deployment Automation Check

### What is true

- Push to `main` triggers GitHub Actions:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\.github\workflows\deploy.yml:3`
- Bundle rebuild and validation are automatic in CI:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\.github\workflows\deploy.yml:25`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\.github\workflows\deploy.yml:28`

### What is not guaranteed

- Actual deploy only occurs when repo secrets exist:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\.github\workflows\deploy.yml:31`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\.github\workflows\deploy.yml:40`
- Working auth still depends on runtime Worker secrets outside the workflow:
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\README.md:41`
  - `C:\Users\FREE\Desktop\cabel_0310\seastar-cms-v3\PRODUCTION_CHECKLIST.md:5`

## Final Judgment

`v3` is not a failed base. It is the best routing base in the folder.

But the user is correct that it is still incomplete relative to the strongest older node/tray workflows.

The next must-do integration is:

1. Replace node analytics from `sum(outDia)` to `sum(area)`
2. Add tray fill solver and tray cross-section view to the Nodes tab
3. Make node click open fill/tray simulation immediately
4. Add manual tray width override and persist it in project save/load
5. Keep `v3` routing engine and validation as the core baseline
