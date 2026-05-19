# RevSim — Task Progress Tracker

## Summary

- **Completed:** 26 / 33
- **Remaining:** 10 / 33
- **Last updated:** 2026-05-19

## Per-task completion checklist

- [ ] pnpm typecheck passes
<!-- - [ ] pnpm test:run passes -->
- [ ] pnpm lint passes
- [ ] git add . && git commit -m "..." && git push
- [ ] Mark task [x] in this file
- [ ] /clear session before next task

## ⏭️ NEXT TASK TO START: Task 27 — Oscilloscope component

---

## Phase 1 — Scaffold

- [x] **Task 1** — Bootstrap Next.js 15 (`package.json`, `tsconfig.json`, `next.config.ts`, `.nvmrc`)
- [x] **Task 2** — Directory skeleton + `globals.css`, `layout.tsx`, `page.tsx`
- [x] **Task 3** — Git init + `.gitignore`

## Phase 2 — Tooling

- [x] **Task 4** — ESLint + Prettier (`.eslintrc.json`, `.prettierrc`, `.prettierignore`)
- [x] **Task 5** — Pre-commit hooks + CI pipeline (`.github/workflows/ci.yml`, lint-staged, simple-git-hooks)

## Phase 3 — Engine (Types, Constants, Utils)

- [x] **Task 6** — TypeScript type definitions (`src/types/engine.types.ts`, `src/types/audio.types.ts`)
- [x] **Task 7** — Engine constants (`src/constants/engine.constants.ts`)
- [x] **Task 8** — DSP utils (`src/utils/dsp.utils.ts`)
- [x] **Task 9** — Audio utils (`src/utils/audio.utils.ts`)

## Phase 4 — Engine Presets

- [x] **Task 10** — 5 engine preset JSON files + `src/engine/presets/index.ts`

## Phase 5 — Core Engine Modules

- [x] **Task 11** — Engine presets
- [x] **Task 12** — `AudioEngine` class
- [x] **Task 13** — `OscillatorBank`
- [x] **Task 14** — `NoiseGenerator`
- [x] **Task 15** — `FilterChain`
- [x] **Task 16** — `EngineSimulator`

## Phase 6 — State Stores

- [x] **Task 17** — Zustand `engineStore`
- [x] **Task 18** — Zustand `uiStore`

## Phase 7 — React Hooks

- [x] **Task 19** — `useEngineAudio` hook
- [x] **Task 20** — `useRPMController` hook
- [x] **Task 21** — `useEnginePreset` hook

## Phase 8 — App Shell

- [x] **Task 22** — `SimulatorShell` + `SimulatorCore` (dynamic import)
- [x] **Task 23** — Finalize `layout.tsx`, `page.tsx`, `globals.css`

## Phase 9 — Individual Components

- [x] **Task 24** — `EngineSelector` component
- [x] **Task 25** — `RPMGauge` component
- [x] **Task 26** — `ThrottleControl` component
- [ ] **Task 27** — `Oscilloscope` component
- [ ] **Task 28** — `SpectrumAnalyzer` component
- [ ] **Task 29** — `MiniGauge` component (decorative)

## Phase 10 — Integration

- [ ] **Task 30** — Assemble full simulator layout
- [ ] **Task 31** — Keyboard shortcuts hook (`useKeyboardShortcuts`)
- [ ] **Task 32** — Audio recording + export (`useAudioRecorder`)
- [ ] **Task 33** — Settings panel
- [ ] **Task 34** — Web Worker (`audioProcessor.worker.ts`)
