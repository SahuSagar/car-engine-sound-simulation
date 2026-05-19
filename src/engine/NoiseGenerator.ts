import type { INoiseGenerator } from '@/types/engine.types';
import { NOISE, TIME_CONSTANTS } from '@/constants/engine.constants';
import {
  createCombustionNoiseFilter,
  createMechanicalNoiseFilter,
  scheduleGainRamp,
  setValueImmediateAtTime,
} from '@/utils/audio.utils';

const NOISE_BUFFER_SECONDS = 2;

export class NoiseGenerator implements INoiseGenerator {
  private _context: AudioContext;
  private _combustionGain: GainNode;
  private _mechanicalGain: GainNode;
  private _masterGain: GainNode;
  private _combustionFilter: BiquadFilterNode;
  private _mechanicalFilter: BiquadFilterNode;
  private _combustionSource: AudioBufferSourceNode | null = null;
  private _mechanicalSource: AudioBufferSourceNode | null = null;

  constructor(context: AudioContext, exhaustResonanceHz: number) {
    this._context = context;

    this._masterGain = context.createGain();
    setValueImmediateAtTime(this._masterGain.gain, 1.0, context);

    this._combustionFilter = createCombustionNoiseFilter(context, exhaustResonanceHz);
    this._mechanicalFilter = createMechanicalNoiseFilter(context);

    this._combustionGain = context.createGain();
    setValueImmediateAtTime(this._combustionGain.gain, 0, context);

    this._mechanicalGain = context.createGain();
    setValueImmediateAtTime(this._mechanicalGain.gain, 0, context);

    this._combustionFilter.connect(this._combustionGain);
    this._combustionGain.connect(this._masterGain);

    this._mechanicalFilter.connect(this._mechanicalGain);
    this._mechanicalGain.connect(this._masterGain);

    this._startNoiseSources();
  }

  private _createWhiteNoiseBuffer(): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = sampleRate * NOISE_BUFFER_SECONDS;
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private _createLoopingSource(destination: AudioNode): AudioBufferSourceNode {
    const source = this._context.createBufferSource();
    source.buffer = this._createWhiteNoiseBuffer();
    source.loop = true;
    source.connect(destination);
    source.start();
    return source;
  }

  private _startNoiseSources(): void {
    this._combustionSource = this._createLoopingSource(this._combustionFilter);
    this._mechanicalSource = this._createLoopingSource(this._mechanicalFilter);
  }

  setCombustionLevel(level: number): void {
    scheduleGainRamp(this._combustionGain, level, this._context, TIME_CONSTANTS.THROTTLE_PRESS);
  }

  setMechanicalLevel(level: number): void {
    scheduleGainRamp(this._mechanicalGain, level, this._context, TIME_CONSTANTS.THROTTLE_PRESS);
  }

  updateExhaustResonance(exhaustResonanceHz: number): void {
    this._combustionFilter.frequency.setTargetAtTime(
      exhaustResonanceHz,
      this._context.currentTime,
      TIME_CONSTANTS.PRESET_CROSSFADE,
    );
    this._combustionFilter.Q.setTargetAtTime(
      NOISE.COMBUSTION_BANDPASS_Q,
      this._context.currentTime,
      TIME_CONSTANTS.PRESET_CROSSFADE,
    );
  }

  connect(destination: AudioNode): void {
    this._masterGain.connect(destination);
  }

  disconnect(): void {
    this._masterGain.disconnect();
  }

  dispose(): void {
    this._combustionSource?.stop();
    this._combustionSource?.disconnect();
    this._mechanicalSource?.stop();
    this._mechanicalSource?.disconnect();
    this._combustionFilter.disconnect();
    this._mechanicalFilter.disconnect();
    this._combustionGain.disconnect();
    this._mechanicalGain.disconnect();
    this._masterGain.disconnect();
    this._combustionSource = null;
    this._mechanicalSource = null;
  }
}
