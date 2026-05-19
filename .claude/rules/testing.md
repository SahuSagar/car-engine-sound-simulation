## MVP Note

For the MVP phase, unit tests are deferred. The test
infrastructure (vitest.config.ts, mocks, setup.ts) is
in place but test files are not written until after
core features ship. Integration tests only for Phase 11.

# Component Rules

## Every Component Is a Client Component

All components in `src/components/` use browser APIs, React hooks, or both.  
**Every component file must start with `'use client'`.**

```ts
'use client';

import type { FC } from 'react';
// ...
```

## Folder Structure Per Component

```
src/components/RPMGauge/
├── index.tsx            ← public export, 'use client'
├── RPMGauge.module.css  ← scoped styles
└── RPMGauge.test.tsx    ← optional, smoke tests only
```

Import as: `import { RPMGauge } from '@/components/RPMGauge'`  
Never import the internal file directly.

## No Business Logic in Components

Components handle only:

- Rendering JSX
- Reading from hooks
- Dispatching user events to hooks

All logic lives in `src/hooks/`. All audio state lives in `src/engine/`.

```ts
// ✅ Correct
const { currentRPM, isRunning } = useEngineAudio();

// ❌ Wrong — direct engine import in component
import { AudioEngine } from '@/engine/AudioEngine';
```

## Props Pattern

```ts
// ✅ Explicit, typed, readonly
interface RPMGaugeProps {
  readonly currentRPM: number;
  readonly redlineRPM: number;
  readonly isRedline: boolean;
}

export const RPMGauge: FC<RPMGaugeProps> = ({ currentRPM, redlineRPM, isRedline }) => {
  // ...
};
```

- All prop interfaces use `readonly`.
- No optional props without a sensible `defaultProps` or default param value.
- No prop drilling beyond 2 levels — use Zustand store instead.

## Size Limit

**200 lines max per component file.** If larger, split into sub-components or extract logic to a hook.

## Canvas Components (Oscilloscope, SpectrumAnalyzer)

```ts
'use client';

import { useEffect, useRef } from 'react';

export const Oscilloscope: FC<OscilloscopeProps> = ({ analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;

    const ctx = canvas.getContext('2d')!;
    let rafId: number;

    const draw = (): void => {
      // render frame
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId); // ← always cleanup
  }, [analyserNode]);

  return <canvas ref={canvasRef} />;
};
```

Rules:

- Canvas `width` and `height` attributes must be set programmatically to match `devicePixelRatio` for crisp rendering on retina displays.
- Always cleanup `cancelAnimationFrame` on unmount.
- Never read canvas pixel data — write only.

## Memoization Policy

```ts
// ✅ Memoize expensive derived values
const arcPath = useMemo(() => computeGaugeArc(currentRPM, redlineRPM), [currentRPM, redlineRPM]);

// ✅ Stabilize callbacks passed to child components
const handleThrottlePress = useCallback(() => {
  engineSim.setThrottle(1);
}, [engineSim]);

// ❌ Don't memoize everything — only when re-render cost is measurable
const label = useMemo(() => `${rpm} RPM`, [rpm]); // wasteful
```

## Loading / Skeleton State

Every component that depends on `AudioContext` being initialized must handle the uninitialized state:

```ts
const { status } = useEngineAudio();

if (status === 'uninitialized') return <GaugeSkeleton />;
if (status === 'error') return <AudioUnsupportedBanner />;
```

Never render interactive audio controls when `status !== 'running'`.

## Responsive Sizing

Never hard-code `px` sizes for gauge or canvas dimensions. Use:

```ts
// Read from ResizeObserver or container ref
const { width } = useContainerSize(containerRef);
const gaugeSize = Math.min(width, 420); // max 420px
```

This ensures the gauge scales correctly at all viewport sizes without media query duplication.
