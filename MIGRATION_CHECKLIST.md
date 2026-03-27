# SEASTAR SCMS Migration Checklist
## Old (byjay/cable, React+TypeScript) --> New V0 (Vanilla JS, seastar-cms-v3)

Generated: 2026-03-27

---

## EXECUTIVE SUMMARY

The OLD version (React) is a full-featured application with ~29 components spanning admin consoles, calendars, pivot analysis, WD extraction, installation tracking, and history viewing. The NEW V0 is a single-HTML monolith (~7,500 lines bundled JS + 1,000 lines HTML) that consolidates the core engineering workflow (cable editing, routing, nodes, BOM, reports, auth) into a highly optimized vanilla JS application with zero framework overhead.

**V0 is STRONGER in:** Core engineering workflow (cable editor, routing engine with triple validation, tray engineering, 2D/3D maps, BOM with margin/POS, drum planning, diagnostics, IndexedDB auto-save, ship-level project isolation).

**OLD is STRONGER in:** Breadth of features (dedicated dashboard analytics, full admin console, user/permission management UI, calendar, pivot analysis, WD extraction, installation tracking, history viewer with restore UI, guest access, Recharts visualizations).

---

## COMPLETE FEATURE COMPARISON TABLE

| # | Feature | Old Component | V0 Equivalent | Status | Better Version | Migration Priority |
|---|---------|--------------|---------------|--------|---------------|-------------------|
| 1 | **Dashboard Overview** | `DashboardView.tsx` - KPI cards (completion %, weight, length, health alerts), tray occupancy bar chart, efficiency score | V0 status bar metrics (cables, nodes, routed, validation, graph issues) + `renderSummary()` in `20-cable-dashboard.js` | PARTIAL | OLD (richer analytics, charts, efficiency scoring) | MEDIUM |
| 2 | **Main Dashboard** | `Dashboard.tsx` - 6 stat cards, system/type/deck breakdown tables, donut chart, bar chart, routing error panel, DataVerification embed | V0 dashboard tab with cable grid, editor, filter bar, deck tree, detail cards | DIFFERENT | V0 (better for production cable editing workflow); OLD (better for analytics overview) | LOW - different purposes |
| 3 | **User Management (Basic)** | `UserManagement.tsx` - CRUD users, role assignment (USER/ADMIN/GUEST), ship access checkboxes, password management | V0 Group Space tab (`renderGroupSpace()`, `renderAdminRequestList()`) - group-based member list, approval queue for pending requests | PARTIAL | OLD (more granular user CRUD); V0 (better group-centric model for production) | MEDIUM |
| 4 | **Admin Console** | `CableAdminConsole.tsx` - System console with logs, storage inspector with localStorage viewer, role-based data isolation | V0 has NO equivalent admin console/debug panel | MISSING | OLD | LOW (dev tool, not production-critical) |
| 5 | **User Admin (Advanced)** | `CableUserManagement.tsx` - 5 roles (SUPER_ADMIN/ADMIN/MANAGER/USER/GUEST), status management (ACTIVE/PENDING/INACTIVE), ship access per vessel, searchable user table | V0 admin approval panel in Group Space tab - approve/reject requests, group assignment. Backend auth-worker.js handles roles (admin/vip/user) | PARTIAL | OLD (more roles, more granular control) | HIGH |
| 6 | **Permission Editor** | `CablePermissionEditor.tsx` - 5 modules x 4 permission types (View/Edit/Delete/Export) matrix, role-based toggles | V0 has `isAdminUser()`, `isVipUser()`, `isWorkspaceAllowed()` - simple 3-tier check (admin/vip/active) | PARTIAL | OLD (full permission matrix); V0 (simpler but sufficient for current needs) | MEDIUM |
| 7 | **Settings Panel** | `Settings.tsx` - Dark mode toggle, theme color selector (5 colors), auto-save/auto-route toggles, notification toggle, version info | V0 has NO dedicated settings panel; auto-route is hardcoded on load, drum length configurable in Reports tab | MISSING | OLD | LOW (nice-to-have, not blocking) |
| 8 | **Ship Selection** | `ShipSelectionModal.tsx` - Dual-mode (select existing / upload Excel), file upload with cable+node pair validation | V0 `shipSelectOverlay` in HTML - ship list from group, add new ship, ship change button, auto-restore from IndexedDB per ship | EQUIVALENT | V0 (better - IndexedDB auto-save/restore per ship, server integration) | DONE |
| 9 | **Permission Guard** | `PermissionGuard.tsx` - HOC wrapper checking role/superAdmin, fallback AccessDenied component | V0 `isWorkspaceAllowed()`, `isAdminUser()` checks in `applyAuthState()` - locks login overlay if not authorized | EQUIVALENT | EQUAL (different patterns, same outcome) | DONE |
| 10 | **Cable List** | `CableList.tsx` - Virtual scrolling, multi-select (shift/ctrl), dynamic columns from Excel, inline editing, detail panel, ROUTE ALL/SELECTED/LOAD/SAVE/EXPORT toolbar | V0 cable grid with virtual scrolling, deck tree filter, search, validation/system filters, inline editor, grid with configurable columns | EQUIVALENT | V0 (tighter integration with routing engine, better performance for large datasets) | DONE |
| 11 | **Cable Grouping** | `CableGroup.tsx` - Group by System/Type/Deck, search groups, cable preview per group, Excel export with grouping | V0 BOM tab with group-by selector (7 combinations: SYSTEM_TYPE_DECK, SYSTEM_TYPE, etc.), filters, margin %, POS generation | EQUIVALENT | V0 (more grouping options, margin calculation, POS generation) | DONE |
| 12 | **Node Manager** | `NodeManager.tsx` - CRUD nodes, deck filter, fill ratio color coding, cable count, area size, coordinates, import/export | V0 Nodes tab - full node list with search/sort (6 sort modes), tray engineering section, 2D/3D map, cable matching per node, connected nodes | EQUIVALENT | V0 (much richer - tray engineering, 2D/3D visualization, multi-tier analysis) | DONE |
| 13 | **Route Calculator** | `RouteCalculator.tsx` - FROM/TO dropdowns, checkpoint nodes, Dijkstra pathfinding, color-coded path display, copy-to-clipboard | V0 Routing tab - FROM/TO/CHECK NODE inputs, FROM_REST/TO_REST, preview route, 2D canvas + 3D scene, graph summary, triple validation | EQUIVALENT | V0 (much stronger - triple validation, REST length, 2D+3D visualization, graph issue detection) | DONE |
| 14 | **Route Management** | `RouteManagement.tsx` - Batch route calculation, check node editing, filtering by status, route clearing, clipboard copy | V0 toolbar: Route All button, per-cable save+recalc, force route via check nodes, batch validation, alternative routes display | EQUIVALENT | V0 (integrated into main workflow, alternative routes, force routing) | DONE |
| 15 | **BOM/Requirements Report** | `CableRequirementReport.tsx` - Cable type aggregation, 7 system categories, Excel export, PDF POS report, project metadata | V0 BOM tab - 7 group-by combinations, system/type/deck filters, search, margin %, POS generation, Excel export, deck rule display | EQUIVALENT | V0 (more flexible grouping, configurable margin, better filter options) | DONE |
| 16 | **Tray Fill Analysis** | `TrayFill.tsx` - Optimal sizing solver, manual width override, tier support (1-5), fill rate constraints, node filtering, canvas rendering, HTML report | V0 Nodes tab Tray Engineering - MAX H/FILL%/TIERS/WIDTH controls, recommended tray, save/clear override, tray matrix, canvas visualization, index list | EQUIVALENT | V0 (integrated into node workflow, persistent overrides, matrix visualization) | DONE |
| 17 | **Tray Analysis** | `TrayAnalysis.tsx` - Node-level fill analysis, deck filter, width presets (150-1200mm), quick fill, routing controls, cache system | V0 Tray Engineering in Nodes tab - same capabilities with cache, per-node focus, tier visualization | EQUIVALENT | V0 (consolidated, persistent overrides saved to project) | DONE |
| 18 | **Data Verification** | `DataVerification.tsx` - Cable/node counts, routed/unrouted tracking, mock data detection, metadata validation, health percentage, low data warnings | V0 Diagnostics tab - PASS/WARN/FAIL counts, graph issues, cable diagnostics with priority sorting, version comparison table | EQUIVALENT | V0 (triple validation is far more comprehensive - graph/route/map cross-check) | DONE |
| 19 | **Drum Schedule Report** | `DrumScheduleReport.tsx` - Group by route+type, drum allocation (500/1000m), capacity visualization, search, Excel export with 50-drum limit | V0 Reports tab drum planning - configurable drum length, drum count per type/system, last drum length, status indicators, Excel export | EQUIVALENT | V0 (integrated into unified reports tab, no display limit) | DONE |
| 20 | **Installation Status** | `InstallationStatusView.tsx` - Summary dashboard (total/installed/remaining), cable type analytics with stacked bar chart, pie chart, detailed metrics table with progress bars, CSV export | V0 has NO installation status tracking | MISSING | OLD | HIGH (important for production tracking) |
| 21 | **WD Extraction** | `WDExtractionView.tsx` - 3-step ship data importer (ship select, PDF upload+analyze, review+confirm), API-based backend extraction from engineering drawings | V0 has NO WD extraction feature | MISSING | OLD | MEDIUM (useful but requires backend API) |
| 22 | **History Viewer** | `HistoryViewer.tsx` - Snapshot list with timestamps, preview panel, restore to any point, delete entries, cable/node counts per snapshot | V0 has undo/redo (`restoreHistoryStep`) with status bar showing current position, but NO dedicated history viewer UI | PARTIAL | OLD (dedicated UI for browsing); V0 (history engine works, just no browse UI) | MEDIUM |
| 23 | **Pivot Analyzer** | `PivotAnalyzer.tsx` - Dynamic field selection, 5 aggregation functions (COUNT/SUM/AVG/MIN/MAX), bar/pie charts, sortable data grid, grand total | V0 has NO pivot analysis feature | MISSING | OLD | LOW (analytics feature, not core workflow) |
| 24 | **Cable Type Manager** | `CableTypeManager.tsx` - Search/filter panel, 9 editable fields (CODE/ABBR/WEIGHT/OD/etc.), scrollable data table, detail view | V0 Cable Type tab - search, virtual scroll grid with 380+ cable types, read-only lookup from built-in `CABLE_TYPE_DB` | EQUIVALENT | V0 (much larger built-in database, 380+ types vs. user-managed) | DONE |
| 25 | **Calendar/Scheduling** | `GlassCalendar.tsx` - Month/Week/Day views, event management (create/search/display), glass-morphism UI, date-fns based | V0 has NO calendar/scheduling | MISSING | OLD | LOW (not core SCMS functionality) |
| 26 | **Auth Service** | `authService.ts` - localStorage user CRUD, plain-text password, `isAdmin()`/`canAccessShip()`, 2 default accounts | V0 `auth-worker.js` (Cloudflare Worker) - session cookies, Google OAuth, Naver OAuth, local admin, VIP login, KV store, group management | EQUIVALENT | V0 (production-grade - OAuth providers, server-side sessions, KV storage, proper security) | DONE |
| 27 | **Routing Service** | `routingService.ts` - Dijkstra with penalty weights, checkpoint support, graph construction from relations | V0 `10-routing-engine.js` - Dijkstra with A* optimization, check node routing, alternative routes, triple validation (graph/route/map), route cache | EQUIVALENT | V0 (significantly more advanced - triple validation, alternative routes, caching) | DONE |
| 28 | **Excel Service** | `excelService.ts` - Import/export via XLSX, cable/node column mapping, file type detection, coordinate parsing | V0 `50-import-export-bom-reports-utils.js` - Multi-sheet workbook parsing (Cables/Nodes/Meta/NodeTray), comprehensive Excel export with BOM/Reports/Drums, JSON export | EQUIVALENT | V0 (more comprehensive - multi-sheet import, richer export) | DONE |
| 29 | **Auth Context (Roles)** | `CableAuthContext.tsx` - Session with 5-min timeout, Super Admin/User/Guest roles, Google OAuth auto-profile, ship registration, Firebase integration | V0 `60-auth-groupspace-final.js` + `auth-worker.js` - admin/vip/user/pending roles, Google/Naver OAuth, group-based access, Cloudflare Workers, 8-hour session | EQUIVALENT | V0 (production architecture - Cloudflare Workers, proper session management, group spaces) | DONE |

