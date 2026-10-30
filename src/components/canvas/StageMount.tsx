'use client';

import dynamic from 'next/dynamic';

const Stage = dynamic(() => import('./Stage'), { ssr: false });

/** Fixed full-screen WebGL layer behind all page content. */
export function StageMount() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--bg)]">
      <Stage />
    </div>
  );
}
