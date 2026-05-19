'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AudioEngine } from '@/engine/AudioEngine';
import { EngineSimulator } from '@/engine/EngineSimulator';
import { getPreset } from '@/engine/presets';
import { useEngineStore } from '@/store/engineStore';
import type { EnginePreset, EngineType } from '@/types/engine.types';

interface UseEngineAudioReturn {
  readonly engineStatus: 'uninitialized' | 'running' | 'suspended';
  readonly currentRPM: number;
  readonly targetRPM: number;
  readonly isEngineRunning: boolean;
  readonly activePreset: EnginePreset | null;
  readonly waveformAnalyser: AnalyserNode | null;
  readonly spectrumAnalyser: AnalyserNode | null;
  initialize: () => Promise<void>;
  coldStart: () => void;
  killEngine: () => void;
  setMasterVolume: (value: number) => void;
  setTargetRPM: (rpm: number) => void;
  loadPreset: (presetId: EngineType) => void;
}

export function useEngineAudio(): UseEngineAudioReturn {
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const simulatorRef = useRef<EngineSimulator | null>(null);
  const rpmSyncRafRef = useRef<number | null>(null);

  const engineStatus = useEngineStore((s) => s.engineStatus);
  const currentRPM = useEngineStore((s) => s.currentRPM);
  const targetRPM = useEngineStore((s) => s.targetRPM);
  const isEngineRunning = useEngineStore((s) => s.isEngineRunning);
  const activePreset = useEngineStore((s) => s.activePreset);

  const setEngineStatus = useEngineStore((s) => s.setEngineStatus);
  const setCurrentRPM = useEngineStore((s) => s.setCurrentRPM);
  const setIsEngineRunning = useEngineStore((s) => s.setIsEngineRunning);
  const setSelectedPreset = useEngineStore((s) => s.setSelectedPreset);

  const _startRPMSync = useCallback((): void => {
    if (rpmSyncRafRef.current !== null) return;

    const sync = (): void => {
      const sim = simulatorRef.current;
      if (sim) {
        setCurrentRPM(sim.currentRPM);
      }
      rpmSyncRafRef.current = requestAnimationFrame(sync);
    };
    rpmSyncRafRef.current = requestAnimationFrame(sync);
  }, [setCurrentRPM]);

  const _stopRPMSync = useCallback((): void => {
    if (rpmSyncRafRef.current !== null) {
      cancelAnimationFrame(rpmSyncRafRef.current);
      rpmSyncRafRef.current = null;
    }
  }, []);

  const initialize = useCallback(async (): Promise<void> => {
    if (audioEngineRef.current) {
      // Already initialized — resume if suspended
      try {
        await audioEngineRef.current.resume();
        setEngineStatus(audioEngineRef.current.state);
      } catch {
        // resume failure is non-fatal; state stays suspended
      }
      return;
    }

    const engine = new AudioEngine();
    audioEngineRef.current = engine;
    const sim = new EngineSimulator(engine);
    simulatorRef.current = sim;

    try {
      await engine.initialize();
      setEngineStatus(engine.state);

      // Load default preset
      const defaultPreset = getPreset('inline-4');
      if (defaultPreset) {
        sim.loadPreset(defaultPreset);
        setSelectedPreset('inline-4', defaultPreset);
      }
    } catch {
      setEngineStatus('uninitialized');
    }
  }, [setEngineStatus, setSelectedPreset]);

  const coldStart = useCallback((): void => {
    const engine = audioEngineRef.current;
    const sim = simulatorRef.current;
    if (!engine || !sim) return;

    // Handle suspended AudioContext (browser autoplay policy)
    if (engine.state === 'suspended') {
      engine.resume().catch(() => {
        // resume failure — user must re-interact
      });
      return;
    }

    sim.coldStart();
    setIsEngineRunning(true);
    _startRPMSync();
  }, [setIsEngineRunning, _startRPMSync]);

  const killEngine = useCallback((): void => {
    const sim = simulatorRef.current;
    if (!sim) return;

    sim.killEngine();
    setIsEngineRunning(false);
    _stopRPMSync();
    setCurrentRPM(0);
  }, [setIsEngineRunning, _stopRPMSync, setCurrentRPM]);

  const setMasterVolume = useCallback((value: number): void => {
    audioEngineRef.current?.setMasterVolume(value);
  }, []);

  const setTargetRPM = useCallback((rpm: number): void => {
    const sim = simulatorRef.current;
    if (!sim) return;
    sim.setTargetRPM(rpm);
    useEngineStore.getState().setTargetRPM(rpm);
  }, []);

  const loadPreset = useCallback(
    (presetId: EngineType): void => {
      const sim = simulatorRef.current;
      if (!sim) return;

      const preset = getPreset(presetId);
      if (!preset) return;

      sim.loadPreset(preset);
      setSelectedPreset(presetId, preset);
    },
    [setSelectedPreset],
  );

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      _stopRPMSync();
      simulatorRef.current?.dispose();
      simulatorRef.current = null;
      audioEngineRef.current = null;
    };
  }, [_stopRPMSync]);

  return {
    engineStatus,
    currentRPM,
    targetRPM,
    isEngineRunning,
    activePreset,
    waveformAnalyser: audioEngineRef.current?.waveformAnalyser ?? null,
    spectrumAnalyser: audioEngineRef.current?.spectrumAnalyser ?? null,
    initialize,
    coldStart,
    killEngine,
    setMasterVolume,
    setTargetRPM,
    loadPreset,
  };
}
