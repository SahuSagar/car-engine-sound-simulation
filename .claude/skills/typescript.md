# TypeScript Rules

## Compiler Config

`tsconfig.json` must have:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/engine/*":     ["src/engine/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*":      ["src/hooks/*"],
      "@/store/*":      ["src/store/*"],
      "@/types/*":      ["src/types/*"],
      "@/utils/*":      ["src/utils/*"],
      "@/constants/*":  ["src/constants/*"],
      "@/workers/*":    ["src/workers/*"]
    }
  }
}
```

**Always use path aliases.** No relative `../../../` imports allowed beyond one level up.

## Type Rules

```ts
// ✅ interface for object shapes
interface EnginePreset {
  readonly id: string;
  readonly cylinders: 4 | 6 | 8 | 12;
}

// ✅ type for unions, intersections, mapped types
type EngineState = 'idle' | 'running' | 'redline' | 'dead';

// ❌ never
const x: any = ...
function foo(x: any) { ... }
```

- No `any`. Use `unknown` + type guards if input is truly unknown.
- No `as` casting unless narrowing from `unknown`. Never cast to silence an error.
- No non-null assertion (`!`) — handle nullability explicitly.
- All exported functions must have **explicit return types**.
- Use `readonly` on all interface fields that should not be mutated.
- Use `satisfies` operator when you want type inference + shape validation simultaneously.

## Enums

Prefer `const` objects over TypeScript `enum`:

```ts
// ✅
export const EngineState = {
  Idle: 'idle',
  Running: 'running',
  Redline: 'redline',
  Dead: 'dead',
} as const;
export type EngineState = typeof EngineState[keyof typeof EngineState];

// ❌ — TypeScript enums compile to weird JS
enum EngineState { Idle, Running }
```

## Narrowing Pattern

```ts
function isEnginePreset(v: unknown): v is EnginePreset {
  return (
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    'cylinders' in v
  );
}
```

Write a type guard before any `JSON.parse()` or external data ingestion.

## Audio-Specific Types

All audio types live in `src/types/audio.types.ts`. All engine model types live in `src/types/engine.types.ts`. Never inline complex types in component files.

Key types to always keep updated:

```ts
// engine.types.ts
export interface HarmonicConfig {
  readonly multiplier: number;
  readonly amplitude: number;  // 0–1
  readonly detune: number;     // cents
}

export interface EnginePreset {
  readonly id: string;
  readonly name: string;
  readonly cylinders: 4 | 6 | 8 | 12;
  readonly idleRPM: number;
  readonly redlineRPM: number;
  readonly harmonics: readonly HarmonicConfig[];
  readonly exhaustResonance: number;  // Hz
  readonly inductionNoise: number;    // 0–1
  readonly mechanicalNoise: number;   // 0–1
}

// audio.types.ts
export interface AudioEngineState {
  readonly status: 'uninitialized' | 'running' | 'suspended' | 'error';
  readonly currentRPM: number;
  readonly targetRPM: number;
}
```

## Utility Type Usage

Prefer built-in utility types:
- `Readonly<T>` — freeze object shape
- `Pick<T, K>` / `Omit<T, K>` — shape derivation
- `ReturnType<typeof fn>` — derive from implementation, not duplicate
- `Parameters<typeof fn>` — same

Never manually re-declare a type that can be derived.