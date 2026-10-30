'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/lib/utils';

type Props = { to: number; decimals?: number; prefix?: string; suffix?: string; className?: string; /** Thousands separators; off for years. */ group?: boolean };

export function CountUp({ to, decimals = 0, prefix = '', suffix = '', className, group = true }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (v: number) => `${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: group })}${suffix}`;

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    const counter = { v: 0 };
    el.textContent = format(0);
    gsap.to(counter, {
      v: to,
      duration: 2.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        el.textContent = format(counter.v);
      },
    });
  });

  return (
    <span ref={ref} className={className}>
      {format(to)}
    </span>
  );
}
