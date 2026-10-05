# Glass Material

The system separates **surface haze** from **background blur**.

## Surface haze

A low-alpha white or tinted material layer that remains visible even when the background is black.

## Backdrop blur

Blur applied to content physically behind a surface. It does not replace haze.

## Main panel recipe

- dark panel fill with 0.55–0.85 alpha depending on context
- haze ~0.02–0.08
- blur ~6–16px
- edge alpha ~0.06–0.14
- subtle inset top highlight
- deep exterior shadow

Use nested glass sparingly. In strict/uniform material mode, suppress unnecessary nested backgrounds.
