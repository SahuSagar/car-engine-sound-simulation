import type { IFilterChain, EnginePreset } from '@/types/engine.types';
import { TIME_CONSTANTS } from '@/constants/engine.constants';
import { createAndConfigureBiquadFilter, setValueImmediateAtTime } from '@/utils/audio.utils';
import { interpolateRPMCurve } from '@/utils/dsp.utils';

interface ManagedFilter {
  readonly node: BiquadFilterNode;
}

export class FilterChain implements IFilterChain {
  private _context: AudioContext;
  private _input: GainNode;
  private _output: GainNode;
  private _filters: ManagedFilter[] = [];

  constructor(context: AudioContext) {
    this._context = context;
    this._input = context.createGain();
    this._output = context.createGain();
    setValueImmediateAtTime(this._input.gain, 1.0, context);
    setValueImmediateAtTime(this._output.gain, 1.0, context);
    // By default input passes directly to output with no filters
    this._input.connect(this._output);
  }

  private _rebuildChain(preset: EnginePreset): void {
    // Tear down existing filter nodes
    this._input.disconnect();
    this._filters.forEach((f) => f.node.disconnect());
    this._filters = [];

    const curves = preset.filterCurves;
    if (curves === undefined || curves.length === 0) {
      // No filter curves — passthrough
      this._input.connect(this._output);
      return;
    }

    // Build one BiquadFilterNode per curve entry.
    // filterCurves[i] provides RPM→frequency mapping; filter type is determined by position:
    //   index 0 → lowpass (body shaping)
    //   index 1 → bandpass (exhaust emphasis)
    //   index 2+ → highshelf (top-end air)
    const filterTypes: BiquadFilterType[] = ['lowpass', 'bandpass', 'highshelf'];

    const nodes: BiquadFilterNode[] = curves.map((curve, i) => {
      const type = filterTypes[i] ?? 'peaking';
      const initialFreq = interpolateRPMCurve(preset.idleRPM, curve);
      const node = createAndConfigureBiquadFilter(this._context, {
        type,
        frequency: initialFreq > 0 ? initialFreq : 1000,
        Q: 0.707,
      });
      this._filters.push({ node });
      return node;
    });

    // Wire: input → filter[0] → filter[1] → … → output
    let prev: AudioNode = this._input;
    for (const node of nodes) {
      prev.connect(node);
      prev = node;
    }
    prev.connect(this._output);
  }

  updateForRPM(rpm: number, preset: EnginePreset): void {
    const curves = preset.filterCurves;
    if (curves === undefined || curves.length === 0) return;

    // Initialise chain on first call or after preset switch
    if (this._filters.length !== curves.length) {
      this._rebuildChain(preset);
    }

    curves.forEach((curve, i) => {
      const managed = this._filters[i];
      if (managed === undefined) return;

      const targetFreq = interpolateRPMCurve(rpm, curve);
      if (targetFreq <= 0) return;

      managed.node.frequency.setTargetAtTime(
        targetFreq,
        this._context.currentTime,
        TIME_CONSTANTS.THROTTLE_PRESS,
      );
    });
  }

  connect(destination: AudioNode): void {
    this._output.connect(destination);
  }

  disconnect(): void {
    this._output.disconnect();
  }

  dispose(): void {
    this._input.disconnect();
    this._filters.forEach((f) => f.node.disconnect());
    this._filters = [];
    this._output.disconnect();
  }

  get input(): GainNode {
    return this._input;
  }
}
