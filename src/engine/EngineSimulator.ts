import type { IEngineSimulator, EnginePreset } from '@/types/engine.types';
import { RPM, TIME_CONSTANTS, REDLINE_LIMITER } from '@/constants/engine.constants';
import { clamp } from '@/utils/dsp.utils';
import { scheduleGainRamp } from '@/utils/audio.utils';
import type { AudioEngine } from '@/engine/AudioEngine';
import { OscillatorBank } from '@/engine/OscillatorBank';
import { NoiseGenerator } from '@/engine/NoiseGenerator';
import { FilterChain } from '@/engine/FilterChain';

export class EngineSimulator implements IEngineSimulator {
  private readonly _audioEngine: AudioEngine;
  private _oscillatorBank: OscillatorBank | null = null;
  private _noiseGenerator: NoiseGenerator | null = null;
  private _filterChain: FilterChain | null = null;
  private _preset: EnginePreset | null = null;
  private _currentRPM = 0;
  private _targetRPM = 0;
  private _rafId: number | null = null;
  private _redlineCutPhase = 0;
  private _isRunning = false;

  constructor(audioEngine: AudioEngine) {
    this._audioEngine = audioEngine;
  }

  private _buildSignalChain(preset: EnginePreset): void {
    const ctx = this._audioEngine.context;
    const masterGain = this._audioEngine.masterGain;

    // Tear down previous chain
    this._oscillatorBank?.dispose();
    this._noiseGenerator?.dispose();
    this._filterChain?.dispose();

    this._filterChain = new FilterChain(ctx);
    this._oscillatorBank = new OscillatorBank(ctx);
    this._noiseGenerator = new NoiseGenerator(ctx, preset.exhaustResonance);

    // Signal flow: oscillators → filter chain → master gain
    //              noise       → filter chain → master gain
    this._oscillatorBank.connect(this._filterChain.input);
    this._noiseGenerator.connect(this._filterChain.input);
    this._filterChain.connect(masterGain);

    // Prime noise levels from preset
    this._noiseGenerator.setCombustionLevel(preset.combustionNoiseLevel);
    this._noiseGenerator.setMechanicalLevel(preset.mechanicalNoiseLevel);
  }

  loadPreset(preset: EnginePreset): void {
    this._preset = preset;

    if (this._audioEngine.state !== 'running') return;

    const wasRunning = this._isRunning;

    this._buildSignalChain(preset);

    // Resume RPM update loop if engine was active
    if (wasRunning) {
      this._startRPMLoop();
    }
  }

  setTargetRPM(rpm: number): void {
    if (!this._preset) return;

    const clamped = clamp(rpm, 0, this._preset.redlineRPM + RPM.REDLINE_LIMITER_BUFFER);
    this._targetRPM = clamped;
  }

  coldStart(): void {
    if (!this._preset || this._audioEngine.state !== 'running') return;

    if (!this._oscillatorBank) {
      this._buildSignalChain(this._preset);
    }

    this._isRunning = true;

    // Spike to cold-start RPM then settle to idle
    this._currentRPM = RPM.COLD_START_SPIKE;
    this._targetRPM = this._preset.idleRPM;

    this._startRPMLoop();
  }

  killEngine(): void {
    this._isRunning = false;
    this._targetRPM = 0;

    if (!this._audioEngine.context || !this._audioEngine.masterGain) return;

    // Fade out master gain over KILL_ENGINE_FADE seconds, then stop the loop
    const ctx = this._audioEngine.context;
    const masterGain = this._audioEngine.masterGain;

    scheduleGainRamp(masterGain, 0, ctx, TIME_CONSTANTS.KILL_ENGINE_FADE);

    const stopDelay = TIME_CONSTANTS.KILL_ENGINE_FADE * 5 * 1000;
    setTimeout(() => {
      this._stopRPMLoop();
      this._currentRPM = 0;
      // Restore master gain for next cold start
      masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
    }, stopDelay);
  }

  private _startRPMLoop(): void {
    this._stopRPMLoop();
    const tick = (): void => {
      this._updateFrame();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  private _stopRPMLoop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  private _updateFrame(): void {
    const preset = this._preset;
    if (!preset || !this._oscillatorBank || !this._noiseGenerator || !this._filterChain) return;
    if (this._audioEngine.state !== 'running') return;

    const ctx = this._audioEngine.context;

    // Interpolate RPM toward target using preset acceleration/deceleration rates
    const delta = this._targetRPM - this._currentRPM;
    const rate = delta > 0 ? preset.accelerationRate : preset.decelerationRate;
    // Rate is in RPM/s; rAF fires ~60 times/s → dt ≈ 1/60
    this._currentRPM = clamp(
      this._currentRPM + delta * (1 / 60) * rate,
      0,
      preset.redlineRPM + RPM.REDLINE_LIMITER_BUFFER,
    );

    const rpm = this._currentRPM;

    // Redline limiter: fuel-cut stutter
    if (rpm >= preset.redlineRPM) {
      this._redlineCutPhase =
        Math.floor(ctx.currentTime * REDLINE_LIMITER.FUEL_CUT_FREQUENCY_HZ) % 2;
      const cutGain =
        this._redlineCutPhase === 0 ? REDLINE_LIMITER.GAIN_CUT : REDLINE_LIMITER.GAIN_FULL;
      scheduleGainRamp(this._audioEngine.masterGain, cutGain, ctx, TIME_CONSTANTS.FUEL_CUT);
    } else {
      // Restore gain when below redline
      scheduleGainRamp(this._audioEngine.masterGain, 0.5, ctx, TIME_CONSTANTS.THROTTLE_RELEASE);
    }

    this._oscillatorBank.update(rpm, preset);
    this._filterChain.updateForRPM(rpm, preset);

    // Scale noise with RPM: louder toward redline
    const rpmNorm = clamp((rpm - preset.idleRPM) / (preset.redlineRPM - preset.idleRPM), 0, 1);
    this._noiseGenerator.setCombustionLevel(preset.combustionNoiseLevel * (0.4 + 0.6 * rpmNorm));
    this._noiseGenerator.setMechanicalLevel(preset.mechanicalNoiseLevel * (0.3 + 0.7 * rpmNorm));
  }

  get currentRPM(): number {
    return this._currentRPM;
  }

  dispose(): void {
    this._stopRPMLoop();
    this._oscillatorBank?.dispose();
    this._noiseGenerator?.dispose();
    this._filterChain?.dispose();
    this._oscillatorBank = null;
    this._noiseGenerator = null;
    this._filterChain = null;
    this._preset = null;
    this._isRunning = false;
    this._currentRPM = 0;
    this._targetRPM = 0;
  }
}
