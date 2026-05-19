export type EngineType = 'inline-4' | 'v6-smooth' | 'v8-muscle' | 'v12-exotic' | 'rotary';

export type EngineLifecycleState = 'uninitialized' | 'running' | 'suspended';

export interface HarmonicPartial {
  harmonic: number;
  amplitude: number;
}

export interface RPMCurvePoint {
  rpm: number;
  value: number;
}

export interface EnginePreset {
  id: EngineType;
  name: string;
  cylinders: number;
  idleRPM: number;
  redlineRPM: number;
  firingFactor: number;
  harmonics: HarmonicPartial[];
  exhaustResonance: number;
  accelerationRate: number;
  decelerationRate: number;
  combustionNoiseLevel: number;
  mechanicalNoiseLevel: number;
  filterCurves?: RPMCurvePoint[][];
}

export interface IAudioEngine {
  initialize(): Promise<void>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  setMasterVolume(value: number): void;
  readonly context: AudioContext;
  readonly state: EngineLifecycleState;
}

export interface IEngineSimulator {
  loadPreset(preset: EnginePreset): void;
  setTargetRPM(rpm: number): void;
  coldStart(): void;
  killEngine(): void;
  readonly currentRPM: number;
}

export interface IOscillatorBank {
  update(rpm: number, preset: EnginePreset): void;
  connect(destination: AudioNode): void;
  disconnect(): void;
  dispose(): void;
}

export interface INoiseGenerator {
  connect(destination: AudioNode): void;
  disconnect(): void;
  dispose(): void;
  setCombustionLevel(level: number): void;
  setMechanicalLevel(level: number): void;
}

export interface IFilterChain {
  connect(destination: AudioNode): void;
  disconnect(): void;
  dispose(): void;
  updateForRPM(rpm: number, preset: EnginePreset): void;
}
