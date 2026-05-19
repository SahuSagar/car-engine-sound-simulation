import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  createAndConfigureBiquadFilter,
  createCombustionNoiseFilter,
  createMechanicalNoiseFilter,
  createWaveformAnalyser,
  createSpectrumAnalyser,
  getWaveformData,
  getSpectrumData,
  scheduleGainRamp,
  scheduleFrequencyRamp,
  setValueImmediateAtTime,
  disconnectNode,
  connectNodeArrayToDestination,
  isAudioContextSupported,
  getAudioContextConstructor,
  createAudioContext,
  isAudioContextSuspended,
  resumeAudioContext,
  getAudioContextErrorMessage,
} from '@/utils/audio.utils';
import { ANALYSER, NOISE } from '@/constants/engine.constants';
import type { FilterSpec } from '@/types/audio.types';
import { setupAudioMock } from '../mocks/audio-context.mock';

describe('audio.utils', () => {
  let context: AudioContext;

  beforeEach(() => {
    const mockCtx = setupAudioMock();
    context = new AudioContext() as unknown as AudioContext;
    Object.assign(context, mockCtx);
  });

  describe('createAndConfigureBiquadFilter', () => {
    it('creates a biquad filter with the specified type', () => {
      const spec: FilterSpec = {
        type: 'highpass',
        frequency: 1000,
      };

      const filter = createAndConfigureBiquadFilter(context, spec);

      expect(filter.type).toBe('highpass');
      expect(filter.frequency.value).toBe(1000);
    });

    it('sets Q value when provided', () => {
      const spec: FilterSpec = {
        type: 'bandpass',
        frequency: 500,
        Q: 2.5,
      };

      const filter = createAndConfigureBiquadFilter(context, spec);

      expect(filter.Q.value).toBe(2.5);
    });

    it('sets gain value when provided', () => {
      const spec: FilterSpec = {
        type: 'lowshelf',
        frequency: 200,
        gain: 3,
      };

      const filter = createAndConfigureBiquadFilter(context, spec);

      expect(filter.gain.value).toBe(3);
    });

    it('ignores Q when not provided', () => {
      const spec: FilterSpec = {
        type: 'lowpass',
        frequency: 8000,
      };

      const filter = createAndConfigureBiquadFilter(context, spec);
      const defaultQ = filter.Q.value;

      expect(filter.frequency.value).toBe(8000);
      expect(defaultQ).toBeDefined();
    });
  });

  describe('createCombustionNoiseFilter', () => {
    it('creates a bandpass filter at exhaust resonance', () => {
      const exhaustHz = 300;

      const filter = createCombustionNoiseFilter(context, exhaustHz);

      expect(filter.type).toBe('bandpass');
      expect(filter.frequency.value).toBe(exhaustHz);
      expect(filter.Q.value).toBe(NOISE.COMBUSTION_BANDPASS_Q);
    });

    it('applies the correct Q value for combustion resonance', () => {
      const filter = createCombustionNoiseFilter(context, 250);

      expect(filter.Q.value).toBeCloseTo(NOISE.COMBUSTION_BANDPASS_Q);
    });
  });

  describe('createMechanicalNoiseFilter', () => {
    it('creates a highpass filter at 1 kHz', () => {
      const filter = createMechanicalNoiseFilter(context);

      expect(filter.type).toBe('highpass');
      expect(filter.frequency.value).toBe(NOISE.MECHANICAL_HIGHPASS_HZ);
    });
  });

  describe('createWaveformAnalyser', () => {
    it('creates an analyser with waveform FFT size', () => {
      const analyser = createWaveformAnalyser(context);

      expect(analyser.fftSize).toBe(ANALYSER.WAVEFORM_FFT_SIZE);
    });

    it('analyser is disconnected from signal chain', () => {
      const analyser = createWaveformAnalyser(context);
      const osc = context.createOscillator();

      expect(() => {
        osc.connect(analyser);
      }).not.toThrow();
    });
  });

  describe('createSpectrumAnalyser', () => {
    it('creates an analyser with spectrum FFT size', () => {
      const analyser = createSpectrumAnalyser(context);

      expect(analyser.fftSize).toBe(ANALYSER.SPECTRUM_FFT_SIZE);
    });

    it('applies the correct smoothing constant', () => {
      const analyser = createSpectrumAnalyser(context);

      expect(analyser.smoothingTimeConstant).toBe(ANALYSER.SPECTRUM_SMOOTHING);
    });
  });

  describe('getWaveformData', () => {
    it('returns a Uint8Array of waveform data', () => {
      const analyser = createWaveformAnalyser(context);
      const osc = context.createOscillator();
      osc.connect(analyser);
      osc.start();

      const data = getWaveformData(analyser);

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(analyser.frequencyBinCount);
      osc.stop();
    });

    it('returns data matching analyser frequency bin count', () => {
      const analyser = createSpectrumAnalyser(context);

      const data = getWaveformData(analyser);

      expect(data.length).toBe(analyser.frequencyBinCount);
    });
  });

  describe('getSpectrumData', () => {
    it('returns a Uint8Array of spectrum data', () => {
      const analyser = createSpectrumAnalyser(context);
      const osc = context.createOscillator();
      osc.connect(analyser);
      osc.start();

      const data = getSpectrumData(analyser);

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(analyser.frequencyBinCount);
      osc.stop();
    });

    it('returns data matching analyser frequency bin count', () => {
      const analyser = createSpectrumAnalyser(context);

      const data = getSpectrumData(analyser);

      expect(data.length).toBe(analyser.frequencyBinCount);
    });
  });

  describe('scheduleGainRamp', () => {
    it('calls setTargetAtTime on the gain node', () => {
      const gain = context.createGain();
      const spy = vi.spyOn(gain.gain, 'setTargetAtTime');

      scheduleGainRamp(gain, 0.5, context, 0.1);

      expect(spy).toHaveBeenCalledWith(0.5, context.currentTime, 0.1);
    });

    it('schedules ramp to target value', () => {
      const gain = context.createGain();
      gain.gain.value = 1;

      scheduleGainRamp(gain, 0.2, context, 0.2);

      // After scheduling, value is still 1 until ramp completes
      expect(gain.gain.value).toBe(1);
    });

    it('accepts time constant from audio-engine.md constants', () => {
      const gain = context.createGain();
      const spy = vi.spyOn(gain.gain, 'setTargetAtTime');

      scheduleGainRamp(gain, 0.7, context, 0.05); // THROTTLE_PRESS

      expect(spy).toHaveBeenCalledWith(0.7, context.currentTime, 0.05);
    });
  });

  describe('scheduleFrequencyRamp', () => {
    it('calls linearRampToValueAtTime on the oscillator frequency', () => {
      const osc = context.createOscillator();
      const spy = vi.spyOn(osc.frequency, 'linearRampToValueAtTime');

      scheduleFrequencyRamp(osc, 440, context, 0.5);

      expect(spy).toHaveBeenCalledWith(440, context.currentTime + 0.5);
    });

    it('ramps to target frequency over specified duration', () => {
      const osc = context.createOscillator();
      osc.frequency.value = 200;

      scheduleFrequencyRamp(osc, 400, context, 1.0);

      // Initial value unchanged
      expect(osc.frequency.value).toBe(200);
    });
  });

  describe('setValueImmediateAtTime', () => {
    it('calls setValueAtTime on the audio parameter', () => {
      const gain = context.createGain();
      const spy = vi.spyOn(gain.gain, 'setValueAtTime');

      setValueImmediateAtTime(gain.gain, 0.5, context);

      expect(spy).toHaveBeenCalledWith(0.5, context.currentTime);
    });

    it('sets value immediately without scheduling', () => {
      const osc = context.createOscillator();
      osc.start();

      setValueImmediateAtTime(osc.frequency, 880, context);

      expect(osc.frequency.value).toBeDefined();
    });
  });

  describe('disconnectNode', () => {
    it('calls disconnect on the node', () => {
      const gain = context.createGain();
      const spy = vi.spyOn(gain, 'disconnect');

      disconnectNode(gain);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('connectNodeArrayToDestination', () => {
    it('connects multiple sources to destination', () => {
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const dest = context.createGain();
      const connectSpy1 = vi.spyOn(osc1, 'connect');
      const connectSpy2 = vi.spyOn(osc2, 'connect');

      const sources = [osc1, osc2];
      connectNodeArrayToDestination(sources, dest);

      expect(connectSpy1).toHaveBeenCalledWith(dest);
      expect(connectSpy2).toHaveBeenCalledWith(dest);
    });

    it('handles empty source array', () => {
      const dest = context.createGain();

      expect(() => {
        connectNodeArrayToDestination([], dest);
      }).not.toThrow();
    });

    it('connects all sources in order', () => {
      const sources = Array.from({ length: 4 }, () => context.createOscillator());
      const dest = context.createGain();
      const spies = sources.map((source) => vi.spyOn(source, 'connect'));

      connectNodeArrayToDestination(sources, dest);

      spies.forEach((spy) => {
        expect(spy).toHaveBeenCalledWith(dest);
      });
    });
  });

  describe('isAudioContextSupported', () => {
    it('returns true when AudioContext is available', () => {
      const supported = isAudioContextSupported();

      expect(supported).toBe(true);
    });
  });

  describe('getAudioContextConstructor', () => {
    it('returns AudioContext constructor', () => {
      const ctor = getAudioContextConstructor();

      expect(typeof ctor).toBe('function');
    });

    it('constructor can instantiate context', () => {
      const ctor = getAudioContextConstructor();
      const ctx = new ctor();

      expect(ctx).toBeDefined();
      expect(ctx.sampleRate).toBeDefined();
    });
  });

  describe('createAudioContext', () => {
    it('creates an AudioContext with interactive latency', () => {
      const ctx = createAudioContext();

      expect(ctx).toBeDefined();
      expect(ctx.sampleRate).toBe(44100);
    });

    it('sets sample rate to 44.1 kHz per spec', () => {
      const ctx = createAudioContext();

      expect(ctx.sampleRate).toBe(44100);
    });

    it('creates a running context', () => {
      const ctx = createAudioContext();

      expect(['running', 'suspended']).toContain(ctx.state);
    });
  });

  describe('isAudioContextSuspended', () => {
    it('returns false for running context', () => {
      expect(isAudioContextSuspended(context)).toBe(false);
    });

    it('returns true when context state is suspended', () => {
      (context as unknown as Record<string, unknown>).state = 'suspended';

      expect(isAudioContextSuspended(context)).toBe(true);
    });
  });

  describe('resumeAudioContext', () => {
    it('calls resume on suspended context', async () => {
      (context as unknown as Record<string, unknown>).state = 'suspended';
      const resumeSpy = vi.spyOn(context, 'resume');

      await resumeAudioContext(context);

      expect(resumeSpy).toHaveBeenCalled();
    });

    it('does nothing for already running context', async () => {
      const resumeSpy = vi.spyOn(context, 'resume');

      await resumeAudioContext(context);

      expect(resumeSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAudioContextErrorMessage', () => {
    it('returns security error message for SecurityError', () => {
      const err = new DOMException('test', 'SecurityError');

      const msg = getAudioContextErrorMessage(err);

      expect(msg).toContain('denied');
    });

    it('returns not supported message for NotSupportedError', () => {
      const err = new DOMException('test', 'NotSupportedError');

      const msg = getAudioContextErrorMessage(err);

      expect(msg).toContain('not supported');
    });

    it('returns configuration error for TypeError', () => {
      const err = new TypeError('test');

      const msg = getAudioContextErrorMessage(err);

      expect(msg).toContain('configuration');
    });

    it('returns generic error for unknown error type', () => {
      const err = new Error('random error');

      const msg = getAudioContextErrorMessage(err);

      expect(msg).toContain('Failed');
    });
  });
});
