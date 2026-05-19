import type { EnginePreset, IOscillatorBank } from '@/types/engine.types';
import { OSCILLATOR_BANK } from '@/constants/engine.constants';
import { rpmToFundamentalHz, harmonicFrequency } from '@/utils/dsp.utils';
import { scheduleGainRamp, setValueImmediateAtTime } from '@/utils/audio.utils';

interface HarmonicOscillator {
  readonly oscillator: OscillatorNode;
  readonly gain: GainNode;
}

/**
 * OscillatorBank manages harmonic oscillators for engine simulation.
 *
 * Per audio-engine.md Golden Rule 2: All AudioNode instances live in this module.
 * Per Golden Rule 4: All parameter changes use setTargetAtTime, never .value =
 */
export class OscillatorBank implements IOscillatorBank {
  private _context: AudioContext;
  private _harmonics: HarmonicOscillator[] = [];
  private _masterGain: GainNode;

  constructor(context: AudioContext) {
    this._context = context;
    this._masterGain = context.createGain();
    setValueImmediateAtTime(this._masterGain.gain, 1.0, context);
  }

  /**
   * Initialize oscillators for the given preset.
   * Each harmonic from the preset gets a dedicated oscillator + gain node.
   * All oscillators are started once and never stopped — controlled via gain.
   */
  private _initializeOscillators(preset: EnginePreset): void {
    // Dispose existing oscillators
    this._harmonics.forEach((h) => {
      h.gain.disconnect();
      h.oscillator.disconnect();
    });
    this._harmonics = [];

    const numHarmonics = Math.min(preset.harmonics.length, OSCILLATOR_BANK.MAX_OSCILLATORS);

    for (let i = 0; i < numHarmonics; i++) {
      const harmonic = preset.harmonics[i];
      if (harmonic === undefined) continue;

      const oscillator = this._context.createOscillator();
      const gainNode = this._context.createGain();

      // Start oscillators immediately — they'll be controlled by gain
      setValueImmediateAtTime(oscillator.frequency, 100, this._context);
      oscillator.type = 'sine';

      // Set initial gain to zero for smoothing on first update
      setValueImmediateAtTime(gainNode.gain, 0, this._context);

      oscillator.connect(gainNode);
      gainNode.connect(this._masterGain);

      oscillator.start();

      this._harmonics.push({ oscillator, gain: gainNode });
    }
  }

  /**
   * Update oscillator frequencies and gains based on current RPM and preset.
   * Per audio-engine.md Golden Rule 4: Use setTargetAtTime for smooth transitions.
   *
   * Frequency: fundamental × harmonic multiplier
   * Gain: harmonic amplitude × preset pattern
   */
  update(rpm: number, preset: EnginePreset): void {
    if (this._harmonics.length === 0) {
      this._initializeOscillators(preset);
    }

    const fundamental = rpmToFundamentalHz(rpm, preset.cylinders);

    // Update each harmonic oscillator
    this._harmonics.forEach((harmonic, index) => {
      const harmonicConfig = preset.harmonics[index];
      if (harmonicConfig === undefined) return;

      const targetFreq = harmonicFrequency(fundamental, harmonicConfig.harmonic);
      const targetGain = harmonicConfig.amplitude;

      // Frequency ramp: use linear ramp over ~50ms for smooth tracking
      harmonic.oscillator.frequency.linearRampToValueAtTime(
        targetFreq,
        this._context.currentTime + 0.05,
      );

      // Gain ramp: smooth envelope over ~50ms
      scheduleGainRamp(harmonic.gain, targetGain, this._context, 0.05);
    });
  }

  /**
   * Connect this oscillator bank's output to an audio destination.
   * The destination is typically a filter chain or master gain node.
   */
  connect(destination: AudioNode): void {
    this._masterGain.connect(destination);
  }

  /**
   * Disconnect all oscillators from their destinations.
   * Per audio-engine.md Golden Rule 4: every connect() has a matching disconnect().
   */
  disconnect(): void {
    this._masterGain.disconnect();
  }

  /**
   * Clean up all oscillator nodes and gain nodes.
   * Per audio-engine.md cleanup contract: implement dispose() to prevent node leaks.
   */
  dispose(): void {
    this._harmonics.forEach((h) => {
      h.oscillator.stop();
      h.oscillator.disconnect();
      h.gain.disconnect();
    });
    this._harmonics = [];
    this._masterGain.disconnect();
  }

  get masterGain(): GainNode {
    return this._masterGain;
  }
}
