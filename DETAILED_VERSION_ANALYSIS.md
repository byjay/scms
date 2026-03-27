# SEASTAR CMS Version Analysis

## Summary

`v3` is now the consolidation baseline for this workspace.

It keeps the strongest production traits from earlier versions:

- `v0`: direct single-file portability and strong route-first workflow
- `v1`: sticky editing and companion 3D visualization ideas
- `v8`: deploy-friendly auth worker pattern and workbook-oriented delivery
- `v9`: broader operations scope such as reports, BOM pivot thinking, and history-driven workflows
- `v10`: leaner export-oriented packaging mindset

## Current v3 Direction

The goal is not to copy every old UI exactly.
The goal is to merge the best capabilities into one durable release line.

That means:

- exact route calculation with `GRAPH + FROM_REST + TO_REST`
- strict `CHECK_NODE` waypoint forcing
- triple validation: `Graph + Route + Map`
- sticky top editor for full SCH-field editing
- synchronized `2D / 3D` route and node views
- BOM grouped by `system / type / deck`
- reports for system health, tray hotspots, validation watchlist, and drum planning
- project save/load with workbook roundtrip
- Google / Naver / local admin auth shell
- admin approval and group spaces
- undo / redo snapshots for project-changing actions

## Version Comparison

| Version | Strong Points | Main Limits | What v3 keeps or replaces |
|---|---|---|---|
| `old/v0` | Portable, route-focused, simple | hardcoded BOM math, weak validation model | keeps portability mindset, replaces hardcoded logic with validated path-aware math |
| `old/v1` | stronger edit UX, richer visual layout | no real auth backend, no strict validation contract | keeps sticky editor and companion 3D ideas, replaces auth and routing rules |
| `v8 enterprise` | deploy-oriented worker split, modular BOM/export ideas | still weaker roundtrip and validation evidence | keeps worker-style backend pattern, upgrades workbook packaging |
| `v9 enterprise` | rich operations surface, reports, history, broader workflow | React app spread and migration overhead | pulls high-value operations ideas into a static deliverable |
| `v10 enterprise` | lean exports, newer stack direction | reduced feature surface | keeps the simplification mindset without losing workflow depth |

## Why v3 Is the Mainline

`v3` is the best fit for this workspace because it can stay:

- easier to deploy than the enterprise branches
- easier to hand over as one front-end package
- stricter on path verification than the old branches
- more complete operationally than the early single-file versions

## Upgrades Applied In This Build-Up

- Reports tab added
- Undo / redo project snapshot history added
- Reports workbook export added
- Project workbook extended with report sheets
- Version analysis document rewritten as a readable UTF-8 reference

## Recommended Next Steps

1. Push `v3` to GitHub and make it the only active deployment line.
2. Attach real Cloudflare auth secrets and KV/D1 bindings.
3. Run browser-side smoke tests for edit, force-route, reports, and social login.
4. Lock a release tag once `scms.seastar.work` serves the real build instead of fallback content.
