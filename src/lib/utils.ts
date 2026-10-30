import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}

/** Frame-rate independent easing toward a target. */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

/** Rescale a slice [start, end] of a 0–1 progress back to 0–1. */
export function window01(p: number, start: number, end: number): number {
  return clamp((p - start) / (end - start), 0, 1);
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type Spring = { x: number; v: number };

/**
 * Damped spring toward a target. zeta < 1 lets it overshoot a touch and settle,
 * which reads as mass rather than the dead stop of an exponential ease.
 */
export function spring(s: Spring, target: number, stiffness: number, zeta: number, delta: number): number {
  const c = 2 * Math.sqrt(stiffness) * zeta;
  const steps = 3;
  const h = delta / steps;
  for (let i = 0; i < steps; i++) {
    s.v += ((target - s.x) * stiffness - s.v * c) * h;
    s.x += s.v * h;
  }
  return s.x;
}
