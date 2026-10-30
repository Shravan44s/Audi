'use client';

import { useRef, type ReactNode } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useApp } from '@/lib/store';

/**
 * Opaque run of sections. While it fully covers the viewport the WebGL layer is
 * hidden anyway, so we pause its render loop to save battery.
 */
export function SceneOccluder({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const set = useApp.getState().setSceneVisible;
    ScrollTrigger.create({
      trigger: ref.current,
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => set(!self.isActive),
    });
    return () => set(true);
  });

  return (
    <div ref={ref} className="relative z-10 bg-bg shadow-[0_-60px_80px_-10px_var(--bg)]">
      {/* Glowing seam where the studio ends */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red to-transparent shadow-[0_0_14px_var(--red)]" />
      {children}
    </div>
  );
}
