# Changelog

## 2026-05-22 23:22 - Preserve Hug Contents on Restore

- Changed: Restored frames now seed their saved dimensions before reapplying auto-layout sizing, then run a final layout pass after children are recreated so `Hug contents` can resolve against the full restored tree.
- Files: `src/code.ts`, `dist/code.js`
- Verified: `npm run build`, `npm exec tsc -- --noEmit`
- Notes: Figma may still calculate the final displayed size from children, padding, and min/max constraints, but restored Hug frames no longer start from the default `100px` frame size.
thêm