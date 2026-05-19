# RevSim — Task Progress Tracker

## Summary

- **Completed:** 6 / 37
- **Remaining:** 31 / 37
- **Last updated:** 2026-05-19

## Per-task completion checklist

- [ ] pnpm typecheck passes
- [ ] pnpm test:run passes
- [ ] pnpm lint passes
- [ ] git add . && git commit -m "..." && git push
- [ ] Mark task [x] in this file
- [ ] /clear session before next task

## ⏭️ NEXT TASK TO START: Task 7 — TypeScript type definitions

---

## Phase 1 — Scaffold

- [x] **Task 1** — Bootstrap Next.js 15 (`package.json`, `tsconfig.json`, `next.config.ts`, `.nvmrc`)
- [x] **Task 2** — Directory skeleton + `globals.css`, `layout.tsx`, `page.tsx`
- [x] **Task 3** — Git init + `.gitignore`

## Phase 2 — Tooling

- [x] **Task 4** — ESLint + Prettier (`.eslintrc.json`, `.prettierrc`, `.prettierignore`)
- [x] **Task 5** — Vitest + test infra (`vitest.config.ts`, `tests/setup.ts`, `tests/mocks/audio-context.mock.ts`)
- [x] **Task 6** — Pre-commit hooks + CI pipeline (`.github/workflows/ci.yml`, lint-staged, simple-git-hooks)

## Phase 3 — Engine (Types, Constants, Utils)

- [ ] **Task 7** — TypeScript type definitions (`src/types/engine.types.ts`, `src/types/audio.types.ts`)
- [ ] **Task 8** — Engine constants (`src/constants/engine.constants.ts`)
- [ ] **Task 9** — DSP utils + unit tests (`src/utils/dsp.utils.ts`, `tests/unit/dsp.utils.test.ts`)
- [ ] **Task 10** — Audio utils + unit tests (`src/utils/audio.utils.ts`, `tests/unit/audio.utils.test.ts`)

## Phase 4 — Engine Presets

- [ ] **Task 11** — 5 engine preset JSON files + `src/engine/presets/index.ts`

## Phase 5 — Core Engine Modules

- [ ] **Task 12** — `AudioEngine` class + tests
- [ ] **Task 13** — `OscillatorBank` + tests
- [ ] **Task 14** — `NoiseGenerator` + tests
- [ ] **Task 15** — `FilterChain` + tests
- [ ] **Task 16** — `EngineSimulator` + tests

## Phase 6 — State Stores

- [ ] **Task 17** — Zustand `engineStore` + tests
- [ ] **Task 18** — Zustand `uiStore`

## Phase 7 — React Hooks

- [ ] **Task 19** — `useEngineAudio` hook + tests
- [ ] **Task 20** — `useRPMController` hook
- [ ] **Task 21** — `useEnginePreset` hook

## Phase 8 — App Shell

- [ ] **Task 22** — `SimulatorShell` + `SimulatorCore` (dynamic import)
- [ ] **Task 23** — Finalize `layout.tsx`, `page.tsx`, `globals.css`

## Phase 9 — Individual Components

- [ ] **Task 24** — `EngineSelector` component
- [ ] **Task 25** — `RPMGauge` component
- [ ] **Task 26** — `ThrottleControl` component
- [ ] **Task 27** — `Oscilloscope` component
- [ ] **Task 28** — `SpectrumAnalyzer` component
- [ ] **Task 29** — `MiniGauge` component (decorative)

## Phase 10 — Integration

- [ ] **Task 30** — Assemble full simulator layout
- [ ] **Task 31** — Keyboard shortcuts hook (`useKeyboardShortcuts`)
- [ ] **Task 32** — Audio recording + export (`useAudioRecorder`)
- [ ] **Task 33** — Settings panel
- [ ] **Task 34** — Web Worker (`audioProcessor.worker.ts`)

## Phase 11 — QA

- [ ] **Task 35** — Integration tests: engine simulator lifecycle
- [ ] **Task 36** — Component smoke tests (RTL)
- [ ] **Task 37** — Coverage gate + final QA pass
