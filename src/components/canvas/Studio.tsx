'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import type { Tier } from '@/lib/tier';

/** Horizon tone of the cyclorama: the floor fogs into it, so there is no visible seam. */
export const BG = '#121419';

const STREAKS = 40;

const rand = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The set: a graphite cyclorama that glows softly behind the car, a glossy floor that
 * mirrors it (satin on low-tier devices), a soft pool where the key light lands, and faint
 * road streaks at speed. Car shadows are baked per car in ExplodableCar.
 */
export function Studio({ tier }: { tier: Tier }) {
  const streaks = useRef<THREE.InstancedMesh>(null);
  const streakMat = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const poolMat = useRef<THREE.MeshBasicMaterial>(null);
  const backdrop = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 512;
    const g = c.getContext('2d')!;
    // Dark ceiling → lit band at the horizon behind the car → back to dark.
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#050608');
    grad.addColorStop(0.42, '#1b1e25');
    grad.addColorStop(0.62, BG);
    grad.addColorStop(1, '#08090b');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => backdrop.dispose(), [backdrop]);
  const poolTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(235,240,255,1)');
    grad.addColorStop(0.45, 'rgba(225,232,255,0.5)');
    grad.addColorStop(1, 'rgba(220,228,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => poolTex.dispose(), [poolTex]);
  const seeds = useMemo(
    () =>
      Array.from({ length: STREAKS }, (_, i) => ({
        x: rand(i, 1) * 50 - 25,
        z: (rand(i, 3) > 0.5 ? 1 : -1) * (1.6 + rand(i, 4) * 5),
        len: 0.6 + rand(i, 5) * 2.4,
        speed: 0.9 + rand(i, 6) * 0.4,
      })),
    [],
  );

  useFrame(() => {
    if (poolMat.current) poolMat.current.opacity = 0.1 * stage.studio * (1 - stage.roll * 0.7);
    const sm = streaks.current;
    if (sm) {
      sm.visible = stage.roll > 0.02;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const x = ((((s.x - stage.road * s.speed) % 50) + 50) % 50) - 25;
        dummy.position.set(x, 0.01, s.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(s.len * stage.roll, 0.015, 1);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      }
      sm.instanceMatrix.needsUpdate = true;
      streakMat.current!.opacity = stage.roll * 0.35;
    }
  });

  return (
    <>
      <primitive attach="background" object={backdrop} />
      <fog attach="fog" args={[BG, 14, 34]} />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
        <planeGeometry args={[80, 80]} />
        {tier === 'low' ? (
          <meshStandardMaterial color="#0b0c0f" roughness={0.35} metalness={0.5} envMapIntensity={0.4} />
        ) : (
          <MeshReflectorMaterial
            resolution={tier === 'high' ? 1024 : 512}
            blur={[90, 30]}
            mixBlur={0.5}
            mixStrength={3.2}
            mixContrast={1}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.6}
            color="#0b0c0f"
            roughness={0.35}
            metalness={0.55}
            envMapIntensity={0.05}
          />
        )}
      </mesh>

      {/* The key light's pool on the floor, fading into the cyclorama. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={-2}>
        <planeGeometry args={[11, 8]} />
        <meshBasicMaterial ref={poolMat} map={poolTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <instancedMesh ref={streaks} args={[undefined, undefined, STREAKS]} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={streakMat}
          color="#dfe9ff"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </>
  );
}
