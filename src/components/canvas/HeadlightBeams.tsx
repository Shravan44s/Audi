'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import type { Shape } from './carGeometry';

const LENGTH = 9;
export const BEAM_LAYER = 1;

/** Per-frame uniform writes live outside the component (three objects are imperative). */
function setOn(m: THREE.ShaderMaterial, v: number) {
  m.uniforms.uOn.value = v;
}

/**
 * Volumetric-looking headlight beams: soft additive cones from each lamp plus a
 * pool of light on the floor ahead of the car. They wake with the light sequence
 * and fade out when the car is opened up.
 */
export function HeadlightBeams({ shape }: { shape: Shape }) {
  const group = useRef<THREE.Group>(null);
  const x = shape.xMax - 0.18;
  const y = shape.top(x) - 0.12;
  const z = shape.half(x) * 0.68;

  const coneGeo = useMemo(() => {
    // Apex at the lamp, opening along +x.
    const g = new THREE.CylinderGeometry(0.06, 1.5, LENGTH, 40, 12, true);
    g.translate(0, -LENGTH / 2, 0);
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);

  const beam = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uOn: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexShader: /* glsl */ `
          varying float vT;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vT = clamp(position.x / ${LENGTH.toFixed(1)}, 0.0, 1.0);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - w.xyz);
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uOn;
          varying float vT;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            // Soft edges: brightest where we look through the cone's thickness.
            float core = pow(abs(dot(normalize(vN), vV)), 1.6);
            float fall = pow(1.0 - vT, 2.2);
            float a = core * fall * 0.16 * uOn;
            gl_FragColor = vec4(vec3(0.85, 0.93, 1.0) * a, a);
          }`,
      }),
    [],
  );

  const pool = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uOn: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uOn;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - vec2(0.0, 0.5);
            float d = length(vec2(p.x * 0.9, p.y * 1.6));
            float a = pow(smoothstep(0.7, 0.0, d), 2.0) * smoothstep(0.0, 0.25, vUv.x) * 0.1 * uOn;
            gl_FragColor = vec4(vec3(0.85, 0.93, 1.0) * a, a);
          }`,
      }),
    [],
  );

  // Layer 1: the main camera sees the beams, the contact-shadow camera (layer 0) does not.
  useLayoutEffect(() => {
    group.current?.traverse((o) => o.layers.set(BEAM_LAYER));
  }, []);

  useFrame(() => {
    const on = stage.lights * (1 - stage.explode) * (1 - stage.roll * 0.5);
    setOn(beam, on);
    setOn(pool, on);
    if (group.current) group.current.visible = on > 0.01;
  });

  return (
    <group ref={group}>
      {[z, -z].map((zz) => (
        <mesh key={zz} geometry={coneGeo} material={beam} position={[x, y, zz]} rotation-z={-0.05} renderOrder={3} />
      ))}
      <mesh material={pool} rotation-x={-Math.PI / 2} position={[x + 4.2, 0.006, 0]} renderOrder={2}>
        <planeGeometry args={[8, 4.6]} />
      </mesh>
    </group>
  );
}
