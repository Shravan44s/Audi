'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/** HUD crosshair for fine pointers: a reticle that locks on (rotates + expands) over targets. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const r = ring.current;
    const d = dot.current;
    if (!r || !d || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    gsap.set([r, d], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const rx = gsap.quickTo(r, 'x', { duration: 0.45, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.45, ease: 'power3.out' });
    const dx = gsap.quickTo(d, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(d, 'y', { duration: 0.08 });

    const move = (e: PointerEvent) => {
      gsap.to([r, d], { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      const hot = (e.target as Element).closest?.('a, button, input, select, [data-cursor]');
      gsap.to(r, { scale: hot ? 1.7 : 1, rotate: hot ? 45 : 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    };
    const leave = () => gsap.to([r, d], { autoAlpha: 0, duration: 0.3 });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div ref={ring} className="brackets fixed top-0 left-0 size-7 [--s:7px] [--b:rgb(255_255_255/0.8)]" />
      <div ref={dot} className="fixed top-0 left-0 size-1 bg-red" />
    </div>
  );
}
