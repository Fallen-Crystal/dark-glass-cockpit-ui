# Performance & Fallback

## WebGL

- adaptive DPR
- shared RAF
- visibility checks
- CSS fallback

## 3D

- transform/opacity/filter only during continuous motion where possible
- avoid layout reads in animation loops
- stop cruise when reduced motion is active

## Particle Core

- quality-dependent density
- lower background FPS
- pause on hidden page

## Reduced motion

Disable continuous breathing and auto motion where they are non-essential. Preserve state indication without animation.
