# RevSim — Task Progress Tracker

## Summary

- **Completed:** 10 / 33
- **Remaining:** 28 / 33
- **Last updated:** 2026-05-19

## Per-task completion checklist

- [ ] pnpm typecheck passes
<!-- - [ ] pnpm test:run passes -->
- [ ] pnpm lint passes
- [ ] git add . && git commit -m "..." && git push
- [ ] Mark task [x] in this file
- [ ] /clear session before next task

## ⏭️ NEXT TASK TO START: Task 11 — Engine presets

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

- [ ] **Task 10** — 5 engine preset JSON files + `src/engine/presets/index.ts`

## Phase 5 — Core Engine Modules

- [ ] **Task 11** — `AudioEngine` class
- [ ] **Task 12** — `OscillatorBank`
- [ ] **Task 13** — `NoiseGenerator`
- [ ] **Task 14** — `FilterChain`
- [ ] **Task 15** — `EngineSimulator`

## Phase 6 — State Stores

- [ ] **Task 16** — Zustand `engineStore`
- [ ] **Task 17** — Zustand `uiStore`

## Phase 7 — React Hooks

- [ ] **Task 18** — `useEngineAudio` hook
- [ ] **Task 19** — `useRPMController` hook
- [ ] **Task 20** — `useEnginePreset` hook

## Phase 8 — App Shell

- [ ] **Task 21** — `SimulatorShell` + `SimulatorCore` (dynamic import)
- [ ] **Task 22** — Finalize `layout.tsx`, `page.tsx`, `globals.css`

## Phase 9 — Individual Components

- [ ] **Task 23** — `EngineSelector` component
- [ ] **Task 24** — `RPMGauge` component
- [ ] **Task 25** — `ThrottleControl` component
- [ ] **Task 26** — `Oscilloscope` component
- [ ] **Task 27** — `SpectrumAnalyzer` component
- [ ] **Task 28** — `MiniGauge` component (decorative)

## Phase 10 — Integration

- [ ] **Task 29** — Assemble full simulator layout
- [ ] **Task 30** — Keyboard shortcuts hook (`useKeyboardShortcuts`)
- [ ] **Task 31** — Audio recording + export (`useAudioRecorder`)
- [ ] **Task 32** — Settings panel
- [ ] **Task 33** — Web Worker (`audioProcessor.worker.ts`)
