# Browser Visual QA Guide

Do not declare visual acceptance from source inspection alone when browser execution is available.

## Recommended Chromium launch

```js
const browser = await chromium.launch({
  executablePath: "/usr/lib/chromium/chromium",
  headless: true
});
```

## Acceptance pass

Use at least a desktop viewport such as 1600×1000.

1. Load the real HTML through a local HTTP server.
2. Capture console/page errors.
3. Screenshot particle intro.
4. Enter the dashboard.
5. Confirm four fluid canvases have non-zero size.
6. Drag the 3D orbit and confirm cards move.
7. Click a 3D card and confirm detail/progress update.
8. Open Fluid settings and change a range.
9. Open Theme settings and switch a preset.
10. Open 3D Card settings and modify orbit/card size.
11. Open Particle settings and confirm live control.
12. Capture final dashboard/settings screenshots.
13. Test `prefers-reduced-motion: reduce` when practical.
14. Search generated source for forbidden personal/domain strings before release.

## Fail conditions

- console exceptions during normal interaction;
- WebGL failure with no fallback;
- invisible/blank fluid cards;
- settings panel trapped offscreen;
- bright full-screen glow reducing readability;
- 3D cards cannot be selected after drag;
- particle intro blocks dashboard after enter;
- user-specific names, paths or business data remain in reusable package.
