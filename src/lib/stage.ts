import type gsap from 'gsap';
import { clamp, lerp, smoothstep } from './utils';

/**
 * The film. The car stays parked in the studio; the *camera* moves, the way a real
 * car commercial is shot. Each key is pinned to a point in the page (a section id
 * plus how far through it), so the shot stays in sync with the DOM whatever the
 * viewport height. Values are read every frame by CameraRig / CarRig and never
 * touch React state.
 *
 * Orbit: az = 0 looks at the car's right flank (nose pointing right), az = π/2
 * looks at the nose, az = −π/2 at the tail. el is elevation in radians.
 */
export type Shot = {
  az: number;
  el: number;
  dist: number;
  /** Sideways lens shift, m: positive puts the car on the left of the frame. */
  shift: number;
  /** Look-at height, m. */
  lift: number;
  fov: number;
  /** 0 = car closed, 1 = split open with every layer labelled. */
  explode: number;
  /** Rolling road: wheels turn and light gates stream past. */
  roll: number;
  /** Slow automatic orbit, rad/s (the showroom turntable feel, done with the camera). */
  spin: number;
};

/**
 * Anchor: [section id, p, off]. Resolves to the scrollY where the section's
 * progress (0 = its top at viewport top, 1 = its bottom at viewport bottom) is p,
 * shifted by off viewport heights.
 */
type Anchor = [id: string, p: number, off?: number];

type Key = { at: Anchor; shot: Partial<Shot>; portrait?: Partial<Shot> };

const BASE: Shot = { az: 0.7, el: 0.12, dist: 9, shift: 0, lift: 0.55, fov: 30, explode: 0, roll: 0, spin: 0 };

const KEYS: Key[] = [
  {
    at: ['hero', 0],
    shot: { az: 0.62, el: 0.07, dist: 8.6, shift: 0, lift: 0.75, fov: 30, spin: 0.035 },
    portrait: { dist: 13.5, lift: 1.4 },
  },
  {
    at: ['hero', 1, -0.3],
    shot: { az: 0.85, el: 0.16, dist: 9.4, shift: 0, lift: 0.6, spin: 0 },
    portrait: { dist: 14 },
  },
  {
    // 01 Design: low and close on the nose.
    at: ['story', 0.16],
    shot: { az: 1.25, el: 0.06, dist: 7.8, shift: 1.35, lift: 0.6, fov: 28 },
    portrait: { shift: 0, dist: 10, lift: -0.4 },
  },
  {
    // 02 quattro: pure profile on the rolling road.
    at: ['story', 0.4],
    shot: { az: 0.02, el: 0.035, dist: 9.2, shift: -1.6, lift: 0.6, fov: 30, roll: 1 },
    portrait: { shift: 0, dist: 13, lift: -0.6 },
  },
  {
    // 03 Inside: high three-quarter, opened.
    at: ['story', 0.64],
    shot: { az: 0.75, el: 0.78, dist: 10.5, shift: 1.6, lift: 0.4, fov: 30, explode: 1, roll: 0 },
    portrait: { shift: 0, dist: 15, lift: -1 },
  },
  {
    // 04 Progress: rear three-quarter, light bar.
    at: ['story', 0.86],
    shot: { az: -2.25, el: 0.12, dist: 9.6, shift: -1.5, lift: 0.6, explode: 0 },
    portrait: { shift: 0, dist: 11, lift: -0.4 },
  },
  {
    at: ['models', 0, -0.2],
    shot: { az: -5.55, el: 0.2, dist: 10.2, shift: 0, lift: 0.5, fov: 30, spin: 0.07 },
    portrait: { dist: 15, lift: 1.2 },
  },
  {
    at: ['models', 1, 0],
    shot: { az: -5.55, el: 0.2, dist: 10.2 },
    portrait: { dist: 15 },
  },
  {
    at: ['models', 1, 0.9],
    shot: { el: 1.25, dist: 16, spin: 0 },
  },
  {
    at: ['outro', 0, -0.4],
    shot: { az: -5.0, el: 1.2, dist: 16, roll: 0 },
  },
  {
    at: ['outro', 0, 0.4],
    shot: { az: -5.85, el: 0.06, dist: 8.4, shift: 0, lift: 0.95, fov: 30, spin: 0.04 },
    portrait: { dist: 13, lift: 1.6 },
  },
];

