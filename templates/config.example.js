export const immersiveDashboardConfig = {
  modules: {
    fluidGlass: true,
    acrylic3D: true,
    breathing: true,
    particleCore: true,
  },
  theme: {
    preset: 'green',
    accent: '#00e676',
    highlight: '#93ffd0',
    shadow: '#006b3a',
  },
  material: {
    enabled: true,
    mode: 'natural',
    panelOpacity: 0.68,
    surfaceHaze: 0.05,
    backgroundBlur: 10,
    edgeHighlight: 0.10,
  },
  motion: {
    reducedMotionStrategy: 'respect-system',
    breathingMode: 'standard',
    fluidRhythm: 'layered',
  },
};
