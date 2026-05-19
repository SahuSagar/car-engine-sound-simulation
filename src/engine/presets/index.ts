import type { EnginePreset } from '@/types/engine.types';
import inline4Preset from './inline-4.json';
import v6SmoothPreset from './v6-smooth.json';
import v8MusclePreset from './v8-muscle.json';
import v12ExoticPreset from './v12-exotic.json';
import rotaryPreset from './rotary.json';

const PRESETS: Record<string, EnginePreset> = {
  'inline-4': inline4Preset as EnginePreset,
  'v6-smooth': v6SmoothPreset as EnginePreset,
  'v8-muscle': v8MusclePreset as EnginePreset,
  'v12-exotic': v12ExoticPreset as EnginePreset,
  rotary: rotaryPreset as EnginePreset,
};

export function getPreset(id: string): EnginePreset | null {
  const preset = PRESETS[id];
  return preset ?? null;
}

export function getAllPresets(): EnginePreset[] {
  return Object.values(PRESETS);
}

export function getPresetByType(id: string): EnginePreset {
  const preset = PRESETS[id];
  if (!preset) {
    throw new Error(`Unknown preset id: ${id}`);
  }
  return preset;
}
