'use client';

import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tier } from '@/lib/tier';

/** Three.js objects are imperative; writes go through here, outside React's render model. R3F's default is ACES. */
function setToneMapping(gl: THREE.WebGLRenderer, v: THREE.ToneMapping) {
  gl.toneMapping = v;
}

/**
 * Lean, photographic grade: bloom only on genuinely hot pixels (DRLs, tubes, beams),
 * AgX tone mapping for natural highlight roll-off on the paint, SMAA instead of costly
 * MSAA, and a soft vignette.
 */
export function Effects({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl);
  // Without the composer, the renderer grades instead, so low tier keeps the same colour.
  useLayoutEffect(() => setToneMapping(gl, tier === 'low' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping), [gl, tier]);
  if (tier === 'low') return null;
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom mipmapBlur luminanceThreshold={1.15} luminanceSmoothing={0.1} intensity={0.55} radius={0.55} />
      <Vignette offset={0.25} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
