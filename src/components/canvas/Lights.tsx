'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { stage } from '@/lib/stage';

/** Overhead softbox strips, z positions (m). The visible tubes in Studio use the same. */
export const STRIPS = [-2.4, -1.2, 0, 1.2, 2.4];
const TUNNEL = 10;
const TUNNEL_SPACING = 5;

const hash = (n: number) => {
  const x = Math.sin(n * 91.7) * 43758.5453;
  return x - Math.floor(x);
};

type Formers = { mesh: THREE.Mesh | null; base: number }[];

/** Per-frame writes to three objects live outside the component. */
function setEnv(scene: THREE.Scene, v: number) {
  scene.environmentIntensity = v;
}

function setIntensity(f: THREE.Mesh | null, v: number) {
  const m = f?.material as THREE.MeshBasicMaterial | undefined;
  m?.color.setScalar(v);
}

/**
 * The studio's light, shot like a car launch: a graphite cyclorama, one big cool
 * overhead softbox, long side strips and edge-lighting rims, all rendered live as
 * Lightformers into the environment map the paint reflects:
 *  - five overhead softboxes that flicker on one by one in the intro (fluorescent start-up),
 *  - a light bar that sweeps over the car every few seconds, dragging a highlight across the paint,
 *  - tunnel lights that rush past on the rolling road, streaking along the bodywork.
 */
export function Lights() {
  const scene = useThree((s) => s.scene);
  const strips = useRef<Formers>(STRIPS.map(() => ({ mesh: null, base: 1.6 })));
  const sweep = useRef<THREE.Mesh>(null);
  const flanks = useRef<(THREE.Mesh | null)[]>([]);
  const canopy = useRef<THREE.Mesh>(null);
  const rims = useRef<(THREE.Mesh | null)[]>([]);
  const tunnel = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const studio = stage.studio;
    const roll = stage.roll;

    // Tubes strike one after another, flickering before they settle.
    strips.current.forEach((s, i) => {
      const local = THREE.MathUtils.clamp((studio - i * 0.13) / 0.32, 0, 1);
      const flicker = local > 0 && local < 1 ? (hash(Math.floor(t * 24) + i * 7) > 0.45 ? 1 : 0.08) : 1;
      const v = local * flicker * (1 - roll * 0.75);
      stage.strips[i] = v;
      setIntensity(s.mesh, s.base * v);
    });

    // Light-bar sweep: a highlight that glides along the car every ~7 s.
    const p = ((t * 0.14) % 1) * 2 - 1;
    if (sweep.current) {
      sweep.current.position.x = p * 9;
      setIntensity(sweep.current, 2.6 * studio * (1 - roll) * Math.sin(((p + 1) / 2) * Math.PI));
    }

    // Tunnel lights stream past on the rolling road.
    const tg = tunnel.current;
    if (tg) {
      const span = TUNNEL * TUNNEL_SPACING;
      tg.children.forEach((c, i) => {
        c.position.x = ((((i >> 1) * TUNNEL_SPACING - stage.road) % span) + span) % span - span / 2;
        setIntensity(c as THREE.Mesh, 2.6 * roll);
      });
    }

    // Side softboxes draw one long, unbroken highlight down each flank: the showroom signature.
    flanks.current.forEach((f) => setIntensity(f, 2.4 * studio * (1 - roll * 0.6)));
    rims.current.forEach((f) => setIntensity(f, 2.2 * studio));
    setIntensity(canopy.current, 1.5 * studio);

    setEnv(scene, 0.15 + 1.15 * studio);
    if (spot.current) spot.current.intensity = 200 * studio;
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      {/* Key from above: lifts the car out of the set with a soft pool around it. */}
      <spotLight ref={spot} position={[0.4, 9, 1.2]} angle={0.55} penumbra={0.9} decay={2} intensity={0} color="#f2f5ff" />

      {/* Softboxes on black, no HDRI: its mottled photo reads as blotches in a mirror-smooth clearcoat. */}
      <Environment resolution={512} frames={Infinity} environmentIntensity={0.1}>
        {/* Graphite cyclorama: the dark side of the car keeps a readable shape. */}
        <mesh scale={40}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#181a20" side={THREE.BackSide} />
        </mesh>
        {/* Big overhead diffuser: one clean highlight across roof, bonnet and shoulders. */}
        <Lightformer ref={canopy} form="rect" intensity={0} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} color="#f2f5ff" />
        {/* Tall rims fore and aft: bright edges on the nose and tail that cut the car out of the background. */}
        {[-1, 1].map((s, i) => (
          <Lightformer
            key={`rim${s}`}
            ref={(m: THREE.Mesh | null) => void (rims.current[i] = m)}
            form="rect"
            intensity={0}
            position={[8 * s, 2, 0]}
            rotation-y={(-s * Math.PI) / 2}
            scale={[0.8, 5, 1]}
            color="#e8eeff"
          />
        ))}
        {STRIPS.map((z, i) => (
          <Lightformer
            key={z}
            ref={(m: THREE.Mesh | null) => void (strips.current[i].mesh = m)}
            form="rect"
            intensity={0}
            position={[0, 5, z]}
            rotation-x={Math.PI / 2}
            scale={[12, 0.32, 1]}
          />
        ))}
        {[-1, 1].map((s, i) => (
          <Lightformer
            key={s}
            ref={(m: THREE.Mesh | null) => void (flanks.current[i] = m)}
            form="rect"
            intensity={0}
            position={[0, 1.6, 6 * s]}
            rotation-y={s > 0 ? Math.PI : 0}
            scale={[16, 0.5, 1]}
          />
        ))}
        <Lightformer ref={sweep} form="rect" intensity={0} position={[0, 3.2, 0]} rotation-x={Math.PI / 2} scale={[0.6, 10, 1]} />
        <group ref={tunnel}>
          {Array.from({ length: TUNNEL * 2 }, (_, j) => {
            const z = j % 2 ? 4 : -4;
            return <Lightformer key={j} form="rect" intensity={0} position={[0, 2.6, z]} rotation-y={z > 0 ? Math.PI : 0} scale={[1.6, 0.25, 1]} />;
          })}
        </group>
        <Lightformer form="rect" intensity={0.6} position={[0, 0.5, -9]} scale={[18, 0.4, 1]} color="#f50537" />
      </Environment>
    </>
  );
}
