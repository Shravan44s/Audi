'use client';

import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';

/**
 * Floating glass chip for one exploded layer, with a leader line down to its anchor
 * dot. Ported from factory-twin's cigarette explorer and restyled for the showroom.
 */
export function PartLabel({
  position,
  title,
  sub,
  accent,
  visible,
  delay = 0,
  lift = 46,
}: {
  position: [number, number, number];
  title: string;
  sub: string;
  accent: string;
  visible: boolean;
  /** Stagger in ms so the chips cascade in after the parts have moved. */
  delay?: number;
  /** Leader length in px. */
  lift?: number;
}) {
  // Html mounts a separate React root. Tearing one down in the same commit that swaps
  // the hologram stand-in for the real car throws (removeChild on a detached node), and
  // the car's error boundary then sticks on the hologram. So a chip exists only while
  // shown, plus its fade-out.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  useEffect(() => {
    if (visible) return;
    const id = setTimeout(() => setMounted(false), 600);
    return () => clearTimeout(id);
  }, [visible]);
  if (!mounted) return null;

  return (
    <Html position={position} zIndexRange={[20, 0]} className="pointer-events-none select-none" style={{ transform: 'translate(-50%, -100%)' }}>
      <div
        className="flex flex-col items-center transition-[opacity,transform] duration-500 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.92)',
          transitionDelay: visible ? `${delay}ms` : '0ms',
        }}
      >
        <div
          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 whitespace-nowrap backdrop-blur-md"
          style={{
            background: 'rgba(10,11,14,0.78)',
            borderColor: 'rgba(255,255,255,0.14)',
            boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 18px ${accent}22`,
          }}
        >
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <span className="leading-tight">
            <span className="block text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
              {title}
            </span>
            <span className="block text-[10px] text-white/60">{sub}</span>
          </span>
        </div>
        <span
          className="w-px origin-top transition-transform duration-500"
          style={{
            height: lift,
            background: `linear-gradient(${accent}, ${accent}00)`,
            transform: visible ? 'scaleY(1)' : 'scaleY(0)',
            transitionDelay: visible ? `${delay + 120}ms` : '0ms',
          }}
        />
        <span className="size-2 rounded-full border" style={{ borderColor: accent, background: `${accent}55` }} />
      </div>
    </Html>
  );
}
