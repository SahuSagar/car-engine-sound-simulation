# Next.js Rules

## App Router Structure

- All routes live under `src/app/`. No `pages/` directory — we are App Router only.
- `src/app/layout.tsx` — root layout. Loads fonts via `next/font/google`, sets metadata, renders shell. **Server Component. No audio imports.**
- `src/app/page.tsx` — single route. Renders `<SimulatorShell />` which is a Client Component. Page itself stays a Server Component.
- `src/app/globals.css` — CSS custom properties (design tokens) only. No component styles here.

## Server vs Client Components

Every file that uses any of the following **must have `'use client'` as its very first line**:

- `AudioContext`, `AudioNode`, or any Web Audio API
- `window`, `document`, `navigator`
- React hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, etc.)
- Zustand stores
- Event listeners
- Canvas / `requestAnimationFrame`

Files that do NOT need `'use client'`:
- `src/app/layout.tsx`
- `src/app/page.tsx`
- All `src/engine/*.ts` files (pure TS, no browser APIs at import time)
- All `src/types/*.ts`
- All `src/constants/*.ts`
- All `src/utils/*.ts`

**Rule:** If you are unsure — add `'use client'`. A redundant directive is harmless. A missing one is a runtime crash.

## Dynamic Imports for Audio

The audio engine must never be imported at the top level of any Server Component or SSR path. Use dynamic import with `ssr: false` at the component level:

```ts
// ✅ Correct — inside a Client Component
const SimulatorCore = dynamic(() => import('@/components/SimulatorCore'), {
  ssr: false,
  loading: () => <EngineSkeleton />,
});
```

Never do this in `page.tsx` directly — wrap it in `<SimulatorShell />` first.

## Metadata

Define metadata in `src/app/layout.tsx` using the Next.js `Metadata` API:

```ts
export const metadata: Metadata = {
  title: 'RevSim — Car Engine Sound Simulator',
  description: 'Real-time engine sound synthesis in your browser.',
  themeColor: '#080808',
};
```

## Fonts

Load all fonts in `src/app/layout.tsx` via `next/font/google`. Never use a `<link>` tag for fonts.

```ts
import { Orbitron, DM_Mono, Inter } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-dm-mono' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

Apply all three `variable` class names to `<body>`.

## Environment Variables

All client-accessible env vars are prefixed `NEXT_PUBLIC_`. Server-only vars have no prefix.

```ts
// ✅ Client-safe
process.env.NEXT_PUBLIC_DEFAULT_PRESET

// ❌ Not accessible in browser — will be undefined
process.env.SECRET_KEY
```

## next.config.ts

Web Workers require explicit webpack config:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader', options: { esModule: true } },
    });
    return config;
  },
};

export default nextConfig;
```

Install `worker-loader` as a dev dependency.

## What Never Goes in `src/app/`

- Business logic
- Audio engine code
- Zustand store definitions
- Utility functions

`src/app/` is routing and layout only.