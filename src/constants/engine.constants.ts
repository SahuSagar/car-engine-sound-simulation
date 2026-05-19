import type { EngineType } from '@/types/engine.types';

export const AUDIO_CONTEXT = {
  SAMPLE_RATE: 44100,
  LATENCY_HINT: 'interactive',
} as const;

export const RPM = {
  ABSOLUTE_MIN: 0,
  ABSOLUTE_MAX: 9500,
  COLD_START_SPIKE: 1200,
  GAUGE_REDLINE_BUFFER: 500,
  REDLINE_WARNING_RATIO: 0.9,
  REDLINE_LIMITER_BUFFER: 100,
} as const;

export const RPM_DEFAULTS = {
  'inline-4': { idle: 750, redline: 7200 },
  'v6-smooth': { idle: 650, redline: 6800 },
  'v8-muscle': { idle: 800, redline: 6500 },
  'v12-exotic': { idle: 600, redline: 8500 },
  rotary: { idle: 900, redline: 9000 },
} as const satisfies Record<EngineType, { readonly idle: number; readonly redline: number }>;

export const TIME_CONSTANTS = {
  THROTTLE_PRESS: 0.05,
  THROTTLE_RELEASE: 0.12,
  PRESET_CROSSFADE: 0.2,
  COLD_START_RAMP: 0.4,
  KILL_ENGINE_FADE: 0.3,
  FUEL_CUT: 0.01,
} as const;

export const OSCILLATOR_BANK = {
  MAX_OSCILLATORS: 16,
} as const;

export const ANALYSER = {
  WAVEFORM_FFT_SIZE: 2048,
  SPECTRUM_FFT_SIZE: 2048,
  SPECTRUM_SMOOTHING: 0.8,
  SPECTRUM_MIN_HZ: 20,
  SPECTRUM_MAX_HZ: 8000,
} as const;

export const NOISE = {
  COMBUSTION_BANDPASS_Q: 1.2,
  MECHANICAL_HIGHPASS_HZ: 1000,
} as const;

export const REDLINE_LIMITER = {
  FUEL_CUT_FREQUENCY_HZ: 6,
  GAIN_CUT: 0.6,
  GAIN_FULL: 1.0,
} as const;

export const AUDIO_DEFAULTS = {
  MASTER_VOLUME: 0.7,
  MAX_ACTIVE_NODES: 20,
} as const;

export const RECORDING = {
  MAX_DURATION_S: 30,
} as const;
