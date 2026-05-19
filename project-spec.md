# project-spec.md — RevSim: Car Engine Sound Simulation

**Version:** 1.0.0  
**Status:** Draft → In Review  
**Author:** Engineering Team  
**Last Updated:** 2026-05-18  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Personas](#4-user-personas)
5. [Feature Specification](#5-feature-specification)
6. [Technical Architecture](#6-technical-architecture)
7. [Audio Engine Design](#7-audio-engine-design)
8. [UI/UX Specification](#8-uiux-specification)
9. [Engine Presets](#9-engine-presets)
10. [Performance Requirements](#10-performance-requirements)
11. [Browser Compatibility](#11-browser-compatibility)
12. [Accessibility](#12-accessibility)
13. [Security & Privacy](#13-security--privacy)
14. [Milestones & Timeline](#14-milestones--timeline)
15. [Open Questions](#15-open-questions)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

**RevSim** is a browser-based, real-time car engine sound simulator that synthesizes authentic engine audio using the Web Audio API. Users can select from multiple engine archetypes (inline-4, V6, V8, V12), control throttle and RPM in real time, and visualize the sound characteristics via oscilloscope and spectrum analyzer — all without any backend, plugin, or download.

The product is a single-page application (SPA) that runs entirely client-side.

---

## 2. Problem Statement

Car audio enthusiasts, game developers, educators, and hobbyist mechanics lack an accessible, zero-install tool to:
- Experience realistic engine sounds across different configurations.
- Understand how engine RPM, cylinder count, and throttle position affect the acoustic output.
- Prototype audio assets for games or simulations without expensive recording sessions.

Existing solutions are either native-app executables, paywalled plugins (VST), or poor-quality YouTube recordings with no interactivity.

---

## 3. Goals & Non-Goals

### ✅ Goals (v1.0)
- Real-time engine sound synthesis driven by RPM and throttle input.
- At least **5 engine presets** covering major configurations (I4, V6, V8, V12, rotary).
- Visual feedback: RPM gauge, oscilloscope, spectrum analyzer.
- Mobile-friendly layout (touch-based throttle control).
- Export: record a 5–30 second clip and download as `.webm` or `.wav`.
- Fully client-side — no server required.
- Open-source friendly codebase.

### ❌ Non-Goals (v1.0)
- Full vehicle simulation (gearbox, clutch, turbo, exhaust back-pressure physics).
- MIDI controller input (planned for v1.1).
- Multiplayer / session sharing.
- Native mobile app (iOS/Android).
- Audio effect marketplace or user-uploaded samples.
- Realistic exhaust note modeling beyond harmonic synthesis.

---

## 4. User Personas

### Persona A — The Hobbyist Enthusiast
**Name:** Aryan, 22  
**Context:** Car fan who wants to hear what a V12 sounds like vs his current inline-4.  
**Needs:** Simple controls, no technical knowledge, instant gratification.  
**Success metric:** Loads page, selects preset, hears engine within 10 seconds.

### Persona B — The Indie Game Developer  
**Name:** Priya, 28  
**Context:** Building a racing game and needs to prototype engine audio assets.  
**Needs:** Export audio clips, tweak parameters, compare presets.  
**Success metric:** Exports a 10-second recording of a V8 at 4500 RPM.

### Persona C — The Audio/DSP Student  
**Name:** Raj, 24  
**Context:** Learning web audio synthesis for a university project.  
**Needs:** Spectrum analyzer, oscilloscope, visible frequency data.  
**Success metric:** Sees FFT output change as RPM increases.

---

## 5. Feature Specification

### F-001: Engine Selector
- **Description:** Dropdown or card-based selector to choose engine archetype.
- **Presets:** Inline-4, V6, V8, V12, Rotary (Wankel)
- **Behavior:** Switching preset smoothly crossfades audio within 200ms.
- **Priority:** P0

### F-002: RPM Gauge
- **Description:** Analog-style gauge showing current and target RPM.
- **Range:** 0 – [preset redlineRPM + 500] RPM
- **Redline zone:** Highlighted in red from 90% of redlineRPM.
- **Needle animation:** Smooth interpolation using `requestAnimationFrame`.
- **Priority:** P0

### F-003: Throttle Control
- **Description:** Interactive throttle input that drives RPM changes.
- **Desktop:** Click-and-hold button or vertical slider.
- **Mobile:** Large touch-hold button.
- **Behavior:**
  - Hold → RPM increases at preset-defined acceleration rate.
  - Release → RPM decelerates toward idle RPM.
  - If RPM hits redline → engine limiter activates (brief stutter + RPM held at redline).
- **Priority:** P0

### F-004: Start / Stop Engine
- **Description:** Toggle to cold-start or kill the engine.
- **Cold start behavior:** RPM spikes briefly to ~1200 RPM then settles to idle.
- **Kill behavior:** RPM drops rapidly with final cough/sputter sound.
- **Priority:** P0

### F-005: Oscilloscope Visualizer
- **Description:** Real-time waveform display of the synthesized audio.
- **Renderer:** Canvas 2D API using `AnalyserNode`.
- **Style:** Green phosphor on dark background (CRT aesthetic).
- **Toggle:** Can be hidden to save GPU resources.
- **Priority:** P1

### F-006: Spectrum Analyzer
- **Description:** Real-time FFT frequency visualization.
- **FFT Size:** 2048 bins.
- **Display:** Bar chart, 20 Hz – 8 kHz, log scale.
- **Color coding:** Low freq (red) → mid (yellow) → high (green).
- **Toggle:** Can be hidden.
- **Priority:** P1

### F-007: Audio Recording & Export
- **Description:** Record the synthesized audio and download locally.
- **Format:** `.webm` (primary), `.wav` (via `AudioBuffer` conversion, secondary).
- **Max duration:** 30 seconds.
- **API:** `MediaRecorder` API capturing from `AudioContext.destination`.
- **Priority:** P1

### F-008: Mute / Volume Control
- **Description:** Master volume slider and mute toggle.
- **Default volume:** 70%
- **Priority:** P0

### F-009: Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Start / Stop engine |
| `↑` / `W` | Increase throttle |
| `↓` / `S` | Release throttle |
| `M` | Mute / Unmute |
| `1–5` | Select engine preset |
| `R` | Start / Stop recording |
- **Priority:** P1

### F-010: Settings Panel
- **Options:**
  - Master volume
  - Reverb / room simulation toggle (convolution reverb using `ConvolverNode`)
  - Exhaust loudness bias
  - Induction noise level
- **Priority:** P2

---

## 6. Technical Architecture

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | SSG for shell, dynamic imports for audio, production-ready |
| UI Framework | React 19 (bundled with Next.js 15) | Concurrent features, Server/Client component model |
| Language | TypeScript 5.x | Type safety for complex audio param models |
| Build Tool | Next.js (Turbopack) | Built-in, fast HMR, Worker support via `next.config.ts` |
| State | Zustand 4 | Minimal, no boilerplate, no context hell |
| Audio | Web Audio API (native) | Zero-dependency real-time DSP |
| Audio Polyfill | `standardized-audio-context` | Cross-browser consistency |
| Testing | Vitest + RTL | Compatible with Next.js, fast |
| Styling | CSS Modules + CSS vars | Scoped styles, no runtime cost |
| Package Manager | pnpm | Speed, disk efficiency |

### Data Flow

```
User Input (throttle/keyboard)
        │
        ▼
  useRPMController (hook)
        │ targetRPM
        ▼
  EngineSimulator.setTargetRPM()
        │
        ▼
  OscillatorBank.update(rpm, preset)
    ├── Oscillator 1..N → GainNode → MasterGain
    ├── NoiseGenerator → BandpassFilter → MasterGain
    └── FilterChain (dynamic EQ by RPM curve)
        │
        ▼
  AudioContext.destination
        │
        ├──► AnalyserNode (FFT) → SpectrumAnalyzer component
        ├──► AnalyserNode (waveform) → Oscilloscope component
        └──► MediaRecorder → download
```

### Module Contracts

#### `AudioEngine`
```ts
interface IAudioEngine {
  initialize(): Promise<void>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  setMasterVolume(value: number): void;  // 0–1
  readonly context: AudioContext;
  readonly state: 'uninitialized' | 'running' | 'suspended';
}
```

#### `EngineSimulator`
```ts
interface IEngineSimulator {
  loadPreset(preset: EnginePreset): void;
  setTargetRPM(rpm: number): void;
  coldStart(): void;
  killEngine(): void;
  readonly currentRPM: number;
}
```

#### `OscillatorBank`
```ts
interface IOscillatorBank {
  update(rpm: number, preset: EnginePreset): void;
  connect(destination: AudioNode): void;
  disconnect(): void;
  dispose(): void;
}
```

---

## 7. Audio Engine Design

### Synthesis Model

RevSim uses **additive synthesis with dynamic harmonic shaping**. Each engine type is modeled via:

1. **Fundamental Frequency (f₀)**  
   `f₀ = (RPM / 60) × (cylinders / 2)`  
   _Example: V8 at 3000 RPM → f₀ = 200 Hz_

2. **Harmonic Series**  
   Partials at `f₀ × n` (n = 1, 2, 3, 4...) with amplitudes defined by the preset's harmonic envelope.

3. **Combustion Noise Layer**  
   Bandpass-filtered white noise centered around the `exhaustResonance` frequency. Amplitude scales with RPM.

4. **Mechanical Noise Layer**  
   High-frequency white noise (1kHz–8kHz) at low amplitude simulating valve train and accessory noise.

5. **Dynamic Filter Chain**  
   A series of `BiquadFilterNode`s whose cutoff frequencies interpolate along RPM-defined curves to simulate real acoustic resonance changes.

### Signal Graph (per-engine)

```
OscillatorNode × N ─────┐
                        ├─► GainNode (harmonic mix) ─┐
WhiteNoise (combustion) ─► BandPassFilter ────────────┤
                        │                             ├─► MasterGain ─► Destination
WhiteNoise (mechanical) ─► HighPassFilter ────────────┤
                                                      │
                         ReverbConvolver ─────────────┘ (optional)
```

### RPM Transition Smoothing

All `AudioParam` changes use `setTargetAtTime` with exponential time constants:
- Throttle press: `τ = 0.05s` (fast attack)
- Throttle release: `τ = 0.12s` (slower decel)
- Preset switch: `τ = 0.2s` (smooth crossfade)

### Redline Limiter
When `currentRPM ≥ preset.redlineRPM`:
- Cut fuel: master gain drops by 40% for 80ms cycles.
- Audio stutters at ~6 Hz (simulated fuel cut).
- RPM is clamped at `redlineRPM + 100`.

---

## 8. UI/UX Specification

### Design Philosophy
The UI must feel like sitting inside a real performance car's cockpit — not a web app that _describes_ an engine. Every interaction should have **physical weight**: throttle feels heavy, the gauge needle has inertia, redline feels dangerous. The user should instinctively understand the state of the engine from a single glance.

> Design north star: **"If you close your eyes, it sounds real. When you open them, it looks real."**

---

### Design Language

#### Color System
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#080808` | Page background — true near-black |
| `--color-surface` | `#111113` | Card/panel surfaces |
| `--color-surface-raised` | `#1A1A1E` | Elevated controls, knobs |
| `--color-border` | `#2A2A2E` | Subtle dividers |
| `--color-primary` | `#E8FF00` | Racing yellow — active states, needle, CTA |
| `--color-primary-dim` | `#A8B800` | Hover/pressed primary |
| `--color-accent` | `#FF6B00` | Warm orange — secondary highlights, heat |
| `--color-danger` | `#FF2020` | Redline, warnings |
| `--color-danger-glow` | `rgba(255,32,32,0.35)` | Redline glow bloom |
| `--color-text` | `#E8E8E8` | Primary text |
| `--color-text-muted` | `#666670` | Labels, secondary info |
| `--color-gauge-track` | `#1E1E22` | Gauge background arc |
| `--color-phosphor` | `#00FF88` | Oscilloscope CRT line |

#### Typography
| Role | Font | Weight | Size |
|------|------|--------|------|
| RPM number (gauge center) | `Orbitron` | 700 | `clamp(2.5rem, 5vw, 4.5rem)` |
| Engine name / preset label | `Orbitron` | 400 | `0.85rem`, letter-spacing `0.2em` |
| UI labels, controls | `DM Mono` | 400 | `0.75rem` |
| Settings, descriptions | `Inter` | 400 | `0.875rem` |

All fonts loaded via `next/font/google`. No layout shift.

#### Material & Surface Treatment
- **Carbon fiber texture** on gauge bezel and control panel: CSS `repeating-linear-gradient` diagonal pattern at low opacity (`0.04`), no image files.
- **Brushed aluminum** effect on knob/button edges: `box-shadow` with light top highlight + dark bottom edge.
- **Gauge glass reflection**: pseudo-element overlay with radial gradient white streak at 30°, opacity `0.06`.
- **Ambient glow**: active elements emit colored `box-shadow` / `filter: drop-shadow`. Primary elements → yellow glow. Redline → red bloom. Oscilloscope → green phosphor glow.
- **Noise grain overlay** on entire page: SVG `feTurbulence` filter at `opacity: 0.025` for tactile depth.

---

### Layout (Desktop — 1280px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  ● REVSIM                    [I4] [V6] [V8] [V12] [RX]  [⚙][🔇] │  ← Header bar, frosted glass bg
├─────────────────────────┬────────────────────────────────────────┤
│                         │  ┌──────────────────────────────────┐  │
│   ┌─────────────────┐   │  │  OSCILLOSCOPE  [CRT canvas]      │  │
│   │                 │   │  │  Green phosphor waveform on black │  │
│   │   RPM  GAUGE    │   │  └──────────────────────────────────┘  │
│   │   (SVG arc,     │   │  ┌──────────────────────────────────┐  │
│   │    needle,      │   │  │  SPECTRUM ANALYZER  [canvas]     │  │
│   │   glow ring)    │   │  │  Log-scale bars, heat colormap   │  │
│   │                 │   │  └──────────────────────────────────┘  │
│   └─────────────────┘   │                                        │
│   [OIL TEMP] [VOLT]     │  ENGINE: V8 MUSCLE   CYLINDERS: 8      │
│   (mini analog gauges)  │  IDLE: 800 RPM   REDLINE: 6500 RPM     │
├─────────────────────────┴────────────────────────────────────────┤
│  [  ⏻  START  ]    ══════════ THROTTLE ══════════    [ ⏺ REC ]  │  ← Control dock
└──────────────────────────────────────────────────────────────────┘
```

- The RPM gauge is the **hero element** — minimum 380px diameter on desktop, center-left.
- Two **mini analog gauges** below the main gauge: Oil Temp (decorative, animates with RPM) and Voltage (static, aesthetic only). These reinforce the cockpit feel.
- Visualizer panels have a subtle **inner border glow** matching their content color.
- Engine metadata (preset info) displays in monospace, right-panel lower area.

---

### Layout (Mobile — 375px+)

```
┌────────────────────────┐
│ ● REVSIM        [⚙][🔇]│
├────────────────────────┤
│   [I4][V6][V8][V12][RX]│  ← Horizontal scroll chip row
├────────────────────────┤
│                        │
│      RPM GAUGE         │  ← 280px diameter, centered
│      (SVG, full width) │
│                        │
├────────────────────────┤
│  OSCILLOSCOPE (canvas) │  ← Collapsible, 120px tall
├────────────────────────┤
│  SPECTRUM  (canvas)    │  ← Collapsible, 100px tall
├────────────────────────┤
│                        │
│   [ ⏻  START ENGINE ]  │
│                        │
│  ████ HOLD TO REV ████ │  ← Full-width, fixed bottom, tactile press
└────────────────────────┘
```

- Throttle button: fixed to bottom, full width, `min-height: 80px`. On `touchstart` it pulses with a yellow border glow. Designed for one-thumb use.
- Preset chips: horizontally scrollable row, no scrollbar visible.
- Visualizers: collapsed by default on mobile, expand via tap toggle.

---

### Component Visual Specs

#### RPM Gauge
- SVG-based arc gauge. Arc spans **240°** (−120° to +120° from bottom).
- Track: single `stroke` arc in `--color-gauge-track`.
- Progress arc: split into **3 zones**:
  - `0 – 70%` of redline → `--color-primary` (yellow)
  - `70 – 90%` → `--color-accent` (orange), transitions via `stroke` gradient
  - `90 – 100%` → `--color-danger` with animated `filter: drop-shadow` pulse
- Needle: thin SVG `line`, sharp, with a center pivot circle. Spring-physics interpolation at 60fps.
- Center: large RPM number (`Orbitron` 700), below it a smaller `RPM` label in muted mono.
- Tick marks: major marks at every 1000 RPM with number labels, minor marks at 200 RPM intervals.
- Outer bezel: `border-radius: 50%`, carbon fiber texture, brushed edge.
- Glass reflection: CSS `::before` pseudo-element.

#### Throttle Control
- Desktop: vertical slider + hold button. Slider shows throttle `%` position.
- Mobile: large hold button.
- On active press: button scales to `0.97` (physical depression feel), border transitions to `--color-primary`, yellow glow blooms.
- Release: smooth spring-back animation, `transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Text inside button changes: `HOLD TO REV` → `REVVING...` while held.

#### Engine Preset Selector
- Desktop: horizontal tab bar with engine names. Active tab has a `--color-primary` bottom border + subtle yellow glow.
- Mobile: scrollable chip row.
- On switch: active tab indicator slides with a `200ms` CSS transition (`left` + `width` animating).
- Each preset shows its engine icon (custom SVG silhouette: I4 block, V8 angle, rotary triangle).

#### Oscilloscope
- Canvas, black background, `--color-phosphor` (`#00FF88`) waveform line.
- Line has `lineWidth: 1.5`, with a secondary ghost line at `opacity: 0.2` and `lineWidth: 3` for CRT bloom effect.
- Subtle scanline overlay via CSS `repeating-linear-gradient` at `opacity: 0.03`.
- Grid: dark green lines at `opacity: 0.08`.
- Label: `WAVEFORM` in top-left, monospace, phosphor color.

#### Spectrum Analyzer
- Canvas, black background.
- Bars use a vertical gradient per bar: bottom → `--color-danger`, mid → `--color-accent`, top → `--color-primary`. Intensity scales with bar height.
- Frequency labels on X-axis: `80Hz`, `250Hz`, `1kHz`, `4kHz`, `8kHz`.
- dB labels on Y-axis: `0`, `−20`, `−40`, `−60`.
- Peak hold dots: small circle at peak position, fade out over 1.5s.

#### Start/Stop Button
- Off state: dark surface, muted label `START ENGINE`, subtle border.
- On state (engine running): green pulsing `box-shadow` (`rgba(0,255,100,0.3)`), label changes to `KILL ENGINE`.
- Press animation: `scale(0.95)` on click, spring-back.
- Cold start sequence: button is disabled for 800ms during startup animation.

#### Mini Gauges (Oil Temp / Voltage) — Desktop only
- 80px diameter SVG arc gauges, same style as main gauge but smaller.
- Oil Temp arc animates from cold (blue) to hot (red) as RPM increases over time — purely cosmetic.
- Adds realism without adding cognitive load.

---

### Animations & Motion

| Element | Animation | Timing |
|---------|-----------|--------|
| RPM needle | Spring physics — damping: 0.7, stiffness: 120 | `rAF` loop |
| Throttle button press | `scale(0.97)` | `150ms cubic-bezier(0.34,1.56,0.64,1)` |
| Preset tab indicator | Slide + width morph | `200ms ease` |
| Redline zone | `opacity` pulse + `drop-shadow` bloom | `@keyframes`, 200ms cycle |
| Engine start needle sweep | 0 → idle RPM with overshoot | `800ms spring` |
| Engine kill | Needle fall + audio fade | `600ms ease-in` |
| Spectrum bars | 60fps canvas render | `rAF` loop |
| Oscilloscope waveform | 60fps canvas render | `rAF` loop |
| Mini gauge (oil temp) | Slow arc fill over 10s at high RPM | `rAF` interpolation |
| Page load | Staggered fade-in of panels | CSS `animation-delay` cascade |

`@media (prefers-reduced-motion)` disables all decorative animations. Audio and gauge still function.

---

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | `< 768px` | Single column, fixed throttle button |
| Tablet | `768px – 1024px` | 2-col, gauge left + visualizers right, smaller |
| Desktop | `> 1024px` | Full layout with mini gauges and info panel |
| Wide | `> 1440px` | Max-width `1400px`, centered, extra padding |

---

## 9. Engine Presets

| ID | Name | Cylinders | Idle RPM | Redline RPM | Character |
|----|------|-----------|----------|-------------|-----------|
| `inline-4` | Inline 4 | 4 | 750 | 7200 | Buzzy, sporty, high-revving |
| `v6-smooth` | V6 | 6 | 650 | 6800 | Smooth, refined, balanced |
| `v8-muscle` | V8 Muscle | 8 | 800 | 6500 | Throaty, burbling, dominant |
| `v12-exotic` | V12 Exotic | 12 | 600 | 8500 | Silky, high-pitched, exotic |
| `rotary` | Rotary (Wankel) | 2 (equiv.) | 900 | 9000 | Turbine-like, high-frequency whine |

Each preset is a JSON file in `src/engine/presets/`.

---

## 10. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load (LCP) | < 2s on 4G | Lighthouse |
| Audio latency (input → sound) | < 20ms | Manual timing |
| Frame rate (visualizers) | 60 fps | Chrome DevTools |
| Bundle size (gzipped) | < 150KB | Next.js build output |
| Memory usage | < 80MB | Chrome Task Manager |
| AudioContext nodes | ≤ 20 active | Custom node counter |
| Preset switch time | < 200ms | Performance.mark |

---

## 11. Browser Compatibility

| Browser | Min Version | Notes |
|---------|-------------|-------|
| Chrome / Edge | 90+ | Full support |
| Firefox | 89+ | Full support |
| Safari | 14.1+ | Requires user gesture for AudioContext |
| iOS Safari | 14.5+ | Limited `MediaRecorder` — WAV export fallback |
| Samsung Internet | 14+ | Full support |

Unsupported browsers receive a banner with upgrade instructions. No graceful audio degradation.

---

## 12. Accessibility

- All interactive controls have `aria-label` and `role` attributes.
- Keyboard-only operation must be fully supported (see F-009).
- Visual oscilloscope/spectrum are supplementary — engine can run without them.
- Color contrast: WCAG 2.1 AA minimum for all text.
- Reduced motion: `@media (prefers-reduced-motion)` disables non-essential animations.
- Screen reader: gauge value announced via `aria-live="polite"` at 500ms intervals.

---

## 13. Security & Privacy

- **No backend.** Zero data collection.
- **No cookies or localStorage** (except optional: last-used preset preference).
- **No external API calls** at runtime (all assets bundled).
- **CSP header** (if served via static host): `default-src 'self'`.
- Audio recording stays local — no upload pathway.
- Open-source. MIT license (planned).

---

## 14. Milestones & Timeline

### Phase 1 — Foundation (Week 1–2)
- [ ] Project scaffold (Next.js 15 App Router + TS + Zustand)
- [ ] `AudioEngine` class with basic `AudioContext` lifecycle
- [ ] First working oscillator (sine wave at idle freq)
- [ ] Basic RPM gauge UI (no animation yet)
- [ ] CI pipeline (GitHub Actions: lint + typecheck + test)

### Phase 2 — Core Engine (Week 3–4)
- [ ] `OscillatorBank` with harmonic synthesis
- [ ] `NoiseGenerator` (combustion + mechanical)
- [ ] `FilterChain` with RPM-curve mapping
- [ ] Throttle control (hold-to-rev)
- [ ] Cold start & kill engine behavior
- [ ] All 5 presets implemented

### Phase 3 — Visualizers & Polish (Week 5–6)
- [ ] Oscilloscope (canvas, 60fps)
- [ ] Spectrum analyzer (FFT, log scale)
- [ ] RPM gauge needle animation (spring physics)
- [ ] Redline limiter with visual indicator
- [ ] Keyboard shortcuts

### Phase 4 — Export & Settings (Week 7)
- [ ] Audio recording (`MediaRecorder`)
- [ ] WAV export fallback (iOS)
- [ ] Settings panel (reverb, noise levels)
- [ ] Mobile layout + touch throttle

### Phase 5 — QA & Launch (Week 8)
- [ ] Cross-browser QA
- [ ] Performance audit (Lighthouse, DevTools)
- [ ] Unit test coverage ≥ 80% on `engine/`
- [ ] Accessibility audit
- [ ] README + deployment (Vercel / GitHub Pages)

---

## 15. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should we support turbo/supercharger simulation in v1? | Product | ❓ Open |
| 2 | Is convolution reverb worth the impulse response file size (~200KB)? | Engineering | ❓ Open |
| 3 | Do we need a custom RPM input field for exact values? | Design | ❓ Open |
| 4 | WAV export via `OfflineAudioContext` re-render — acceptable quality? | Engineering | ❓ Open |
| 5 | MIDI controller support — v1.1 or later? | Product | ✅ Decided: v1.1 |

---

## 16. Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| RPM | Revolutions Per Minute — engine speed metric |
| f₀ | Fundamental frequency of the engine cycle |
| Harmonic | Integer multiple of f₀ contributing to tonal character |
| Additive Synthesis | Building complex sounds by summing sine waves |
| FFT | Fast Fourier Transform — frequency domain analysis |
| AudioParam | Web Audio API object for scheduling parameter changes |
| AnalyserNode | Web Audio API node for frequency/waveform analysis |
| `setTargetAtTime` | Exponential approach to a target value over time |
| Redline | Maximum safe RPM limit for an engine |
| Idle RPM | Engine speed when no throttle is applied |

### B. Reference Material
- [Web Audio API Spec — W3C](https://webaudio.github.io/web-audio-api/)
- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- Engine harmonic structure reference: *"Fundamentals of Vehicle Acoustics"*, SAE International
- Additive synthesis models: *"The Computer Music Tutorial"*, Curtis Roads

### C. Related Decisions
- **Why Next.js over Vite/CRA?** Next.js 15 with App Router gives us SSG for the shell (instant load, great SEO), built-in image optimization, and Turbopack for fast HMR. The audio simulator itself runs entirely client-side — Next.js doesn't add any server overhead at runtime. All audio components are `'use client'` Client Components.
- **Why Zustand over Redux?** Audio node state is never in React state. Zustand handles only UI-facing state (RPM numbers, selected preset). Redux would be overkill.
- **Why no sample-based playback?** Samples require large file downloads, licensing, and don't scale to arbitrary RPM values. Pure synthesis gives full parametric control.

---

*This spec is a living document. Changes require a comment in the PR referencing the section updated.*