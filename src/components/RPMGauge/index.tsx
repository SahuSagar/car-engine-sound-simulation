'use client';

import { useEffect, useRef, useCallback, type FC } from 'react';
import styles from './RPMGauge.module.css';

interface RPMGaugeProps {
  readonly currentRPM: number;
  readonly redlineRPM: number;
  readonly maxRPM: number;
  readonly isRedline: boolean;
}

// Gauge geometry constants
const SWEEP_DEG = 240;
const START_DEG = 150; // clockwise from 3-o'clock, 150° = bottom-left
const CENTER_X = 200;
const CENTER_Y = 200;
const RADIUS = 160;
const TRACK_RADIUS = 160;

// Spring physics constants
const STIFFNESS = 120;
const DAMPING = 0.7;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rpmToAngle(rpm: number, maxRPM: number): number {
  const clamped = Math.max(0, Math.min(rpm, maxRPM));
  const t = clamped / maxRPM;
  return START_DEG + t * SWEEP_DEG;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (Math.abs(endDeg - startDeg) < 0.001) return '';
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function buildTickMarks(maxRPM: number): { major: number[]; minor: number[] } {
  const major: number[] = [];
  const minor: number[] = [];
  const majorStep = 1000;
  const minorStep = 200;

  for (let rpm = 0; rpm <= maxRPM; rpm += minorStep) {
    if (rpm % majorStep === 0) {
      major.push(rpm);
    } else {
      minor.push(rpm);
    }
  }
  return { major, minor };
}

export const RPMGauge: FC<RPMGaugeProps> = ({ currentRPM, redlineRPM, maxRPM, isRedline }) => {
  const needleAngleRef = useRef(START_DEG);
  const needleVelocityRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const svgNeedleRef = useRef<SVGLineElement | null>(null);
  const svgNeedlePivotRef = useRef<SVGCircleElement | null>(null);
  const rpmDisplayRef = useRef<SVGTextElement | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const targetAngleRef = useRef(START_DEG);

  // Zone angles
  const zone70Angle = START_DEG + ((redlineRPM * 0.7) / maxRPM) * SWEEP_DEG;
  const zone90Angle = START_DEG + ((redlineRPM * 0.9) / maxRPM) * SWEEP_DEG;
  const redlineAngle = START_DEG + (redlineRPM / maxRPM) * SWEEP_DEG;
  const endAngle = START_DEG + SWEEP_DEG;

  // Update target angle from RPM prop
  targetAngleRef.current = rpmToAngle(currentRPM, maxRPM);

  const renderFrame = useCallback(
    (timestamp: number): void => {
      const dt =
        prevTimeRef.current !== null
          ? Math.min((timestamp - prevTimeRef.current) / 1000, 0.05)
          : 1 / 60;
      prevTimeRef.current = timestamp;

      const target = targetAngleRef.current;
      const current = needleAngleRef.current;
      const velocity = needleVelocityRef.current;

      // Spring physics: F = -k * displacement - damping * velocity
      const displacement = current - target;
      const criticalDamping = 2 * Math.sqrt(STIFFNESS);
      const dampingForce = DAMPING * criticalDamping * velocity;
      const springForce = STIFFNESS * displacement;
      const acceleration = -(springForce + dampingForce);

      needleVelocityRef.current = velocity + acceleration * dt;
      needleAngleRef.current = current + needleVelocityRef.current * dt;

      const angle = needleAngleRef.current;
      const rad = degToRad(angle);

      const needleLength = RADIUS - 20;
      const tailLength = 24;

      const tipX = CENTER_X + needleLength * Math.cos(rad);
      const tipY = CENTER_Y + needleLength * Math.sin(rad);
      const tailX = CENTER_X - tailLength * Math.cos(rad);
      const tailY = CENTER_Y - tailLength * Math.sin(rad);

      const needle = svgNeedleRef.current;
      if (needle) {
        needle.setAttribute('x1', String(tailX));
        needle.setAttribute('y1', String(tailY));
        needle.setAttribute('x2', String(tipX));
        needle.setAttribute('y2', String(tipY));
      }

      const display = rpmDisplayRef.current;
      if (display) {
        display.textContent = String(Math.round(currentRPM));
      }

      rafIdRef.current = requestAnimationFrame(renderFrame);
    },
    [currentRPM],
  );

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(renderFrame);
    return (): void => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      prevTimeRef.current = null;
    };
  }, [renderFrame]);

  const ticks = buildTickMarks(maxRPM);

  return (
    <div
      className={`${styles.container} ${isRedline ? styles.redlineActive : ''}`}
      aria-label="RPM Gauge"
    >
      <div className={styles.bezel}>
        <div className={styles.glass} />
        <svg viewBox="0 0 400 400" className={styles.svg} aria-hidden="true" role="img">
          {/* Track arc */}
          <path
            d={describeArc(CENTER_X, CENTER_Y, TRACK_RADIUS, START_DEG, endAngle)}
            className={styles.trackArc}
          />

          {/* Zone 1: 0–70% (yellow) */}
          <path
            d={describeArc(CENTER_X, CENTER_Y, TRACK_RADIUS, START_DEG, zone70Angle)}
            className={styles.zone1Arc}
          />

          {/* Zone 2: 70–90% (orange) */}
          <path
            d={describeArc(CENTER_X, CENTER_Y, TRACK_RADIUS, zone70Angle, zone90Angle)}
            className={styles.zone2Arc}
          />

          {/* Zone 3: 90–100% redline (red) */}
          <path
            d={describeArc(CENTER_X, CENTER_Y, TRACK_RADIUS, zone90Angle, redlineAngle)}
            className={`${styles.zone3Arc} ${isRedline ? styles.zone3Pulse : ''}`}
          />

          {/* Minor tick marks */}
          {ticks.minor.map((rpm) => {
            const angle = rpmToAngle(rpm, maxRPM);
            const inner = polarToCartesian(CENTER_X, CENTER_Y, TRACK_RADIUS - 10, angle);
            const outer = polarToCartesian(CENTER_X, CENTER_Y, TRACK_RADIUS + 4, angle);
            return (
              <line
                key={`minor-${rpm}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                className={styles.tickMinor}
              />
            );
          })}

          {/* Major tick marks + labels */}
          {ticks.major.map((rpm) => {
            const angle = rpmToAngle(rpm, maxRPM);
            const inner = polarToCartesian(CENTER_X, CENTER_Y, TRACK_RADIUS - 18, angle);
            const outer = polarToCartesian(CENTER_X, CENTER_Y, TRACK_RADIUS + 4, angle);
            const labelPos = polarToCartesian(CENTER_X, CENTER_Y, TRACK_RADIUS - 34, angle);
            const label = String(Math.round(rpm / 1000));
            return (
              <g key={`major-${rpm}`}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  className={styles.tickMajor}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  className={styles.tickLabel}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <line
            ref={svgNeedleRef}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={CENTER_X + (RADIUS - 20)}
            y2={CENTER_Y}
            className={`${styles.needle} ${isRedline ? styles.needleRedline : ''}`}
          />

          {/* Needle pivot */}
          <circle
            ref={svgNeedlePivotRef}
            cx={CENTER_X}
            cy={CENTER_Y}
            r={10}
            className={styles.needlePivot}
          />

          {/* RPM display */}
          <text
            ref={rpmDisplayRef}
            x={CENTER_X}
            y={CENTER_Y + 46}
            className={styles.rpmNumber}
            textAnchor="middle"
          >
            {Math.round(currentRPM)}
          </text>

          {/* RPM label */}
          <text x={CENTER_X} y={CENTER_Y + 68} className={styles.rpmLabel} textAnchor="middle">
            RPM
          </text>

          {/* ×1000 label */}
          <text x={CENTER_X} y={364} className={styles.scaleLabel} textAnchor="middle">
            ×1000
          </text>
        </svg>

        {/* Accessible live RPM readout */}
        <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
          {Math.round(currentRPM)} RPM
        </span>
      </div>
    </div>
  );
};
