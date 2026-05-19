'use client';

import { useEffect, useCallback, type FC } from 'react';
import { useEngineAudio } from '@/hooks/useEngineAudio';
import { useRPMController } from '@/hooks/useRPMController';
import { EngineSelector } from '@/components/EngineSelector';
import { RPMGauge } from '@/components/RPMGauge';
import { MiniGauge } from '@/components/MiniGauge';
import { Oscilloscope } from '@/components/Oscilloscope';
import { SpectrumAnalyzer } from '@/components/SpectrumAnalyzer';
import { ThrottleControl } from '@/components/ThrottleControl';
import styles from './SimulatorCore.module.css';

export const SimulatorCore: FC = () => {
  const {
    engineStatus,
    currentRPM,
    isEngineRunning,
    activePreset,
    waveformAnalyser,
    spectrumAnalyser,
    initialize,
    coldStart,
    killEngine,
    setTargetRPM,
  } = useEngineAudio();

  const { isThrottleActive, onThrottlePress, onThrottleRelease } = useRPMController({
    activePreset,
    isEngineRunning,
    currentRPM,
    setTargetRPM,
  });

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleStartStop = useCallback((): void => {
    if (isEngineRunning) {
      killEngine();
    } else {
      coldStart();
    }
  }, [isEngineRunning, coldStart, killEngine]);

  const isReady = engineStatus === 'running';
  const redlineRPM = activePreset?.redlineRPM ?? 7000;
  const maxRPM = redlineRPM + 500;
  const isRedline = currentRPM >= redlineRPM;

  return (
    <div className={styles.core}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span className={styles.brandName}>REVSIM</span>
        </div>
        <div className={styles.headerSelector}>
          <EngineSelector />
        </div>
        <div className={styles.headerActions}>
          {activePreset && <span className={styles.statusChip}>{activePreset.cylinders}CYL</span>}
        </div>
      </header>

      {/* Main content area */}
      <main className={styles.main}>
        {/* Left column — gauge panel */}
        <section className={styles.gaugePanel} aria-label="RPM Gauge">
          <div className={styles.gaugeWrapper}>
            <RPMGauge
              currentRPM={currentRPM}
              redlineRPM={redlineRPM}
              maxRPM={maxRPM}
              isRedline={isRedline}
            />
          </div>

          {/* Mini gauges — desktop only */}
          <div className={styles.miniGauges} aria-label="Secondary gauges">
            <MiniGauge variant="oil-temp" />
            <MiniGauge variant="voltage" />
          </div>
        </section>

        {/* Right column — visualizers + engine info */}
        <section className={styles.visualizerPanel} aria-label="Audio visualizers">
          <div className={styles.oscilloscopeWrapper}>
            <Oscilloscope analyserNode={waveformAnalyser} isActive={isEngineRunning && isReady} />
          </div>
          <div className={styles.spectrumWrapper}>
            <SpectrumAnalyzer
              analyserNode={spectrumAnalyser}
              isActive={isEngineRunning && isReady}
            />
          </div>

          {activePreset && (
            <div className={styles.engineMeta} aria-label="Engine information">
              <span className={styles.metaRow}>
                <span className={styles.metaKey}>ENGINE</span>
                <span className={styles.metaValue}>{activePreset.name.toUpperCase()}</span>
              </span>
              <span className={styles.metaRow}>
                <span className={styles.metaKey}>CYLINDERS</span>
                <span className={styles.metaValue}>{activePreset.cylinders}</span>
              </span>
              <span className={styles.metaRow}>
                <span className={styles.metaKey}>IDLE</span>
                <span className={styles.metaValue}>{activePreset.idleRPM} RPM</span>
              </span>
              <span className={styles.metaRow}>
                <span className={styles.metaKey}>REDLINE</span>
                <span className={`${styles.metaValue} ${styles.metaValueDanger}`}>
                  {activePreset.redlineRPM} RPM
                </span>
              </span>
            </div>
          )}
        </section>
      </main>

      {/* Control dock */}
      <footer className={styles.dock}>
        <button
          className={`${styles.startButton} ${isEngineRunning ? styles.startButtonRunning : ''}`}
          onClick={handleStartStop}
          disabled={!isReady}
          aria-label={isEngineRunning ? 'Kill engine' : 'Start engine'}
          type="button"
        >
          <span className={styles.startIcon} aria-hidden="true">
            ⏻
          </span>
          <span className={styles.startLabel}>
            {isEngineRunning ? 'KILL ENGINE' : 'START ENGINE'}
          </span>
        </button>

        <div className={styles.throttleWrapper}>
          <ThrottleControl
            isEngineRunning={isEngineRunning}
            isThrottleActive={isThrottleActive}
            onThrottlePress={onThrottlePress}
            onThrottleRelease={onThrottleRelease}
            currentRPM={currentRPM}
            redlineRPM={redlineRPM}
          />
        </div>
      </footer>
    </div>
  );
};
