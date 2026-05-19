# Audio Engine Rules

## Golden Rules

1. `AudioContext` is created **once**, on the first user gesture. Never at module load.
2. All `AudioNode` instances live in `AudioEngine.ts` or `OscillatorBank.ts`. Never in React state or Zustand.
3. All parameter changes during playback use `AudioParam` scheduling methods. Never `.value =` on a live param.
4. Every `connect()` has a matching `disconnect()` in cleanup.
5. `AudioContext.currentTime` is the only clock for scheduling. `setTimeout` / `setInterval` are forbidden for audio.

## AudioContext Lifecycle

```ts
// ✅ Initialize on user gesture only
async function initialize(): Promise<void> {
  if (this._context) return;
  this._context = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 });
}

// ✅ Handle suspended state (browser autoplay policy)
async function resume(): Promise<void> {
  if (this._context?.state === 'suspended') {
    await this._context.resume();
  }
}

// ✅ Always check state before scheduling
if (this._context.state !== 'running') return;
```

If `AudioContext` creation fails (permissions denied, unsupported browser): set engine status to `'error'` and render the `<AudioUnsupportedBanner />` component. Do not crash.

## Parameter Scheduling

```ts
// ✅ Smooth transition — always use this
node.gain.setTargetAtTime(targetValue, ctx.currentTime, timeConstant);

// ✅ Immediate but glitch-free — use at node creation only
node.gain.setValueAtTime(value, ctx.currentTime);

// ✅ Precise future scheduling
node.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.1);

// ❌ Causes audio zipper noise during playback
node.gain.value = 0.5;
```

**Time constants by context:**
| Transition | τ (seconds) |
|-----------|-------------|
| Throttle press | `0.05` |
| Throttle release | `0.12` |
| Preset crossfade | `0.20` |
| Cold start ramp | `0.40` |
| Kill engine fade | `0.30` |

## Frequency Computation

```ts
// Fundamental frequency from RPM
export function computeFundamentalFreq(rpm: number, cylinders: number): number {
  return (rpm / 60) * (cylinders / 2);
}

// Harmonic frequency
export function computeHarmonicFreq(f0: number, multiplier: number): number {
  return f0 * multiplier;
}
```

These are pure functions in `src/utils/dsp.utils.ts`. No side effects. Always unit tested.

## OscillatorBank

- Max active `OscillatorNode` instances: **16**.
- All oscillators are started once at initialization and never stopped mid-playback — control amplitude via `GainNode`, frequency via `frequency.setTargetAtTime()`.
- Starting/stopping oscillators mid-play causes clicks. Use gain envelopes instead.

```ts
// ✅ Silence an oscillator — use gain, not stop()
harmonic.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.02);

// ❌ Causes a click artifact
harmonic.oscillator.stop();
```

## Noise Generation

White noise via `AudioWorkletNode` (preferred) or `ScriptProcessorNode` (fallback, deprecated):

```ts
// Combustion noise: bandpass around exhaustResonance Hz
const bandpass = ctx.createBiquadFilter();
bandpass.type = 'bandpass';
bandpass.frequency.value = preset.exhaustResonance;
bandpass.Q.value = 1.2;

// Mechanical noise: highpass at 1kHz
const highpass = ctx.createBiquadFilter();
highpass.type = 'highpass';
highpass.frequency.value = 1000;
```

## Redline Limiter

When `currentRPM >= preset.redlineRPM`:

```ts
// Simulated fuel cut — 6 Hz stutter
const cutCycle = Math.floor(ctx.currentTime * 6) % 2;
masterGain.gain.setTargetAtTime(cutCycle === 0 ? 0.6 : 1.0, ctx.currentTime, 0.01);

// Hard RPM cap
const clampedRPM = Math.min(targetRPM, preset.redlineRPM + 100);
```

## AnalyserNode Setup

Two separate `AnalyserNode`s — one for waveform (oscilloscope), one for FFT (spectrum):

```ts
// Waveform analyser
const waveformAnalyser = ctx.createAnalyser();
waveformAnalyser.fftSize = 2048;

// Spectrum analyser  
const spectrumAnalyser = ctx.createAnalyser();
spectrumAnalyser.fftSize = 2048;
spectrumAnalyser.smoothingTimeConstant = 0.8;
```

Both tap off the master gain node via `connect()`. Do not insert them in the signal chain — they are passive listeners.

## Cleanup Contract

Every module that creates `AudioNode`s must implement `dispose()`:

```ts
dispose(): void {
  this._oscillators.forEach(o => {
    o.gainNode.disconnect();
    o.oscillatorNode.disconnect();
  });
  this._oscillators = [];
}
```

Call `dispose()` in the React hook's `useEffect` cleanup. Failing to do so leaks nodes and causes audio artifacts on remount.

## Error States

| Condition | Response |
|-----------|----------|
| `AudioContext` blocked by autoplay policy | Show "Tap anywhere to enable audio" overlay |
| `AudioContext` creation throws | Set status `'error'`, show `<AudioUnsupportedBanner />` |
| `AudioWorklet` load fails | Fall back to `ScriptProcessorNode`, log warning |
| Preset JSON malformed | Throw typed error, fall back to `inline-4` default |