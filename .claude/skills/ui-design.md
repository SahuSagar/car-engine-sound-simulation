# UI & Design Rules

## Design North Star

> "If you close your eyes, it sounds real. When you open them, it looks real."

Every UI decision must serve immersion. When in doubt: darker, more physical, more weighted.

## CSS Custom Properties (Design Tokens)

All tokens are defined in `src/app/globals.css` under `:root`. Never hard-code a color, font, or spacing value in a component.

```css
:root {
  /* Colors */
  --color-bg:              #080808;
  --color-surface:         #111113;
  --color-surface-raised:  #1A1A1E;
  --color-border:          #2A2A2E;
  --color-primary:         #E8FF00;
  --color-primary-dim:     #A8B800;
  --color-accent:          #FF6B00;
  --color-danger:          #FF2020;
  --color-danger-glow:     rgba(255, 32, 32, 0.35);
  --color-text:            #E8E8E8;
  --color-text-muted:      #666670;
  --color-gauge-track:     #1E1E22;
  --color-phosphor:        #00FF88;

  /* Typography */
  --font-display:  var(--font-orbitron), sans-serif;
  --font-mono:     var(--font-dm-mono), monospace;
  --font-body:     var(--font-inter), sans-serif;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radii */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-full: 9999px;

  /* Transitions */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);
}
```

## Typography Rules

```css
/* RPM number in gauge center */
.rpm-display {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

/* Engine name / preset labels */
.preset-label {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* Instrument labels, values, readouts */
.instrument-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
```

- `Orbitron` → only for display numbers and engine names.
- `DM Mono` → all instrument labels, data readouts, frequency values.
- `Inter` → settings panel, descriptions, error messages only.
- Never mix fonts within the same UI element.

## Surface & Material

### Carbon fiber texture (no image files):
```css
.gauge-bezel {
  background:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.015) 2px,
      rgba(255,255,255,0.015) 4px
    ),
    var(--color-surface);
}
```

### Ambient glow for active elements:
```css
/* Primary active state */
.active-primary {
  box-shadow: 0 0 12px rgba(232, 255, 0, 0.25),
              0 0 24px rgba(232, 255, 0, 0.10);
}

/* Danger / redline state */
.active-danger {
  box-shadow: 0 0 16px var(--color-danger-glow),
              0 0 32px rgba(255, 32, 32, 0.15);
}
```

### Gauge glass reflection (CSS only):
```css
.gauge::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 30% 20%,
    rgba(255,255,255,0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 2;
}
```

## Component Rules

### Styling
- Use **CSS Modules** (`.module.css`) for all component styles. One module file per component directory.
- Never use inline `style={{}}` props except for dynamic values that cannot be expressed as CSS custom properties (e.g. dynamic `strokeDashoffset` on SVG).
- Never use Tailwind or any utility-class framework — the design requires precise custom values that utility classes cannot express cleanly.

### Structure
- Each component lives in its own folder: `src/components/RPMGauge/`
- Folder contains: `index.tsx`, `RPMGauge.module.css`, optional `RPMGauge.test.tsx`
- Export from `index.tsx` only. Import path: `@/components/RPMGauge`

## Animations

All animation timing must use defined CSS variables:
```css
transition: transform 150ms var(--ease-spring);
transition: opacity 200ms var(--ease-out);
```

`requestAnimationFrame` loop pattern for canvas:
```ts
let rafId: number;

function startRender() {
  function frame() {
    draw(); // canvas render
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

function stopRender() {
  cancelAnimationFrame(rafId);
}
```

Always cancel `rAF` on component unmount.

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable decorative animations only */
  .needle-sweep,
  .redline-pulse,
  .startup-bounce {
    animation: none;
    transition: none;
  }
  /* Gauge, audio, and core functionality still work */
}
```

## What Never Belongs in the UI

- ❌ Light backgrounds, white surfaces, bright color schemes.
- ❌ Hard-coded hex colors or pixel values in component files.
- ❌ Generic fonts (`Arial`, `Roboto`, `Helvetica`, standalone `Inter` for display).
- ❌ Rounded pill-shaped buttons that look like a web SaaS product.
- ❌ Shadows that look "Material Design" or "iOS" — our shadows are glow-based.
- ❌ Animations that run without `requestAnimationFrame` (use CSS or rAF, never `setInterval`).