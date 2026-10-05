# Fluid Glass

## Rendering model

Each metric card owns a transparent WebGL canvas. A shared manager schedules all renderers through one requestAnimationFrame loop.

The shader combines:

- signed-distance rounded box clipping
- FBM/domain-warp noise
- edge band and soft clipping
- three configurable palette colors
- time-based drift
- pointer position and pointer velocity disturbance

## Parameters

Per card:

- color A/B/C
- speed
- intensity
- pointer strength
- surface opacity
- seed

Global:

- render quality: auto/high/balanced/eco/fallback
- pointer interaction toggle

## Fallback

When WebGL fails, add a fallback class and show layered radial CSS gradients. Content must remain identical.
