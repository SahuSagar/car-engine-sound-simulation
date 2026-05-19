'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import styles from './ThrottleControl.module.css';

interface ThrottleControlProps {
  readonly isEngineRunning: boolean;
  readonly isThrottleActive: boolean;
  readonly onThrottlePress: () => void;
  readonly onThrottleRelease: () => void;
  readonly currentRPM: number;
  readonly redlineRPM: number;
}

export const ThrottleControl: FC<ThrottleControlProps> = ({
  isEngineRunning,
  isThrottleActive,
  onThrottlePress,
  onThrottleRelease,
  currentRPM,
  redlineRPM,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isPressedRef = useRef(false);

  const throttlePercent = redlineRPM > 0 ? Math.min((currentRPM / redlineRPM) * 100, 100) : 0;

  const handlePress = useCallback((): void => {
    if (!isEngineRunning || isPressedRef.current) return;
    isPressedRef.current = true;
    setIsPressed(true);
    onThrottlePress();
  }, [isEngineRunning, onThrottlePress]);

  const handleRelease = useCallback((): void => {
    if (!isPressedRef.current) return;
    isPressedRef.current = false;
    setIsPressed(false);
    onThrottleRelease();
  }, [onThrottleRelease]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      handlePress();
    },
    [handlePress],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent): void => {
      e.preventDefault();
      handlePress();
    },
    [handlePress],
  );

  // Release on pointer up anywhere in the window
  useEffect(() => {
    const onRelease = (): void => {
      if (isPressedRef.current) handleRelease();
    };
    window.addEventListener('mouseup', onRelease);
    window.addEventListener('touchend', onRelease);
    window.addEventListener('touchcancel', onRelease);
    return (): void => {
      window.removeEventListener('mouseup', onRelease);
      window.removeEventListener('touchend', onRelease);
      window.removeEventListener('touchcancel', onRelease);
    };
  }, [handleRelease]);

  // Force release when engine stops
  useEffect(() => {
    if (!isEngineRunning && isPressedRef.current) {
      isPressedRef.current = false;
      setIsPressed(false);
    }
  }, [isEngineRunning]);

  const isActive = isPressed && isThrottleActive;
  const isRedline = currentRPM >= redlineRPM;

  return (
    <div className={styles.wrapper}>
      {/* Vertical slider — desktop only */}
      <div className={styles.sliderPanel} aria-hidden="true">
        <div className={styles.sliderTrack}>
          <div
            className={`${styles.sliderFill} ${isActive ? styles.sliderFillActive : ''} ${isRedline ? styles.sliderFillRedline : ''}`}
            style={{ height: `${throttlePercent}%` }}
          />
          <div className={styles.sliderLabel}>
            <span>{Math.round(throttlePercent)}%</span>
            <span>THROTTLE</span>
          </div>
        </div>
      </div>

      {/* Hold button */}
      <button
        className={`${styles.holdButton} ${isActive ? styles.holdButtonActive : ''} ${isRedline ? styles.holdButtonRedline : ''} ${!isEngineRunning ? styles.holdButtonDisabled : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-label={isActive ? 'Revving engine' : 'Hold to rev engine'}
        aria-pressed={isActive}
        disabled={!isEngineRunning}
        type="button"
      >
        <span className={styles.buttonInner}>
          <span className={styles.buttonIcon}>{isActive ? '◈' : '◇'}</span>
          <span className={styles.buttonText}>{isActive ? 'REVVING...' : 'HOLD TO REV'}</span>
          {isRedline && <span className={styles.redlineTag}>REDLINE</span>}
        </span>
      </button>
    </div>
  );
};