---

## MISSING FEATURES - PRIORITIZED MIGRATION LIST

### HIGH PRIORITY (Should port to V0)

| # | Feature | Old Source | Effort Estimate | Notes |
|---|---------|-----------|-----------------|-------|
| 1 | **Installation Status Tracking** | `InstallationStatusView.tsx` | MEDIUM (2-3 days) | Add new tab or sub-panel in Reports. Need: installed/remaining counts, progress bars per cable type, CSV export. V0 cable objects need `status` and `installDate` fields. |
| 2 | **Advanced User Management UI** | `CableUserManagement.tsx` | MEDIUM (2-3 days) | Enhance V0's Group Space admin panel with: user table with all columns, role dropdown (expand beyond admin/vip/user), status management, ship access control per user. Backend auth-worker already supports most of this. |
| 3 | **Guest Access Mode** | `CableAuthContext.tsx` | LOW (1 day) | Add read-only guest login to V0. Auth-worker needs a guest role; frontend needs `isGuestUser()` check to disable edit/save/delete buttons. Useful for clients reviewing data. |

### MEDIUM PRIORITY (Nice to have, port when time permits)

| # | Feature | Old Source | Effort Estimate | Notes |
|---|---------|-----------|-----------------|-------|
| 4 | **Dashboard Analytics Overview** | `DashboardView.tsx` + `Dashboard.tsx` | MEDIUM (2-3 days) | Add a dashboard overview sub-panel with: completion %, total weight/length, system/type/deck breakdown tables, health score. V0 has the data; just needs a summary view. |
| 5 | **History Viewer UI** | `HistoryViewer.tsx` | LOW (1-2 days) | V0's history engine already works (undo/redo with snapshots). Just needs a browseable list UI showing timestamps, reasons, cable/node counts, with restore buttons. |
| 6 | **Permission Matrix Editor** | `CablePermissionEditor.tsx` | LOW-MEDIUM (1-2 days) | V0's simple 3-tier system works but a visual matrix would help admins. Module-level View/Edit/Delete/Export toggles per role. |
| 7 | **WD Extraction** | `WDExtractionView.tsx` | HIGH (3-5 days) | Requires backend API for PDF parsing. The frontend wizard (ship select, upload, review) is straightforward, but the extraction backend is the hard part. |

