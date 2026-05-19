import { create } from 'zustand';

interface UiStoreState {
  readonly isMuted: boolean;
  readonly masterVolume: number;
  readonly isOscilloscopeVisible: boolean;
  readonly isSpectrumVisible: boolean;
  readonly isSettingsOpen: boolean;
  readonly isRecording: boolean;
}

interface UiStoreActions {
  setIsMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setIsOscilloscopeVisible: (visible: boolean) => void;
  setIsSpectrumVisible: (visible: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsRecording: (recording: boolean) => void;
}

type UiStore = UiStoreState & UiStoreActions;

export const useUiStore = create<UiStore>()((set) => ({
  isMuted: false,
  masterVolume: 0.8,
  isOscilloscopeVisible: true,
  isSpectrumVisible: true,
  isSettingsOpen: false,
  isRecording: false,

  setIsMuted: (muted): void => set({ isMuted: muted }),
  setMasterVolume: (volume): void => set({ masterVolume: volume }),
  setIsOscilloscopeVisible: (visible): void => set({ isOscilloscopeVisible: visible }),
  setIsSpectrumVisible: (visible): void => set({ isSpectrumVisible: visible }),
  setIsSettingsOpen: (open): void => set({ isSettingsOpen: open }),
  setIsRecording: (recording): void => set({ isRecording: recording }),
}));
