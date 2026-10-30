export type Tier = 'high' | 'mid' | 'low';

export const TIER_DPR: Record<Tier, number | [number, number]> = {
  high: [1, 1.5],
  mid: [1, 1.25],
  low: 1,
};

/**
 * Pick a render-quality tier from what the device tells us up front.
 * PerformanceMonitor can still step it down at runtime.
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'mid';

  let renderer = '';
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return 'low';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)).toLowerCase();
  } catch {
    return 'low';
  }
  if (/swiftshader|llvmpipe|software/.test(renderer)) return 'low';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  if (cores <= 4 || memory <= 3) return 'low';
  if (coarse || cores <= 6) return 'mid';
  return 'high';
}

export function downgrade(tier: Tier): Tier {
  return tier === 'high' ? 'mid' : 'low';
}
