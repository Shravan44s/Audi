'use client';

import { useEffect, useRef, type ElementType } from 'react';
import { prefersReducedMotion } from '@/lib/utils';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>=+';

/**
 * Text that decodes itself: random glyphs settle left to right into the real string.
 * Plays when it scrolls into view (or when `play` turns true), and again whenever
 * `text` changes, so live readouts re-decode on model swaps.
 */
export function Scramble({
  text,
  as: Tag = 'span',
  className,
  play = true,
  delay = 0,
  duration = 900,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  play?: boolean;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !play) return;
    if (prefersReducedMotion()) {
      el.textContent = text;
      return;
    }
    let raf = 0;
    let start = 0;
    let timer = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const settled = Math.floor(p * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      timer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, play, delay, duration]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
