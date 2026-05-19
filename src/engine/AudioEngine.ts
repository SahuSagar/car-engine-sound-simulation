import type { IAudioEngine } from '@/types/engine.types';
import type { EngineLifecycleState } from '@/types/engine.types';
import type { AudioEngineConfig } from '@/types/audio.types';

export class AudioEngine implements IAudioEngine {
  private _context: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _state: EngineLifecycleState = 'uninitialized';
  private _config: Required<AudioEngineConfig>;

  constructor(config: AudioEngineConfig = {}) {
    this._config = {
      sampleRate: config.sampleRate ?? 44100,
      latencyHint: config.latencyHint ?? 'interactive',
    };
  }

  async initialize(): Promise<void> {
    if (this._context) return;

    try {
      // AudioContext constructor is synchronous, but we keep async for API consistency
      // and to allow future async initialization logic (e.g., AudioWorklet setup)
      await Promise.resolve();

      this._context = new AudioContext({
        latencyHint: this._config.latencyHint,
        sampleRate: this._config.sampleRate,
      });

      this._masterGain = this._context.createGain();
      this._masterGain.gain.value = 0.5;
      this._masterGain.connect(this._context.destination);

      this._state = 'running';
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      this._state = 'uninitialized';
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this._context) {
      await this.initialize();
      return;
    }

    if (this._context.state === 'suspended') {
      try {
        await this._context.resume();
        this._state = 'running';
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        throw error;
      }
    }
  }

  async suspend(): Promise<void> {
    if (!this._context || this._context.state === 'suspended') return;

    try {
      await this._context.suspend();
      this._state = 'suspended';
    } catch (error) {
      console.error('Failed to suspend AudioContext:', error);
      throw error;
    }
  }

  setMasterVolume(value: number): void {
    if (!this._masterGain || !this._context) return;

    const clampedValue = Math.max(0, Math.min(1, value));
    this._masterGain.gain.setTargetAtTime(clampedValue, this._context.currentTime, 0.05);
  }

  get context(): AudioContext {
    if (!this._context) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }
    return this._context;
  }

  get masterGain(): GainNode {
    if (!this._masterGain) {
      throw new Error('Master gain not initialized. Call initialize() first.');
    }
    return this._masterGain;
  }

  get state(): EngineLifecycleState {
    return this._state;
  }
}
