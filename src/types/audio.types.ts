export type FilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'lowshelf'
  | 'highshelf'
  | 'peaking'
  | 'notch'
  | 'allpass';

export type RecordingState = 'idle' | 'recording' | 'stopped';

export type ExportFormat = 'webm' | 'wav';

export interface AnalyserConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

export interface FilterSpec {
  type: FilterType;
  frequency: number;
  Q?: number;
  gain?: number;
}

export interface AudioEngineConfig {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
}

export interface OscillatorConfig {
  type: OscillatorType;
  frequency: number;
  gain: number;
}
