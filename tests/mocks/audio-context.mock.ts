import { vi } from 'vitest';

export interface MockAudioParam {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  setTargetAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
}

export interface MockAudioNode {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

export interface MockGainNode extends MockAudioNode {
  gain: MockAudioParam;
}

export interface MockOscillatorNode extends MockAudioNode {
  frequency: MockAudioParam;
  detune: MockAudioParam;
  type: OscillatorType;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

export interface MockBiquadFilterNode extends MockAudioNode {
  frequency: MockAudioParam;
  Q: MockAudioParam;
  gain: MockAudioParam;
  type: BiquadFilterType;
}

export interface MockAnalyserNode extends MockAudioNode {
  fftSize: number;
  smoothingTimeConstant: number;
  frequencyBinCount: number;
  getByteTimeDomainData: ReturnType<typeof vi.fn>;
  getByteFrequencyData: ReturnType<typeof vi.fn>;
  getFloatFrequencyData: ReturnType<typeof vi.fn>;
}

export interface MockAudioBufferSourceNode extends MockAudioNode {
  buffer: AudioBuffer | null;
  loop: boolean;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function createMockAudioParam(initialValue = 0): MockAudioParam {
  return {
    value: initialValue,
    setValueAtTime: vi.fn().mockReturnThis(),
    setTargetAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
  };
}

function createMockAudioNode(): MockAudioNode {
  return {
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
}

export function createMockGainNode(): MockGainNode {
  return {
    ...createMockAudioNode(),
    gain: createMockAudioParam(1),
  };
}

export function createMockOscillatorNode(): MockOscillatorNode {
  return {
    ...createMockAudioNode(),
    frequency: createMockAudioParam(440),
    detune: createMockAudioParam(0),
    type: 'sine' as OscillatorType,
    start: vi.fn(),
    stop: vi.fn(),
  };
}

export function createMockBiquadFilterNode(): MockBiquadFilterNode {
  return {
    ...createMockAudioNode(),
    frequency: createMockAudioParam(350),
    Q: createMockAudioParam(1),
    gain: createMockAudioParam(0),
    type: 'lowpass' as BiquadFilterType,
  };
}

export function createMockAnalyserNode(): MockAnalyserNode {
  return {
    ...createMockAudioNode(),
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteTimeDomainData: vi.fn((arr: Uint8Array) => arr.fill(128)),
    getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(0)),
    getFloatFrequencyData: vi.fn((arr: Float32Array) => arr.fill(-100)),
  };
}

export function createMockBufferSourceNode(): MockAudioBufferSourceNode {
  return {
    ...createMockAudioNode(),
    buffer: null,
    loop: false,
    start: vi.fn(),
    stop: vi.fn(),
  };
}

export interface MockAudioContext {
  state: AudioContextState;
  currentTime: number;
  sampleRate: number;
  destination: MockAudioNode;
  createGain: ReturnType<typeof vi.fn>;
  createOscillator: ReturnType<typeof vi.fn>;
  createBiquadFilter: ReturnType<typeof vi.fn>;
  createAnalyser: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  suspend: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

export function createMockAudioContext(): MockAudioContext {
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: createMockAudioNode(),
    createGain: vi.fn(() => createMockGainNode()),
    createOscillator: vi.fn(() => createMockOscillatorNode()),
    createBiquadFilter: vi.fn(() => createMockBiquadFilterNode()),
    createAnalyser: vi.fn(() => createMockAnalyserNode()),
    createBufferSource: vi.fn(() => createMockBufferSourceNode()),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

export function setupAudioMock(): MockAudioContext {
  const mockCtx = createMockAudioContext();
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => mockCtx),
  );
  return mockCtx;
}
