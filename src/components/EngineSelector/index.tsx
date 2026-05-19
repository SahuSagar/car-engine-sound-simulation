'use client';

import { useRef, useEffect, useState, type FC } from 'react';
import { useEnginePreset } from '@/hooks/useEnginePreset';
import type { EnginePreset } from '@/types/engine.types';
import styles from './EngineSelector.module.css';

const PRESET_LABELS: Record<string, string> = {
  'inline-4': 'I4',
  'v6-smooth': 'V6',
  'v8-muscle': 'V8',
  'v12-exotic': 'V12',
  rotary: 'Rotary',
};

interface TabIndicatorStyle {
  left: number;
  width: number;
}

export const EngineSelector: FC = () => {
  const { availablePresets, selectedPreset, selectPreset } = useEnginePreset();
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<TabIndicatorStyle>({ left: 0, width: 0 });

  useEffect(() => {
    if (!selectedPreset) return;
    const btn = tabRefs.current.get(selectedPreset.id);
    if (!btn) return;
    const { offsetLeft, offsetWidth } = btn;
    setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
  }, [selectedPreset]);

  const setTabRef =
    (id: string) =>
    (el: HTMLButtonElement | null): void => {
      if (el) {
        tabRefs.current.set(id, el);
      } else {
        tabRefs.current.delete(id);
      }
    };

  return (
    <div className={styles.container} role="tablist" aria-label="Engine preset selector">
      <div className={styles.track}>
        {availablePresets.map((preset: EnginePreset) => {
          const isActive = selectedPreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              ref={setTabRef(preset.id)}
              role="tab"
              aria-selected={isActive}
              aria-label={preset.name}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => selectPreset(preset.id)}
            >
              <span className={styles.tabShortLabel}>{PRESET_LABELS[preset.id] ?? preset.id}</span>
              <span className={styles.tabFullName}>{preset.name}</span>
            </button>
          );
        })}
        <div
          className={styles.indicator}
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