type Resolved = { y: number; shot: Shot; portrait: Shot };

let resolved: Resolved[] = [];

/** Recompute key scroll positions from the live layout. Call on resize / refresh. */
export function resolveKeys(): void {
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  let prev = BASE;
  let prevPortrait = BASE;
  const next: Resolved[] = [];

  for (const key of KEYS) {
    const [id, p, off = 0] = key.at;
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const top = rect.top + scrollY;
    const span = Math.max(rect.height - vh, 0);
    const shot = { ...prev, ...key.shot };
    const portrait = { ...prevPortrait, ...key.shot, ...key.portrait };
    next.push({ y: top + p * span + off * vh, shot, portrait });
    prev = shot;
    prevPortrait = portrait;
  }

  resolved = next.sort((a, b) => a.y - b.y);
}

const out: Shot = { ...BASE };

/** Shot for a scroll position, eased between the surrounding keys. */
export function shotAt(scrollY: number, portrait: boolean): Shot {
  if (resolved.length === 0) return out;
  const pick = (r: Resolved) => (portrait ? r.portrait : r.shot);

  let i = 0;
  while (i < resolved.length - 1 && scrollY > resolved[i + 1].y) i++;

  const a = resolved[i];
  const b = resolved[Math.min(i + 1, resolved.length - 1)];
  const t = a === b ? 0 : smoothstep(clamp((scrollY - a.y) / (b.y - a.y), 0, 1));
  const pa = pick(a);
  const pb = pick(b);

  for (const k of Object.keys(out) as (keyof Shot)[]) out[k] = lerp(pa[k], pb[k], t);
  return out;
}

/** Shared per-frame inputs written by DOM listeners and tweens. */
export const stage = {
  pointer: { x: 0, y: 0 },
  /** Hero intro 0 → 1, tweened when the loader leaves. */
  intro: 0,
  velocity: 0,
  /** Car drive offset along its own nose axis, m: swaps drive the old car out of frame. */
  drive: 0,
  /** Materialise scan, m along the car from tail (−) to nose (+); ≥ 3 = fully built. */
  scan: 10,
  /** Studio lights 0 (dark) → 1 (lit); the overhead tubes flicker on in sequence as it rises. */
  studio: 0,
  /** Per-strip brightness (0–1) computed each frame by Lights, read by the visible strips. */
  strips: [0, 0, 0, 0, 0],
  /** Showroom orbit drag, rad. */
  drag: { az: 0, el: 0, active: false },
  /** Pointer is over the showroom car hit area. */
  hover: false,
  /** Live, eased explode amount (0–1) the car reads each frame. */
  explode: 0,
  /** Live rolling-road amount (0–1). */
  roll: 0,
  /** 0 → 1 dynamic light sequence (DRLs and the tail bar), replayed on intro and swaps. */
  lights: 0,
  /** Chassis dynamics written by CarRig: body roll/pitch/heave, wheel roll angle, front steer. */
  motion: { roll: 0, pitch: 0, heave: 0, spin: 0, steer: 0 },
  /** Road travel, m: drives the floor grid and light gates. */
  road: 0,
};

/** Audi "welcome" light sequence: two quick flashes, then on. */
export function welcomeLights(tl: gsap.core.Timeline, at: number | string) {
  tl.to(stage, { lights: 1, duration: 0.12, ease: 'none' }, at)
    .to(stage, { lights: 0.1, duration: 0.12, ease: 'none' })
    .to(stage, { lights: 1, duration: 0.12, ease: 'none' })
    .to(stage, { lights: 0.1, duration: 0.14, ease: 'none' })
    .to(stage, { lights: 1, duration: 0.6, ease: 'power2.out' });
}

