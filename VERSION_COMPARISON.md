# Seastar CMS Version Comparison

| Version | Strengths | Gaps | What V3 Keeps or Fixes |
| --- | --- | --- | --- |
| `old/v0` | Strong 2D routing, deck prefix mapping, early BOM and project export ideas | Hardcoded BOM extra length, weak workbook roundtrip, limited validation contract | V3 keeps 2D routing and deck mapping ideas, replaces BOM math with validated route totals and adds workbook roundtrip |
| `old/v1` | Sticky editing, richer 3D helper view, wider tab structure | Still monolithic, local-only login shell, no real OAuth | V3 keeps sticky editing and 3D helper ideas, adds Google/Naver/local auth worker flow |
| `v8 enterprise` | Modular BOM page and export service separation | BOM still generic and not tied to a single-file deliverable | V3 pulls the BOM page concepts into a portable single HTML build with route-aware totals |
| `v9 enterprise` | Full app composition with auth, overview, reports, BOM pivot, project save/load | JSON-heavy project restore, no workbook-first roundtrip package | V3 simplifies this into one front-end plus one auth worker and adds workbook import/export |
| `v10 enterprise` | Multi-sheet Excel export with BOM pivot and JSON export service | Export is report-oriented, not a full validation evidence package | V3 exports project meta, cables, nodes, graph nodes, validation details, BOM, and version comparison sheets |
| `v3 current` | Sticky 3-row editor, triple validation, 2D/3D sync, OAuth-ready login, workbook roundtrip, BOM by system/type/deck | Live social sign-in still needs deployment secrets | This is the consolidated baseline for the current workspace |

## Notes

- Deck grouping in V3 follows the legacy prefix rules from `v0` and `v1`: `SF`, `TW`, `PA`, `PR`, `BC`, `TO`.
- When prefix matching is missing, V3 falls back to `ROOM`, `STRUCTURE`, and node-name text inspection.
- BOM totals in V3 use validated route totals and `FROM_REST + TO_REST`, not hardcoded connection extras.