### LOW PRIORITY (Port only if specifically requested)

| # | Feature | Old Source | Effort Estimate | Notes |
|---|---------|-----------|-----------------|-------|
| 8 | **Admin Console (Debug)** | `CableAdminConsole.tsx` | LOW (1 day) | System logs viewer + localStorage inspector. Useful for debugging but not user-facing. Could add to Diagnostics tab. |
| 9 | **Settings Panel** | `Settings.tsx` | LOW (0.5-1 day) | Theme color selection, auto-save toggle, notification toggle. V0 hardcodes most of these; a settings panel would be polish. |
| 10 | **Pivot Analyzer** | `PivotAnalyzer.tsx` | MEDIUM (2 days) | Dynamic field/aggregation selection with charts. Powerful analytics but not core workflow. Consider as future "analytics" tab. |
| 11 | **Calendar/Scheduling** | `GlassCalendar.tsx` | MEDIUM (2-3 days) | Glass-morphism calendar with events. Not core SCMS functionality; would be a project management add-on. |

---

## LOGIN UI COMPARISON

| Aspect | Old (React) | V0 (Vanilla) | Winner |
|--------|------------|--------------|--------|
| Visual Style | Dark glassmorphic with Tailwind | Video background + split-panel login card | V0 |
| Login Methods | Email/Password + Google OAuth + Firebase | Email/Password + Google GIS + Naver OAuth | V0 (more providers) |
| Guest Access | Auto-creates temp profile for Google users | Not implemented | OLD |
| Session | 5-minute timeout, localStorage | 8-hour cookie session, KV store | V0 (production-grade) |
| Post-Login | Direct to dashboard | Ship selection modal -> workspace | V0 (ship-first workflow) |
| **Overall** | Good demo-quality | **Production-ready** | **V0** |

