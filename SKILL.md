---
name: dark-glass-cockpit-ui
description: >
  Build configurable immersive web dashboards using restrained dark-glass materials,
  WebGL fluid metric cards, acrylic 3D card stacks/orbits, synchronized breathing motion,
  particle-core environments, configurable theme/material tokens, local persistence,
  graceful fallbacks, and visual QA. Use for dashboards, admin panels, control centers,
  analytics surfaces, knowledge/productivity interfaces, monitoring views, or other
  information-dense desktop web applications that benefit from a cinematic but usable UI.
license: Personal Non-Commercial Sponsor Access License v1.0
---

# Dark Glass Cockpit UI

## License and Usage Boundary

This Skill is provided under the **Personal Non-Commercial Sponsor Access License v1.0**. Access obtained through sponsorship/appreciation permits only personal study, research, modification, and personal non-commercial projects. **Company or organizational use, client work, commercial products, paid services, and any direct or indirect commercial use are not included. Redistribution, resale, public upload, and sharing are also prohibited.**

Commercial use requires separate prior written authorization from the copyright holder. See `LICENSE` and `LICENSE.zh-CN.md` for the full terms.

“Sponsor Access / 赞赏开源” describes the distribution model and does not mean the project uses an OSI-approved open-source license.


## 1. Purpose

This skill defines a reusable visual and interaction system for immersive web dashboards.
It is domain-agnostic: preserve the host application's information architecture, data model,
and business behavior unless the user explicitly asks to change them.

The skill contains six coordinated layers:

1. **Base dashboard system** — layout, typography, density, hierarchy, controls, tables.
2. **Glass material system** — dark translucent planes, haze, backdrop blur, acrylic rims.
3. **Fluid Glass** — WebGL metric cards with pointer disturbance and CSS fallback.
4. **Acrylic 3D** — stack/orbit cards with drag, inertia, focus, cruise and material controls.
5. **Breathing Motion** — one synchronized animation clock for panels, fields, data, fluid cards and particles.
6. **Particle Core** — optional startup/background particle sphere with configurable palette and performance.

## 2. Core rule: do not enable everything automatically

The visual system is modular. Use the minimum set of optional systems that improves the user's task.

### Always available

- dark/near-black background
- restrained glass panels
- typography and spacing hierarchy
- theme tokens
- dense dashboard components
- responsive and reduced-motion behavior
- local configuration persistence when appropriate

### Enable Fluid Glass when

- the interface contains hero metrics, KPI cards, status summaries, or animated data surfaces;
- the user requests fluid/liquid/glass motion;
- animated material adds hierarchy rather than decoration-only noise.

### Enable Acrylic 3D when

- users browse a collection: projects, documents, categories, assets, media, datasets, workspaces;
- spatial selection improves discovery;
- the user explicitly requests stack/orbit/carousel/3D-card navigation.

### Enable Breathing Motion when

- the user requests an ambient, living, synchronized or breathing interface;
- motion must coordinate multiple panels or data groups;
- the experience is presentation-forward while remaining readable.

### Enable Particle Core when

- a startup/splash state is requested;
- a deep-space ambient background is requested;
- the user wants a cinematic entry or persistent particle environment.

Never add optional systems merely because this skill contains them.

## 3. Non-goals

Do not invent or couple this skill to:

- a specific note-taking product or data source;
- scanning/indexing pipelines;
- reading-state workflows;
- personal directory structures;
- personal names, handles, brands, paths or account data;
- fixed demo counts or domain-specific business copy.

Demo content must remain generic and replaceable.

## 4. Visual language

### 4.1 Background

Use black or near-black as the dominant field. Color should arrive through local accent light,
not through a saturated page background.

### 4.2 Glass planes

Main surfaces should read as translucent dark material, not opaque gray cards.
Use:

- subtle neutral/color-tinted panel fill;
- low-alpha white haze;
- modest backdrop blur;
- thin, low-alpha edge highlight;
- one restrained exterior shadow;
- optional local accent bloom.

Avoid:

- milky white glass;
- thick white borders;
- large neon halos;
- strong rainbow gradients;
- generic bootstrap/SaaS cards;
- decorative icons with no functional value;
- excessive glass-on-glass nesting.

