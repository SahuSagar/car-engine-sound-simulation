import { create } from 'zustand';
import type { EnginePreset, EngineLifecycleState, EngineType } from '@/types/engine.types';

interface EngineStoreState {
  readonly currentRPM: number;
  readonly targetRPM: number;
  readonly selectedPresetId: EngineType;
  readonly isEngineRunning: boolean;
  readonly engineStatus: EngineLifecycleState;
  readonly activePreset: EnginePreset | null;
}

interface EngineStoreActions {
  setCurrentRPM: (rpm: number) => void;
  setTargetRPM: (rpm: number) => void;
  setSelectedPreset: (presetId: EngineType, preset: EnginePreset) => void;
  setIsEngineRunning: (running: boolean) => void;
  setEngineStatus: (status: EngineLifecycleState) => void;
}

type EngineStore = EngineStoreState & EngineStoreActions;

export const useEngineStore = create<EngineStore>()((set) => ({
  currentRPM: 0,
  targetRPM: 0,
  selectedPresetId: 'inline-4',
  isEngineRunning: false,
  engineStatus: 'uninitialized',
  activePreset: null,

  setCurrentRPM: (rpm): void => set({ currentRPM: rpm }),
  setTargetRPM: (rpm): void => set({ targetRPM: rpm }),
  setSelectedPreset: (presetId, preset): void =>
    set({ selectedPresetId: presetId, activePreset: preset }),
  setIsEngineRunning: (running): void => set({ isEngineRunning: running }),
  setEngineStatus: (status): void => set({ engineStatus: status }),
}));
