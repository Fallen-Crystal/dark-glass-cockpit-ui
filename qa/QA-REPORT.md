# QA Report

## Result

**PASS** for the generic sponsor-access reference demo.

## Browser harness

- Browser: system Chromium
- Executable: `/usr/lib/chromium/chromium`
- Mode: headless
- Viewport: 1600 × 1000
- Renderer harness: Playwright
- The environment blocks direct `file://` and localhost navigation inside Chromium, so the exact final HTML was loaded with `page.set_content(...)`.
- An in-memory `localStorage` shim was injected only for the QA harness because opaque `about:blank` origins otherwise deny localStorage access. It is **not** included in the shipped demo.

## Verified

- Particle Core startup screen renders.
- Startup → background transition completes.
- Main dashboard renders without page or console errors.
- 12 acrylic 3D cards are created and selectable.
- Focus/details update after card selection.
- Fluid, Acrylic 3D, Theme and Particle settings panels all open.
- Four fluid canvases have non-zero render dimensions.
- In this headless environment WebGL context creation is unavailable, therefore all four fluid cards correctly entered the built-in CSS fallback path. This validates degradation behavior; GPU WebGL output itself was not directly validated in this headless environment.
- Screenshots were generated and visually reviewed.

## Screenshots

- `assets/qa-intro.png`
- `assets/qa-dashboard.png`
- `assets/qa-fluid-settings.png`

## Visual review notes

The first browser pass exposed two generic-demo presentation issues: a truncated brand title and a partially clipped floating progress card. The brand copy was shortened and the progress-card X offset was increased before the final QA pass.