### 4.3 Accent distribution

Accent color is a cue, not the background. Prefer local use in:

- active state;
- selection rim;
- progress line;
- small status dot;
- fluid body;
- focused 3D card;
- small ambient bloom.

As a heuristic, saturated accent should occupy a minority of the viewport.

## 5. Recommended design tokens

Start with the tokens in `templates/design-tokens.css`.

Baseline:

```css
--ui-bg: #000000;
--panel-rgb: 16, 23, 19;
--panel-deep-rgb: 8, 13, 11;
--accent: #00e676;
--highlight: #93ffd0;
--shadow-accent: #006b3a;
--panel-opacity: .68;
--surface-haze: .05;
--backdrop-blur: 10px;
--edge-alpha: .10;
--radius-panel: 22px;
```

Do not copy numeric values blindly if the host design requires different density or contrast.
Preserve the material relationships.

## 6. Layout system

For desktop control-center layouts, prefer:

```text
┌────────────┬─────────────────────────────────┬───────────────┐
│ Sidebar    │ Main workspace                  │ Detail panel  │
│ 200–240px  │ flexible                        │ 280–340px     │
│            │ Topbar                          │               │
│            │ KPI / Fluid cards               │               │
│            │ Main data / 3D / table          │               │
│            │ Timeline / secondary region     │               │
└────────────┴─────────────────────────────────┴───────────────┘
```

Typical desktop values:

- page padding: 18–28px
- major gap: 12–18px
- panel radius: 20–30px
- control radius: 10–16px
- KPI card radius: 24–34px

Preserve dense information hierarchy. Do not convert every row into a large card.

## 7. Typography

Use a restrained system-font stack by default. Prefer 3 principal weights: 400 / 500 / 600.

Recommended hierarchy:

- caption: 11–12px
- label: 12–13px
- body: 13–14px
- subtitle: 15–16px
- title: 22–24px
- display metric: 32–38px

Body line height: roughly 1.5–1.65.
Avoid excessive uppercase. Use tabular numerals for metrics.

## 8. Fluid Glass implementation

Reference: `components/fluid-glass/` and `references/05-fluid-glass.md`.

Requirements:

- one canvas per fluid surface;
- transparent canvas over glass base;
- shared animation scheduler for multiple cards;
- pointer disturbance based on local normalized coordinates and pointer velocity;
- adaptive pixel ratio / render quality;
- no hard dependency on WebGL: fall back to CSS material;
- pause or reduce work while hidden;
- allow independent palette, speed, intensity, pointer strength and surface opacity;
- allow motion to be disabled or reduced.

Do not emulate the fluid surface using a single static gradient when WebGL is requested.

## 9. Acrylic 3D implementation

Reference: `components/acrylic-3d/` and `references/06-acrylic-3d-cards.md`.

Support two modes where useful:

### Stack

- compressed lateral spread;
- controlled Z depth;
- focused item lift;
- acrylic shell / core / rim layers;
- pointer parallax as an optional enhancement.

### Orbit

- horizontal and depth radii;
- front/rear scale interpolation;
- depth-based opacity and blur;
- drag rotation;
- inertial continuation;
- optional snap-to-nearest;
- click-to-focus animation;
- optional auto-cruise.

3D must remain navigable by keyboard where possible. Use reduced motion fallbacks.

## 10. Breathing Motion implementation

Reference: `components/breathing/` and `references/07-breathing-system.md`.

Critical rule: **one animation clock owns the phase**.

Do not stack unrelated CSS keyframes across panels, 3D cards and fluid surfaces. A shared phase prevents drift.

Breathing can drive:

- panel scale / brightness;
- topbar fields;
- activity rows or groups;
- timeline surface;
- selected 3D card;
- ambient halo;
- fluid card shell/body/edge;
- sparse particle field.

Preferred modes:

- off
- gentle
- standard
- showcase

Preferred fluid rhythm modes:

- sync
- stagger
- layered

Layered mode should create asymmetric peaks, not identical sine waves on every card.

## 11. Particle Core implementation

Reference: `components/particle-sphere/` and `references/08-particle-sphere.md`.

Modes:

- startup only
- background only
- startup → background
- off

Controls may include:

