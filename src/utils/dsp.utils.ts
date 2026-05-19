import type { RPMCurvePoint } from '@/types/engine.types';

/**
 * f₀ = (RPM / 60) × (cylinders / 2)
 * Per spec §7: V8 @ 3000 RPM → 200 Hz
 */
export function rpmToFundamentalHz(rpm: number, cylinders: number): number {
  return (rpm / 60) * (cylinders / 2);
}

export function harmonicFrequency(fundamental: number, harmonicN: number): number {
  return fundamental * harmonicN;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function normalizeRPM(rpm: number, idleRPM: number, redlineRPM: number): number {
  return clamp((rpm - idleRPM) / (redlineRPM - idleRPM), 0, 1);
}

export function interpolateRPMCurve(rpm: number, curve: readonly RPMCurvePoint[]): number {
  if (curve.length === 0) return 0;

  const sorted = [...curve].sort((a, b) => a.rpm - b.rpm);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined) return 0;

  if (rpm <= first.rpm) return first.value;
  if (rpm >= last.rpm) return last.value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (lo === undefined || hi === undefined) continue;
    if (rpm >= lo.rpm && rpm <= hi.rpm) {
      const t = (rpm - lo.rpm) / (hi.rpm - lo.rpm);
      return lo.value + t * (hi.value - lo.value);
    }
  }

  return last.value;
}

export function linearToDb(gain: number): number {
  if (gain <= 0) return -Infinity;
  return 20 * Math.log10(gain);
}

export function dbToLinear(db: number): number {
  return 10 ** (db / 20);
}

/**
 * Maps a frequency to a [0, 1] position on a logarithmic scale.
 * Used by SpectrumAnalyzer for log-frequency axis rendering.
 */
export function hzToLogPosition(hz: number, minHz: number, maxHz: number): number {
  return clamp(Math.log10(hz / minHz) / Math.log10(maxHz / minHz), 0, 1);
}
