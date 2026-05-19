'use client';

import { useCallback, useEffect, useRef } from 'react';
import { RPM } from '@/constants/engine.constants';
import { clamp } from '@/utils/dsp.utils';
import type { EnginePreset } from '@/types/engine.types';

interface UseRPMControllerOptions {
  readonly activePreset: EnginePreset | null;
  readonly isEngineRunning: boolean;
  readonly currentRPM: number;
  setTargetRPM: (rpm: number) => void;
}

interface UseRPMControllerReturn {
  readonly isThrottleActive: boolean;
  onThrottlePress: () => void;
  onThrottleRelease: () => void;
}

export function useRPMController({
  activePreset,
  isEngineRunning,
  currentRPM,
  setTargetRPM,
}: UseRPMControllerOptions): UseRPMControllerReturn {
  const isThrottleActiveRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const throttleRPMRef = useRef(0);

  const _stopLoop = useCallback((): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const _startThrottleLoop = useCallback((): void => {
    _stopLoop();

    const tick = (): void => {
      if (!isThrottleActiveRef.current) return;

      const preset = activePreset;
      if (!preset) return;

      const maxRPM = clamp(preset.redlineRPM, RPM.ABSOLUTE_MIN, RPM.ABSOLUTE_MAX);

      throttleRPMRef.current = clamp(
        throttleRPMRef.current +
          (maxRPM - throttleRPMRef.current) * (1 / 60) * preset.accelerationRate,
        0,
        maxRPM,
      );

      setTargetRPM(throttleRPMRef.current);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [activePreset, setTargetRPM, _stopLoop]);

  const _startReleaseLoop = useCallback((): void => {
    _stopLoop();

    const tick = (): void => {
      if (isThrottleActiveRef.current) return;

      const preset = activePreset;
      if (!preset) return;

      throttleRPMRef.current = clamp(
        throttleRPMRef.current +
          (preset.idleRPM - throttleRPMRef.current) * (1 / 60) * preset.decelerationRate,
        preset.idleRPM,
        RPM.ABSOLUTE_MAX,
      );

      setTargetRPM(throttleRPMRef.current);

      const delta = Math.abs(throttleRPMRef.current - preset.idleRPM);
      if (delta < 1) {
        setTargetRPM(preset.idleRPM);
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [activePreset, setTargetRPM, _stopLoop]);

  const onThrottlePress = useCallback((): void => {
    if (!isEngineRunning || !activePreset) return;
    if (isThrottleActiveRef.current) return;

    isThrottleActiveRef.current = true;
    throttleRPMRef.current = currentRPM;
    _startThrottleLoop();
  }, [isEngineRunning, activePreset, currentRPM, _startThrottleLoop]);

  const onThrottleRelease = useCallback((): void => {
    if (!isThrottleActiveRef.current) return;

    isThrottleActiveRef.current = false;
    _startReleaseLoop();
  }, [_startReleaseLoop]);

  // Sync throttle ref RPM with live currentRPM while throttle is NOT pressed,
  // so the next press starts from where the engine actually is.
  useEffect(() => {
    if (!isThrottleActiveRef.current) {
      throttleRPMRef.current = currentRPM;
    }
  }, [currentRPM]);

  // Stop loop when engine is killed
  useEffect(() => {
    if (!isEngineRunning) {
      isThrottleActiveRef.current = false;
      _stopLoop();
    }
  }, [isEngineRunning, _stopLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      _stopLoop();
    };
  }, [_stopLoop]);

  return {
    isThrottleActive: isThrottleActiveRef.current,
    onThrottlePress,
    onThrottleRelease,
  };
}
