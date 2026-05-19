'use client';

import { useEffect, useRef, type FC } from 'react';
import styles from './SpectrumAnalyzer.module.css';

interface SpectrumAnalyzerProps {
  readonly analyserNode: AnalyserNode | null;
  readonly isActive: boolean;
}

const MIN_FREQ = 20;
const MAX_FREQ = 8000;
const X_LABELS: { freq: number; label: string }[] = [
  { freq: 80, label: '80Hz' },
  { freq: 250, label: '250Hz' },
  { freq: 1000, label: '1kHz' },
  { freq: 4000, label: '4kHz' },
  { freq: 8000, label: '8kHz' },
];
const Y_LABELS = ['0', '-20', '-40', '-60'];
const PEAK_DECAY_MS = 1500;

function freqToX(freq: number, width: number): number {
  const logMin = Math.log10(MIN_FREQ);
  const logMax = Math.log10(MAX_FREQ);
  return ((Math.log10(freq) - logMin) / (logMax - logMin)) * width;
}

export const SpectrumAnalyzer: FC<SpectrumAnalyzerProps> = ({ analyserNode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio ?? 1;

    const updateSize = (): void => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PADDING_LEFT = 36 * dpr;
    const PADDING_BOTTOM = 20 * dpr;
    const PADDING_RIGHT = 8 * dpr;
    const PADDING_TOP = 8 * dpr;
    const BAR_GAP = 1 * dpr;

    // Peak hold: array of { value: number (0–1), timestamp: number }
    let peakHolds: { value: number; timestamp: number }[] = [];

    const draw = (): void => {
      rafIdRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      const plotW = w - PADDING_LEFT - PADDING_RIGHT;
      const plotH = h - PADDING_BOTTOM - PADDING_TOP;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Y-axis gridlines and labels
      ctx.font = `${10 * dpr}px var(--font-mono, monospace)`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < Y_LABELS.length; i++) {
        const y = PADDING_TOP + (i / (Y_LABELS.length - 1)) * plotH;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PADDING_LEFT, y);
        ctx.lineTo(w - PADDING_RIGHT, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(102,102,112,0.8)';
        ctx.fillText(Y_LABELS[i] ?? '', PADDING_LEFT - 4 * dpr, y);
      }

      if (!analyserNode || !isActive) {
        // Draw empty state X-axis labels
        ctx.fillStyle = 'rgba(102,102,112,0.8)';
        ctx.font = `${10 * dpr}px var(--font-mono, monospace)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (const { freq, label } of X_LABELS) {
          const x = PADDING_LEFT + freqToX(freq, plotW);
          ctx.fillText(label, x, h - PADDING_BOTTOM + 4 * dpr);
        }
        return;
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserNode.getFloatFrequencyData(dataArray);

      const sampleRate = analyserNode.context.sampleRate;
      const minDb = analyserNode.minDecibels;
      const maxDb = analyserNode.maxDecibels;
      const dbRange = maxDb - minDb;

      const BAR_COUNT = 80;
      const barW = (plotW - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

      // Rebuild peak holds array if bar count changed
      if (peakHolds.length !== BAR_COUNT) {
        peakHolds = Array.from({ length: BAR_COUNT }, () => ({ value: 0, timestamp: 0 }));
      }

      const now = performance.now();

      for (let i = 0; i < BAR_COUNT; i++) {
        // Map bar index to frequency (log scale)
        const t0 = i / BAR_COUNT;
        const t1 = (i + 1) / BAR_COUNT;
        const logMin = Math.log10(MIN_FREQ);
        const logMax = Math.log10(MAX_FREQ);
        const f0 = Math.pow(10, logMin + t0 * (logMax - logMin));
        const f1 = Math.pow(10, logMin + t1 * (logMax - logMin));

        // Average dB across the frequency bin range
        const bin0 = Math.floor((f0 / (sampleRate / 2)) * bufferLength);
        const bin1 = Math.ceil((f1 / (sampleRate / 2)) * bufferLength);
        let sum = 0;
        let count = 0;
        for (let b = bin0; b <= bin1 && b < bufferLength; b++) {
          sum += dataArray[b] ?? minDb;
          count++;
        }
        const avgDb = count > 0 ? sum / count : minDb;
        const normalised = Math.max(0, Math.min(1, (avgDb - minDb) / dbRange));

        const x = PADDING_LEFT + i * (barW + BAR_GAP);
        const barH = normalised * plotH;
        const y = PADDING_TOP + plotH - barH;

        // Vertical gradient: bottom → danger, mid → accent, top → primary
        const grad = ctx.createLinearGradient(x, PADDING_TOP + plotH, x, PADDING_TOP);
        grad.addColorStop(0, '#ff2020');
        grad.addColorStop(0.5, '#ff6b00');
        grad.addColorStop(1, '#e8ff00');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, barH);

        // Peak hold
        const peak = peakHolds[i];
        if (peak) {
          if (normalised >= peak.value) {
            peak.value = normalised;
            peak.timestamp = now;
          }

          const elapsed = now - peak.timestamp;
          if (elapsed < PEAK_DECAY_MS && peak.value > 0) {
            const alpha = 1 - elapsed / PEAK_DECAY_MS;
            const peakY = PADDING_TOP + plotH - peak.value * plotH;
            const dotRadius = 2 * dpr;
            ctx.beginPath();
            ctx.arc(x + barW / 2, peakY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(232, 255, 0, ${alpha.toFixed(3)})`;
            ctx.fill();
          } else if (elapsed >= PEAK_DECAY_MS) {
            peak.value = 0;
          }
        }
      }

      // X-axis labels
      ctx.fillStyle = 'rgba(102,102,112,0.8)';
      ctx.font = `${10 * dpr}px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const { freq, label } of X_LABELS) {
        const x = PADDING_LEFT + freqToX(freq, plotW);
        ctx.fillText(label, x, h - PADDING_BOTTOM + 4 * dpr);
      }
    };

    rafIdRef.current = requestAnimationFrame(draw);

    return (): void => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [analyserNode, isActive]);

  return (
    <div
      className={styles.wrapper}
      ref={containerRef}
      aria-label="Spectrum analyzer frequency display"
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className={styles.label}>SPECTRUM</span>
    </div>
  );
};
