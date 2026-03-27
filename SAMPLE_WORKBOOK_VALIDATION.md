# Sample Workbook Validation

Validation target:
- `C:\Users\FREE\Desktop\cabel_0310\35k sch.xlsx`
- `C:\Users\FREE\Desktop\cabel_0310\35k node.xlsx`

## Structure check
- `35k sch.xlsx`: `Sheet1`, 2,469 cable rows, 25 columns
- `35k node.xlsx`: `Sheet1`, 1,094 node rows, 10 columns
- V3 import now recognizes the sample headers directly:
  - Cable: `CABLE_SYSTEM`, `WD_PAGE`, `CABLE_NAME`, `CABLE_TYPE`, `FROM_*`, `TO_*`, `FROM_REST`, `TO_REST`, `CABLE_OUTDIA`, `CHECK_NODE`, `SUPPLY_DECK`, `POR_WEIGHT`, `INTERFERENCE`, `REMARK*`, `REVISION`, `CABLE_WEIGHT`
  - Node: `NODE_RNAME`, `STRUCTURE_NAME`, `COMPONENT`, `NODE_TYPE`, `RELATION`, `LINK_LENGTH`, `AREA_SIZE`, `POINT`

## Value validation result
- Normalized cables: 2,469
- Uploaded nodes: 1,094
- Uploaded nodes with parsed coordinates: 1,094 / 1,094
- Route generated: 2,469 / 2,469
- Map-ready routes: 2,469 / 2,469
- Validation summary: `PASS 2468 / WARN 1 / FAIL 0`

## Data quality findings
- Graph missing relation target: 0
- Graph asymmetric relation: 0
- Graph disconnected components: 16
- Blank cable system: 1
- Blank cable type: 0
- Blank from/to node: 0 / 0
- Declared original path rows: 0
- POR length populated rows: 0

Only remaining warning in the sample set:
- `B-CCTV-BC01`: `CABLE_SYSTEM` is blank in source data

## V3 fixes applied for this validation
- Added direct parsing for node `POINT` coordinates and map-ready midpoint extraction.
- Added direct support for cable `SUPPLY_DECK`, `WD_PAGE`, `POR_WEIGHT`, `INTERFERENCE`, `REMARK*`, `REVISION`, `CABLE_WEIGHT`.
- BOM deck grouping now uses `SUPPLY_DECK` first and falls back to prefix-based inference only when source deck is absent.
- Excel export now preserves the schedule-style sample headers in addition to V3 validation fields.
- BOM grouping now collapses blank system/type/deck values to `UNASSIGNED` instead of leaving empty buckets.

## Version comparison note
- `old/v0` and `old/v1` loaders did not natively use node `POINT` as the primary coordinate source, so this sample node workbook would not preserve full map coordinates as cleanly as V3.
- `v8/v9/v10` improved modularity and reporting, but V3 is the workspace version that now round-trips these exact sample workbook headers while keeping route validation and BOM grouping aligned.
