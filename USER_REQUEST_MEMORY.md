# Seastar CMS V3 User Request Memory

This file keeps the active UX and delivery expectations for `v3` so later edits do not drift.

## Login screen

- Do not place any extra logo or text overlay on top of the background video.
- Show the whole video without zoom-cropping where possible.
- Use clean Korean copy with no mojibake or broken characters.
- Reflect the current project logo and video assets only when explicitly requested.

## Authentication

- Admin local login must work in production.
- Google and Naver login must be wired through the deployed auth worker.
- Social login users should create approval requests for the admin.
- Admin can approve and assign users into groups.

## Routing and data

- Cable list must expose all SCH title columns.
- Double-clicking a cable row must open full-field editing at the top dock.
- Save/recalc results must update project JSON and server project state.
- `CHECK_NODE` must force routing through the selected path.

## Mapping

- Node list and 3D map must stay matched.
- Double-clicking a node should focus it in the 3D view.
- Tray width must be auto-calculated from routed cable usage.
