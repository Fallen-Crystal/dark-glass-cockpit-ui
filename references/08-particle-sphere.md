# Particle Core

A canvas-based point-sphere environment for startup or ambient background use.

## Modes

- `intro`
- `background`
- `introBackground`
- `off`

## Particle layers

- shell
- volumetric/internal points
- local clusters
- rim points
- orbit rings
- optional companion particles

## Performance

Quality affects density and update cadence. Background mode should run slower and at lower opacity than intro mode. Pause while page is hidden when enabled.

## Visual rule

The background sphere is environmental. It must not become brighter than primary content or obscure glass readability.
