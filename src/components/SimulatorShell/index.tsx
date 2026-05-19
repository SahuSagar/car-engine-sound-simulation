'use client';

import dynamic from 'next/dynamic';
import styles from './SimulatorShell.module.css';

function EngineSkeleton(): React.JSX.Element {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonPulse} />
      <span>Initializing</span>
    </div>
  );
}

const SimulatorCore = dynamic(
  () => import('@/components/SimulatorCore').then((mod) => ({ default: mod.SimulatorCore })),
  {
    ssr: false,
    loading: () => <EngineSkeleton />,
  },
);

export function SimulatorShell(): React.JSX.Element {
  return (
    <div className={styles.shell}>
      <SimulatorCore />
    </div>
  );
}
