import { describe, it, expect } from 'vitest';
import {
  rpmToFundamentalHz,
  harmonicFrequency,
  clamp,
  lerp,
  normalizeRPM,
  interpolateRPMCurve,
  linearToDb,
  dbToLinear,
  hzToLogPosition,
} from '@/utils/dsp.utils';

describe('rpmToFundamentalHz', () => {
  it('V8 at 3000 RPM = 200 Hz (spec §7 reference example)', () => {
    expect(rpmToFundamentalHz(3000, 8)).toBe(200);
  });

  it('inline-4 at 3000 RPM = 100 Hz', () => {
    expect(rpmToFundamentalHz(3000, 4)).toBe(100);
  });

  it('V6 at 3000 RPM = 150 Hz', () => {
    expect(rpmToFundamentalHz(3000, 6)).toBe(150);
  });

  it('returns 0 Hz at 0 RPM', () => {
    expect(rpmToFundamentalHz(0, 8)).toBe(0);
  });

  it('scales linearly with RPM', () => {
    expect(rpmToFundamentalHz(6000, 8)).toBe(400);
  });
});

describe('harmonicFrequency', () => {
  it('returns fundamental unchanged for harmonic 1', () => {
    expect(harmonicFrequency(200, 1)).toBe(200);
  });

  it('returns triple the fundamental for harmonic 3', () => {
    expect(harmonicFrequency(200, 3)).toBe(600);
  });

  it('returns 0 when fundamental is 0', () => {
    expect(harmonicFrequency(0, 5)).toBe(0);
  });
});

describe('clamp', () => {
  it('passes through values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below minimum to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps above maximum to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min at boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max at boundary', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('clamps t below 0 to a', () => {
    expect(lerp(10, 20, -1)).toBe(10);
  });

  it('clamps t above 1 to b', () => {
    expect(lerp(10, 20, 2)).toBe(20);
  });
});

describe('normalizeRPM', () => {
  const idle = 750;
  const redline = 7200;

  it('returns 0 at idle RPM', () => {
    expect(normalizeRPM(idle, idle, redline)).toBe(0);
  });

  it('returns 1 at redline RPM', () => {
    expect(normalizeRPM(redline, idle, redline)).toBe(1);
  });

  it('clamps below idle to 0', () => {
    expect(normalizeRPM(0, idle, redline)).toBe(0);
  });

  it('clamps above redline to 1', () => {
    expect(normalizeRPM(9000, idle, redline)).toBe(1);
  });

  it('returns ~0.5 at the midpoint', () => {
    expect(normalizeRPM((idle + redline) / 2, idle, redline)).toBeCloseTo(0.5);
  });
});

describe('interpolateRPMCurve', () => {
  const curve = [
    { rpm: 1000, value: 0.5 },
    { rpm: 3000, value: 0.8 },
    { rpm: 6000, value: 1.0 },
  ];

  it('returns first value when rpm is below range', () => {
    expect(interpolateRPMCurve(500, curve)).toBe(0.5);
  });

  it('returns last value when rpm is above range', () => {
    expect(interpolateRPMCurve(8000, curve)).toBe(1.0);
  });

  it('returns exact value at a defined rpm point', () => {
    expect(interpolateRPMCurve(3000, curve)).toBeCloseTo(0.8);
  });

  it('linearly interpolates between adjacent points', () => {
    // halfway between rpm=1000 (0.5) and rpm=3000 (0.8) → 0.65
    expect(interpolateRPMCurve(2000, curve)).toBeCloseTo(0.65);
  });

  it('interpolates in the upper segment', () => {
    // halfway between rpm=3000 (0.8) and rpm=6000 (1.0) → 0.9
    expect(interpolateRPMCurve(4500, curve)).toBeCloseTo(0.9);
  });

  it('returns 0 for an empty curve', () => {
    expect(interpolateRPMCurve(3000, [])).toBe(0);
  });

  it('returns the single value for a one-point curve regardless of rpm', () => {
    expect(interpolateRPMCurve(5000, [{ rpm: 2000, value: 0.7 }])).toBe(0.7);
  });

  it('sorts unsorted input before interpolating', () => {
    const unsorted = [
      { rpm: 3000, value: 0.8 },
      { rpm: 1000, value: 0.5 },
    ];
    expect(interpolateRPMCurve(2000, unsorted)).toBeCloseTo(0.65);
  });
});

describe('linearToDb', () => {
  it('returns 0 dB for unity gain', () => {
    expect(linearToDb(1)).toBe(0);
  });

  it('returns ≈ −6 dB for gain 0.5', () => {
    expect(linearToDb(0.5)).toBeCloseTo(-6.02, 1);
  });

  it('returns −20 dB for gain 0.1', () => {
    expect(linearToDb(0.1)).toBeCloseTo(-20);
  });

  it('returns −Infinity for gain 0', () => {
    expect(linearToDb(0)).toBe(-Infinity);
  });

  it('returns −Infinity for negative gain', () => {
    expect(linearToDb(-1)).toBe(-Infinity);
  });
});

describe('dbToLinear', () => {
  it('returns 1 for 0 dB', () => {
    expect(dbToLinear(0)).toBe(1);
  });

  it('returns 0.1 for −20 dB', () => {
    expect(dbToLinear(-20)).toBeCloseTo(0.1);
  });

  it('returns ≈ 0.5 for −6.02 dB', () => {
    expect(dbToLinear(-6.02)).toBeCloseTo(0.5, 1);
  });

  it('is the inverse of linearToDb', () => {
    expect(dbToLinear(linearToDb(0.7))).toBeCloseTo(0.7);
  });
});

describe('hzToLogPosition', () => {
  const minHz = 20;
  const maxHz = 8000;

  it('returns 0 at min frequency', () => {
    expect(hzToLogPosition(minHz, minHz, maxHz)).toBe(0);
  });

  it('returns 1 at max frequency', () => {
    expect(hzToLogPosition(maxHz, minHz, maxHz)).toBe(1);
  });

  it('returns 0.5 at the geometric mean', () => {
    const geo = Math.sqrt(minHz * maxHz);
    expect(hzToLogPosition(geo, minHz, maxHz)).toBeCloseTo(0.5);
  });

  it('clamps frequencies below minHz to 0', () => {
    expect(hzToLogPosition(1, minHz, maxHz)).toBe(0);
  });

  it('clamps frequencies above maxHz to 1', () => {
    expect(hzToLogPosition(20000, minHz, maxHz)).toBe(1);
  });
});