- intro/background speed;
- intro/background size;
- background position;
- background opacity;
- density;
- point size;
- rim strength;
- orbit rings;
- companion/moon particles;
- preset/custom/theme-linked palette;
- quality mode;
- pause while hidden.

Keep the persistent background subtle enough that dashboard content remains primary.

## 12. Theme and material system

Reference: `components/theme-material/` and `references/09-theme-system.md`.

Provide semantic tokens rather than hard-coding one accent.

Recommended presets:

- deep green
- cyan
- blue
- purple
- silver

Allow custom accent/highlight/shadow colors.

Material settings should separate:

- panel opacity;
- surface haze;
- backdrop blur;
- edge highlight;
- hierarchy contrast;
- region scope;
- optional fluid synchronization.

Do not treat blur and haze as the same parameter.

## 13. Settings UX

Settings panels should be non-modal by default when live visual tuning is the goal.
The user must be able to move a slider and directly see the dashboard change.

Recommended persistence:

```js
localStorage.setItem('immersive-*', JSON.stringify(config));
```

Names must be generic and namespaced. Never retain user-specific storage keys.

When the host requires editable demo text, optionally support:

- `contenteditable` toggle;
- local save;
- reset;
- export current HTML/config.

## 14. Performance and fallback

Always implement degradation paths.

### WebGL unavailable

- hide the canvas;
- show CSS fluid/frosted fallback;
- keep content fully usable.

### Low-power / eco

- reduce pixel ratio;
- lower particle density;
- lower particle FPS;
- reduce expensive blur;
- avoid unnecessary continuous layout reads.

### Hidden page

Pause or throttle continuous animation when `document.hidden` where possible.

### Reduced motion

Respect `prefers-reduced-motion: reduce`.
Disable or substantially reduce continuous breathing, auto-cruise and non-essential transitions.

## 15. Accessibility

- preserve readable text contrast;
- do not encode status only by color;
- interactive 3D cards should be focusable;
- support Enter/Space activation where appropriate;
- controls need labels/ARIA when text is absent;
- do not let motion block task completion;
- settings must remain usable without WebGL.

## 16. Agent workflow

When this skill is selected, follow this order:

### Step 1 — inspect the host

Identify:

- current layout;
- data density;
- primary actions;
- existing component boundaries;
- existing colors/tokens;
- responsive constraints;
- framework/runtime limitations.

### Step 2 — preserve semantics

Do not rewrite application logic merely to fit the visual system.
Map the existing content to the design language.

### Step 3 — establish tokens

Create semantic CSS variables before styling individual components.

### Step 4 — apply base glass UI

Normalize background, panels, spacing, typography, controls and hierarchy.

### Step 5 — select optional modules

Enable only the modules justified by the user's request.

### Step 6 — expose configuration

For visually sensitive modules, centralize tunable parameters instead of scattering magic numbers.

### Step 7 — implement fallback

Verify no optional renderer is required for basic usability.

### Step 8 — visual QA

Use the checklist in `qa/QA-GUIDE.md`.
When browser tooling is available, render the real page and inspect screenshots; do not claim pixel/visual validation from source alone.

## 17. Acceptance criteria

A result using this skill should satisfy all applicable items:

- [ ] background remains predominantly black / near-black;
- [ ] main panels look translucent rather than opaque gray;
- [ ] panel edges are visible but not bright white;
- [ ] haze is distinct from backdrop blur;
- [ ] accent glow is local and restrained;
- [ ] information hierarchy is stronger than decoration;
- [ ] radius and spacing systems are consistent;
- [ ] typography uses a restrained number of weights;
- [ ] UI does not resemble a generic SaaS template;
- [ ] optional motion systems have a clear purpose;
- [ ] multiple breathing layers share one phase controller;
- [ ] fluid cards have a CSS fallback;
- [ ] 3D collection remains selectable and understandable;
- [ ] persistent particle background does not compete with content;
- [ ] reduced motion behavior exists;
- [ ] no personal names, paths, handles or domain-specific demo workflow leaks into reusable code.

## 18. Included reference implementation

`examples/full-dashboard.html` is a single-file reference implementation containing all optional systems.
It is intentionally generic and should be treated as visual/technical evidence, not as a fixed application template.

For production work, reuse only the modules needed by the host application.
