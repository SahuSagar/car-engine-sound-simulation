'use client';

import { useEffect, useRef, type FC } from 'react';
import styles from './Oscilloscope.module.css';

interface OscilloscopeProps {
  readonly analyserNode: AnalyserNode | null;
  readonly isActive: boolean;
}

export const Oscilloscope: FC<OscilloscopeProps> = ({ analyserNode, isActive }) => {
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

    const bufferLength = analyserNode ? analyserNode.fftSize : 2048;
    const dataArray = new Float32Array(bufferLength);

    const draw = (): void => {
      rafIdRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 180, 80, 0.08)';
      ctx.lineWidth = 1;
      const cols = 8;
      const rows = 4;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        const y = (i / rows) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (!analyserNode || !isActive) return;

      analyserNode.getFloatTimeDomainData(dataArray);

      const sliceWidth = w / bufferLength;
      const midY = h / 2;

      // Ghost bloom line (CRT glow effect)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
      ctx.lineWidth = 3 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i < bufferLength; i++) {
        const sample = dataArray[i] ?? 0;
        const x = i * sliceWidth;
        const y = midY - sample * midY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Primary phosphor waveform line
      ctx.beginPath();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i < bufferLength; i++) {
        const sample = dataArray[i] ?? 0;
        const x = i * sliceWidth;
        const y = midY - sample * midY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
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
    <div className={styles.wrapper} ref={containerRef} aria-label="Oscilloscope waveform display">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className={styles.label}>WAVEFORM</span>
      <div className={styles.scanlines} aria-hidden="true" />
    </div>
  );
};
