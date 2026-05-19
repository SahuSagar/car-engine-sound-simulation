'use client';

import { useEffect, useRef, type FC } from 'react';
import { useEngineStore } from '@/store/engineStore';
import styles from './MiniGauge.module.css';

type MiniGaugeVariant = 'oil-temp' | 'voltage';

interface MiniGaugeProps {
  readonly variant: MiniGaugeVariant;
}

// Gauge geometry — 80px rendered via viewBox 100x100
const CX = 50;
const CY = 50;
const R = 36;
const SWEEP_DEG = 200;
const START_DEG = 160; // bottom-left

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(angleDeg: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

function describeArc(startDeg: number, endDeg: number): string {
  if (Math.abs(endDeg - startDeg) < 0.001) return '';
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const s = polarToCartesian(startDeg);
  const e = polarToCartesian(endDeg);
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

function needleCoords(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
  const rad = degToRad(angleDeg);
  const len = R - 8;
  const tailLen = 6;
  return {
    x1: CX - tailLen * Math.cos(rad),
    y1: CY - tailLen * Math.sin(rad),
    x2: CX + len * Math.cos(rad),
    y2: CY + len * Math.sin(rad),
  };
}

const END_DEG = START_DEG + SWEEP_DEG;

// Static voltage gauge config: needle at ~60% (a healthy 14.2V reading)
const VOLTAGE_NEEDLE_ANGLE = START_DEG + 0.6 * SWEEP_DEG;

export const MiniGauge: FC<MiniGaugeProps> = ({ variant }) => {
  const currentRPM = useEngineStore((s) => s.currentRPM);
  const activePreset = useEngineStore((s) => s.activePreset);

  // Oil temp: accumulates heat over time based on RPM, cools when engine is idle/off
  const heatRef = useRef(0); // 0–1
  const arcPathRef = useRef<SVGPathElement | null>(null);
  const needleRef = useRef<SVGLineElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const isOilTemp = variant === 'oil-temp';
  const redlineRPM = activePreset?.redlineRPM ?? 7000;

  useEffect(() => {
    if (!isOilTemp) return;

    let lastTime: number | null = null;

    function frame(ts: number): void {
      const dt = lastTime !== null ? Math.min((ts - lastTime) / 1000, 0.1) : 0;
      lastTime = ts;

      const rpmFraction = Math.max(0, Math.min(currentRPM / redlineRPM, 1));

      // Heat up slowly when revving, cool down slowly when idle
      const heatRate = rpmFraction > 0.1 ? rpmFraction * 0.012 : -0.004;
      heatRef.current = Math.max(0, Math.min(1, heatRef.current + heatRate * dt));

      const heat = heatRef.current;

      // Arc fills from 0 to heat fraction
      const arcEnd = START_DEG + heat * SWEEP_DEG;
      const arcEl = arcPathRef.current;
      if (arcEl) {
        arcEl.setAttribute('d', describeArc(START_DEG, arcEnd));
      }

      // Needle angle follows heat
      const nAngle = START_DEG + heat * SWEEP_DEG;
      const needleEl = needleRef.current;
      if (needleEl) {
        const { x1, y1, x2, y2 } = needleCoords(nAngle);
        needleEl.setAttribute('x1', String(x1));
        needleEl.setAttribute('y1', String(y1));
        needleEl.setAttribute('x2', String(x2));
        needleEl.setAttribute('y2', String(y2));
      }

      rafIdRef.current = requestAnimationFrame(frame);
    }

    rafIdRef.current = requestAnimationFrame(frame);
    return (): void => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isOilTemp, currentRPM, redlineRPM]);

  if (isOilTemp) {
    const heat = heatRef.current;
    const initialArcEnd = START_DEG + heat * SWEEP_DEG;

    return (
      <div className={styles.wrapper}>
        <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden="true" role="img">
          {/* Carbon fiber bezel circle */}
          <circle cx={CX} cy={CY} r={46} className={styles.bezelCircle} />

          {/* Glass highlight */}
          <circle cx={CX} cy={CY} r={44} className={styles.glassCircle} />

          {/* Background track arc */}
          <path d={describeArc(START_DEG, END_DEG)} className={styles.trackArc} />

          {/* Animated heat arc — cold=blue, hot=red via CSS */}
          <path
            ref={arcPathRef}
            d={describeArc(START_DEG, initialArcEnd)}
            className={styles.oilTempArc}
            style={{ '--heat': heatRef.current } as React.CSSProperties}
          />

          {/* Animated needle */}
          <line ref={needleRef} {...needleCoords(START_DEG)} className={styles.needle} />

          {/* Center pivot */}
          <circle cx={CX} cy={CY} r={3.5} className={styles.pivot} />

          {/* Cold / Hot end markers */}
          <text x={22} y={88} className={styles.markerLabel} textAnchor="middle">
            C
          </text>
          <text x={78} y={88} className={styles.markerLabel} textAnchor="middle">
            H
          </text>
        </svg>
        <span className={styles.label}>OIL TEMP</span>
      </div>
    );
  }

  // Voltage gauge — static aesthetic
  const { x1, y1, x2, y2 } = needleCoords(VOLTAGE_NEEDLE_ANGLE);

  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden="true" role="img">
        {/* Carbon fiber bezel circle */}
        <circle cx={CX} cy={CY} r={46} className={styles.bezelCircle} />

        {/* Glass highlight */}
        <circle cx={CX} cy={CY} r={44} className={styles.glassCircle} />

        {/* Background track arc */}
        <path d={describeArc(START_DEG, END_DEG)} className={styles.trackArc} />

        {/* Voltage fill arc: static at 60% — healthy reading */}
        <path d={describeArc(START_DEG, VOLTAGE_NEEDLE_ANGLE)} className={styles.voltageArc} />

        {/* Static needle */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.needle} />

        {/* Center pivot */}
        <circle cx={CX} cy={CY} r={3.5} className={styles.pivot} />

        {/* Low / High end markers */}
        <text x={22} y={88} className={styles.markerLabel} textAnchor="middle">
          L
        </text>
        <text x={78} y={88} className={styles.markerLabel} textAnchor="middle">
          H
        </text>
      </svg>
      <span className={styles.label}>VOLTAGE</span>
    </div>
  );
};
