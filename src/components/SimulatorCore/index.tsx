'use client';

import { useEffect } from 'react';
import { useEngineAudio } from '@/hooks/useEngineAudio';
import styles from './SimulatorCore.module.css';

export function SimulatorCore(): React.JSX.Element {
  const { initialize } = useEngineAudio();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <div className={styles.core}>
      <span className={styles.readyLabel}>RevSim Engine Ready</span>
    </div>
  );
}
