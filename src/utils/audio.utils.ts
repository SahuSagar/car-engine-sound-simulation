import type { FilterSpec } from '@/types/audio.types';
import { ANALYSER, AUDIO_CONTEXT, NOISE } from '@/constants/engine.constants';

/**
 * Create and configure a BiquadFilterNode.
 * Used for combustion noise (bandpass), mechanical noise (highpass), etc.
 */
export function createAndConfigureBiquadFilter(
  context: AudioContext,
  spec: FilterSpec,
): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = spec.type;
  filter.frequency.value = spec.frequency;

  if (spec.Q !== undefined) {
    filter.Q.value = spec.Q;
  }
  if (spec.gain !== undefined) {
    filter.gain.value = spec.gain;
  }

  return filter;
}

/**
 * Create a combustion noise bandpass filter at exhaustResonance frequency.
 * Per audio-engine.md: bandpass centered around exhaust resonance.
 */
export function createCombustionNoiseFilter(
  context: AudioContext,
  exhaustResonanceHz: number,
): BiquadFilterNode {
  return createAndConfigureBiquadFilter(context, {
    type: 'bandpass',
    frequency: exhaustResonanceHz,
    Q: NOISE.COMBUSTION_BANDPASS_Q,
  });
}

/**
 * Create a mechanical noise highpass filter at 1kHz.
 * Per audio-engine.md: highpass at 1kHz for mechanical noise floor.
 */
export function createMechanicalNoiseFilter(context: AudioContext): BiquadFilterNode {
  return createAndConfigureBiquadFilter(context, {
    type: 'highpass',
    frequency: NOISE.MECHANICAL_HIGHPASS_HZ,
  });
}

/**
 * Create and configure an AnalyserNode for waveform visualization.
 * Tapped off master gain, not inserted in signal chain.
 */
export function createWaveformAnalyser(context: AudioContext): AnalyserNode {
  const analyser = context.createAnalyser();
  analyser.fftSize = ANALYSER.WAVEFORM_FFT_SIZE;
  return analyser;
}

/**
 * Create and configure an AnalyserNode for FFT spectrum visualization.
 * Higher smoothing constant (0.8) for stable spectrum display.
 */
export function createSpectrumAnalyser(context: AudioContext): AnalyserNode {
  const analyser = context.createAnalyser();
  analyser.fftSize = ANALYSER.SPECTRUM_FFT_SIZE;
  analyser.smoothingTimeConstant = ANALYSER.SPECTRUM_SMOOTHING;
  return analyser;
}

/**
 * Get current waveform data from analyser as Uint8Array.
 */
export function getWaveformData(analyser: AnalyserNode): Uint8Array {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  return data;
}

/**
 * Get current frequency spectrum (FFT) data from analyser as Uint8Array.
 */
export function getSpectrumData(analyser: AnalyserNode): Uint8Array {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}

/**
 * Schedule a smooth gain transition using exponential ramp.
 * Follows audio-engine.md § Parameter Scheduling: use setTargetAtTime for smooth transitions.
 *
 * @param gainNode - Target gain node
 * @param targetValue - Target gain (0–1)
 * @param context - AudioContext for currentTime reference
 * @param timeConstant - Time constant in seconds (τ)
 */
export function scheduleGainRamp(
  gainNode: GainNode,
  targetValue: number,
  context: AudioContext,
  timeConstant: number,
): void {
  gainNode.gain.setTargetAtTime(targetValue, context.currentTime, timeConstant);
}

/**
 * Schedule a frequency ramp using linear interpolation.
 * Used for RPM tracking, cold start sweeps, etc.
 *
 * @param oscillator - Target oscillator node
 * @param targetFreq - Target frequency in Hz
 * @param context - AudioContext for currentTime reference
 * @param duration - Ramp duration in seconds
 */
export function scheduleFrequencyRamp(
  oscillator: OscillatorNode,
  targetFreq: number,
  context: AudioContext,
  duration: number,
): void {
  oscillator.frequency.linearRampToValueAtTime(targetFreq, context.currentTime + duration);
}

/**
 * Set a parameter to a value immediately (glitch-free).
 * ONLY use at node creation time. Never during playback.
 */
export function setValueImmediateAtTime(
  param: AudioParam,
  value: number,
  context: AudioContext,
): void {
  param.setValueAtTime(value, context.currentTime);
}

/**
 * Disconnect an audio node and its input connections.
 * Used in dispose() cleanup methods.
 */
export function disconnectNode(node: AudioNode): void {
  node.disconnect();
}

/**
 * Connect multiple output nodes to the same destination.
 * Convenience for connecting noise sources, harmonics, etc. to a mixer.
 */
export function connectNodeArrayToDestination(
  sources: readonly AudioNode[],
  destination: AudioNode,
): void {
  sources.forEach((source) => {
    source.connect(destination);
  });
}

/**
 * Validate that AudioContext is available and supported.
 * Returns true if Web Audio API is available in the current browser.
 */
export function isAudioContextSupported(): boolean {
  return (
    typeof AudioContext !== 'undefined' ||
    typeof (window as unknown as Record<string, unknown>).webkitAudioContext !== 'undefined'
  );
}

/**
 * Get the correct AudioContext constructor, handling webkit prefix fallback.
 */
export function getAudioContextConstructor(): typeof AudioContext {
  return typeof AudioContext !== 'undefined'
    ? AudioContext
    : ((window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext);
}

/**
 * Create an AudioContext with RevSim defaults.
 * Per audio-engine.md: interactive latency, 44.1kHz sample rate.
 * Only called on user gesture (see audio-engine.md Golden Rule 1).
 */
export function createAudioContext(): AudioContext {
  const ContextConstructor = getAudioContextConstructor();
  return new ContextConstructor({
    latencyHint: AUDIO_CONTEXT.LATENCY_HINT as AudioContextLatencyCategory,
    sampleRate: AUDIO_CONTEXT.SAMPLE_RATE,
  });
}

/**
 * Check if an AudioContext is in a suspended state (browser autoplay policy).
 * If suspended, call context.resume() on next user gesture.
 */
export function isAudioContextSuspended(context: AudioContext): boolean {
  return context.state === 'suspended';
}

/**
 * Resume an AudioContext from suspended state.
 * Call on user gesture (tap, click, etc.).
 */
export async function resumeAudioContext(context: AudioContext): Promise<void> {
  if (context.state === 'suspended') {
    await context.resume();
  }
}

/**
 * Get human-readable error message for AudioContext creation failure.
 */
export function getAudioContextErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'SecurityError') {
      return 'Audio access denied by browser security policy.';
    }
    if (error.name === 'NotSupportedError') {
      return 'AudioContext not supported in this browser.';
    }
  }
  if (error instanceof TypeError) {
    return 'Invalid AudioContext configuration.';
  }
  return 'Failed to initialize audio context.';
}
