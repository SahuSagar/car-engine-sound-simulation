'use client';

import { useCallback, useRef } from 'react';
import { getAllPresets, getPreset } from '@/engine/presets';
import { useEngineStore } from '@/store/engineStore';
import { useEngineAudio } from '@/hooks/useEngineAudio';
import type { EnginePreset, EngineType } from '@/types/engine.types';

interface UseEnginePresetReturn {
  readonly availablePresets: EnginePreset[];
  readonly selectedPreset: EnginePreset | null;
  selectPreset: (presetId: EngineType) => void;
}

const CROSSFADE_TAU = 0.2;
const CROSSFADE_DURATION_MS = CROSSFADE_TAU * 5 * 1000;

export function useEnginePreset(): UseEnginePresetReturn {
  const { loadPreset, engineStatus } = useEngineAudio();
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPreset = useEngineStore((s) => s.activePreset);
  const selectedPresetId = useEngineStore((s) => s.selectedPresetId);

  const availablePresets = getAllPresets();

  const selectPreset = useCallback(
    (presetId: EngineType): void => {
      if (presetId === selectedPresetId) return;

      const preset = getPreset(presetId);
      if (!preset) return;

      // Cancel any in-flight crossfade before starting a new one
      if (crossfadeTimeoutRef.current !== null) {
        clearTimeout(crossfadeTimeoutRef.current);
        crossfadeTimeoutRef.current = null;
      }

      if (engineStatus !== 'running') {
        // Engine not running — load immediately, no crossfade needed
        loadPreset(presetId);
        return;
      }

      // Crossfade: load the new preset after τ * 5 (≈ tail of setTargetAtTime decay)
      // The AudioEngine master gain fade-down is handled inside EngineSimulator.loadPreset
      // which rebuilds the signal chain; we schedule the swap after one crossfade window
      // so the outgoing chain has time to ramp to silence via its natural τ = 0.2s decay.
      crossfadeTimeoutRef.current = setTimeout(() => {
        crossfadeTimeoutRef.current = null;
        loadPreset(presetId);
      }, CROSSFADE_DURATION_MS);

      // Immediately update store so UI reflects the selection without waiting for audio swap
      useEngineStore.getState().setSelectedPreset(presetId, preset);
    },
    [selectedPresetId, engineStatus, loadPreset],
  );

  return {
    availablePresets,
    selectedPreset,
    selectPreset,
  };
}