---

## FEATURES WHERE V0 IS CLEARLY SUPERIOR

1. **Triple Validation Engine** - Graph + Route + Map cross-check (OLD has basic DataVerification only)
2. **Tray Engineering** - Multi-tier analysis with matrix visualization, persistent overrides (OLD has solver but less integrated)
3. **2D + 3D Map Visualization** - Integrated into routing and node tabs with Three.js (OLD has separate 3D viewer)
4. **Ship-Level Project Isolation** - IndexedDB auto-save/restore per ship (OLD uses flat localStorage)
5. **Server Project Persistence** - Cloudflare KV-backed group project storage (OLD is client-side only)
6. **Alternative Route Display** - Shows multiple route options with comparison (OLD has single route only)
7. **Deck Tree Navigation** - Hierarchical deck-based cable filtering in dashboard (OLD uses flat filters)
8. **Built-in Cable Type Database** - 380+ pre-loaded types with specs (OLD requires user-managed types)
9. **Unified Reports Tab** - System health, type summary, tray hotspots, validation watch, drum planning, upgrade guide in one view (OLD has separate components)
10. **Auth Architecture** - Cloudflare Workers with Google/Naver OAuth, cookie sessions, KV store (OLD uses Firebase + localStorage)

---

## RECOMMENDED MIGRATION ORDER

### Phase 1: Critical Production Features (Week 1-2)
1. [HIGH] Installation Status Tracking - new sub-panel in Reports or new tab
2. [HIGH] Guest Access Mode - add guest role to auth-worker + read-only UI mode
3. [HIGH] Enhanced User Management - upgrade Group Space admin panel

### Phase 2: UX Enhancements (Week 3-4)
4. [MEDIUM] Dashboard Analytics Overview - summary panel with KPIs and charts
5. [MEDIUM] History Viewer UI - browseable snapshot list with restore
6. [MEDIUM] Permission Matrix Editor - visual role-module permission grid

### Phase 3: Extended Features (Week 5+)
7. [MEDIUM] WD Extraction - requires backend API development
8. [LOW] Settings Panel
9. [LOW] Admin Debug Console
10. [LOW] Pivot Analyzer
11. [LOW] Calendar/Scheduling

---

## KEY FILES REFERENCE

### V0 Source Files
- `E:\code-project\calble\SCMS_V0\seastar-cms-v3.html` - Main HTML (1003 lines, all UI structure)
- `E:\code-project\calble\SCMS_V0\assets\src-js\00-bootstrap-core.js` - State, aliases, DOM refs, init (831 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\05-cable-type-db.js` - 380+ cable types (380 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\10-routing-engine.js` - Dijkstra, graph, validation (805 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\20-cable-dashboard.js` - Grid, editor, cable type tab (837 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\30-nodes-and-maps.js` - Nodes, tray, 2D/3D maps (1689 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\40-auth-project-foundation.js` - IndexedDB, ship select, project I/O (556 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\50-import-export-bom-reports-utils.js` - Excel, BOM, reports, history (1479 lines)
- `E:\code-project\calble\SCMS_V0\assets\src-js\60-auth-groupspace-final.js` - Auth, group space, renderAll (969 lines)
- `E:\code-project\calble\SCMS_V0\backend\auth-worker.js` - Cloudflare Worker auth backend
- `E:\code-project\calble\SCMS_V0\assets\seastar-v3.js` - Bundled output (7579 lines, auto-generated)

### Old Source (GitHub)
- `https://github.com/byjay/cable/tree/main/components/` - All 29 React components
- `https://github.com/byjay/cable/tree/main/services/` - Auth, routing, Excel services
- `https://github.com/byjay/cable/tree/main/contexts/` - Auth context with roles
