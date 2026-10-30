'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINISHES, PART_COLORS, type Car, type PartKey } from '@/data/cars';
import { stage } from '@/lib/stage';
import { useApp } from '@/lib/store';
import { damp, lerp } from '@/lib/utils';
import { bodyHalf, glassHalf, grilleHalf, lightStrip, makeShape, shadowTexture, WHEEL_INSET } from './carGeometry';
import {
  Battery,
  BATTERY_COLS,
  BATTERY_ROWS,
  batteryLayout,
  Cabin,
  cabinAnchors,
  EMotor,
  Engine,
  MAT,
  Wheel,
} from './CarParts';
import type { GlbLayers } from './CarModel';
import { hologramMaterial } from './materialize';
import { HeadlightBeams } from './HeadlightBeams';
import { PartLabel } from './PartLabel';

const SIDES = [1, -1] as const;

/** Light segments per lamp, lit one after another (Audi's dynamic light sequence). */
const SEGMENTS = 6;

/** 0 → 1 over [a, b] with a soft spring overshoot, so layers settle rather than stop. */
function stagger(e: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (e - a) / (b - a)));
  const c1 = 1.25;
  const c3 = c1 + 1;
  return t === 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Three.js objects are imperative; per-frame writes go through here, outside React's render model. */
function easePaint(p: THREE.MeshPhysicalMaterial, color: THREE.Color, f: (typeof FINISHES)[keyof typeof FINISHES], k: number) {
  p.color.lerp(color, k);
  p.roughness = lerp(p.roughness, f.roughness, k);
  p.metalness = lerp(p.metalness, f.metalness, k);
  p.clearcoatRoughness = lerp(p.clearcoatRoughness, f.clearcoatRoughness, k);
  p.iridescence = Math.max(0.001, lerp(p.iridescence, f.iridescence, k));
}

function setEmissive(m: THREE.MeshStandardMaterial, v: number) {
  m.emissiveIntensity = v;
}
function setTime(m: THREE.ShaderMaterial, t: number) {
  m.uniforms.uTime.value = t;
}

/**
 * A car that splits open to show its interior, the way the factory-twin cigarette
 * splits lengthwise. Layers move on a staggered, slightly springy schedule:
 * glasshouse lifts → shell halves part → wheels slide out → cabin rises → battery
 * modules spread. Closing runs the same schedule backwards.
 *
 * Motion inputs (explode, roll/pitch, wheel spin, steer, lights) arrive through the
 * shared `stage` object every frame; React only re-renders for label visibility.
 */
export function ExplodableCar({ car, glb }: { car: Car; glb?: GlbLayers | null }) {
  const shape = useMemo(() => makeShape(car), [car]);
  const geo = useMemo(
    () => ({
      body: { 1: bodyHalf(shape, 1), [-1]: bodyHalf(shape, -1) } as Record<1 | -1, THREE.BufferGeometry>,
      glass: { 1: glassHalf(shape, 1), [-1]: glassHalf(shape, -1) } as Record<1 | -1, THREE.BufferGeometry>,
      grille: { 1: grilleHalf(shape, 1), [-1]: grilleHalf(shape, -1) } as Record<1 | -1, THREE.BufferGeometry>,
      head: SIDES.flatMap((s) =>
        Array.from({ length: SEGMENTS }, (_, i) => {
          const y = shape.top(shape.xMax - 0.15) - 0.075 + i * 0.004;
          return { side: s, i, g: lightStrip(shape, 1, s, 0.62 + (i / SEGMENTS) * 0.32, 0.62 + ((i + 0.85) / SEGMENTS) * 0.32, y, 0.035) };
        }),
      ),
      tail: SIDES.flatMap((s) =>
        Array.from({ length: SEGMENTS }, (_, i) => ({
          side: s,
          i,
          g: lightStrip(shape, -1, s, (i / SEGMENTS) * 0.96, ((i + 0.9) / SEGMENTS) * 0.96, shape.top(shape.xMin + 0.12) - 0.1, 0.045),
        })),
      ),
    }),
    [shape],
  );

  useEffect(
    () => () => {
      for (const s of SIDES) {
        geo.body[s].dispose();
        geo.glass[s].dispose();
        geo.grille[s].dispose();
      }
      geo.head.forEach((h) => h.g.dispose());
      geo.tail.forEach((t) => t.g.dispose());
    },
    [geo],
  );

  /* -------- materials owned by this car -------- */
  // Without a real model the procedural car is shown honestly: as a hologram blueprint.
  const holo = useMemo(() => hologramMaterial(car.glow), [car.glow]);
  const holoGlass = useMemo(() => {
    const m = hologramMaterial('#bfefff');
    m.uniforms.uOpacity.value = 0.45;
    return m;
  }, []);
  const edges = useMemo(
    () => ({
      1: new THREE.EdgesGeometry(geo.body[1], 28),
      [-1]: new THREE.EdgesGeometry(geo.body[-1], 28),
      g1: new THREE.EdgesGeometry(geo.glass[1], 28),
      g2: new THREE.EdgesGeometry(geo.glass[-1], 28),
    }),
    [geo],
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(car.glow).multiplyScalar(1.6), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [car.glow],
  );
  useEffect(
    () => () => {
      holo.dispose();
      holoGlass.dispose();
      edgeMat.dispose();
      Object.values(edges).forEach((e) => e.dispose());
    },
    [holo, holoGlass, edges, edgeMat],
  );
  const segMats = useMemo(
    () => ({
      head: Array.from({ length: SEGMENTS }, () => new THREE.MeshBasicMaterial({ color: '#000', toneMapped: false })),
      tail: Array.from({ length: SEGMENTS }, () => new THREE.MeshBasicMaterial({ color: '#000', toneMapped: false })),
    }),
    [],
  );
  const screens = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#05080c', emissive: new THREE.Color(car.glow), emissiveIntensity: 0.6, toneMapped: false }),
    [car.glow],
  );
  const hv = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff6a00', emissiveIntensity: 0.6, toneMapped: false }), []);
  useEffect(
    () => () => {
      screens.dispose();
      hv.dispose();
      segMats.head.forEach((m) => m.dispose());
      segMats.tail.forEach((m) => m.dispose());
    },
    [screens, hv, segMats],
  );

  const shadowTex = useMemo(() => shadowTexture(), []);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  /* -------- refs to every moving layer -------- */
  const root = useRef<THREE.Group>(null);
  const suspension = useRef<THREE.Group>(null);
  const halves = useRef<Record<number, THREE.Group | null>>({});
  const glassG = useRef<THREE.Group>(null);
  const cabinG = useRef<THREE.Group>(null);
  const wheelSides = useRef<Record<number, THREE.Group | null>>({});
  const wheelSpin = useRef<THREE.Group[]>([]);
  const steer = useRef<THREE.Group[]>([]);
  const powertrain = useRef<THREE.Group>(null);
  const modules = useRef<THREE.InstancedMesh | null>(null);
  const [labels, setLabels] = useState(false);
  const target = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const hold = useRef({ e: 0 });


  const R = car.dims.wheelRadius;
  const halfW = car.dims.width / 2;
  const wheelZ = halfW - WHEEL_INSET;
  const axles = [car.dims.frontAxle, car.dims.rearAxle];
  const batt = batteryLayout(shape);
  const anchors = cabinAnchors(shape);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const e = stage.explode;
    hold.current.e = e;

    const pGlass = stagger(e, 0, 0.45);
    const pSplit = stagger(e, 0.12, 0.65);
    const pWheels = stagger(e, 0.3, 0.8);
    const pCabin = stagger(e, 0.42, 0.92);
    const pCells = stagger(e, 0.55, 1);

    const show = e > 0.82;
    if (show !== labels) setLabels(show);

    // Suspension: body rolls and pitches on the rig's accelerations, damped out when open.
    const m = stage.motion;
    const sus = suspension.current;
    if (sus) {
      const k = 1 - e;
      sus.rotation.x = m.roll * k;
      sus.rotation.z = m.pitch * k;
      sus.position.y = m.heave * k;
    }

    for (const s of SIDES) {
      const h = halves.current[s];
      if (h) {
        h.position.z = s * pSplit * (halfW + 0.42);
        h.rotation.x = -s * pSplit * 0.12;
      }
      const w = wheelSides.current[s];
      if (w) w.position.z = s * (pSplit * 0.35 + pWheels * 0.55);
    }
    if (glassG.current) {
      glassG.current.position.y = pGlass * 1.15;
      glassG.current.rotation.z = pGlass * 0.06;
    }
    if (cabinG.current) cabinG.current.position.y = pCabin * 0.55;

    // Wheels roll with the car; fronts follow the steer input.
    for (const g of wheelSpin.current) if (g) g.rotation.z = -m.spin;
    for (const g of steer.current) if (g) g.rotation.y = damp(g.rotation.y, m.steer, 6, dt);
    if (glb) {
      glb.wheelPivots.forEach((pv, i) => {
        pv.rotation.order = 'YXZ';
        pv.rotation.z = -m.spin;
        if (i % 2 === 0) pv.rotation.y = damp(pv.rotation.y, m.steer, 6, dt);
      });
    }

    // Paint follows the configurator swatch, and its finish eases in with it.
    const hex = useApp.getState().paint[car.id];
    target.set(hex);
    const f = FINISHES[car.paints.find((p) => p.hex === hex)?.finish ?? 'metallic'];
    const k = 1 - Math.exp(-4 * dt);
    glb?.paint.forEach((p) => easePaint(p, target, f, k));
    setTime(holo, state.clock.elapsedTime);
    setTime(holoGlass, state.clock.elapsedTime);

    // Dynamic light sequence: segments light outward, tail bar sweeps from centre.
    const L = stage.lights;
    const t = state.clock.elapsedTime;
    segMats.head.forEach((mat, i) => {
      const on = Math.min(1, Math.max(0, L * SEGMENTS * 1.4 - i));
      mat.color.setRGB(on * 2.6, on * 2.7, on * 3);
    });
    segMats.tail.forEach((mat, i) => {
      const on = Math.min(1, Math.max(0, L * SEGMENTS * 1.4 - i));
      mat.color.setRGB(on * 3.2, on * 0.12, on * 0.2);
    });

    setEmissive(screens, 0.5 + pCabin * 1.4 + Math.sin(t * 3) * 0.08 * pCabin);
    setEmissive(hv, 0.3 + pCells * 0.9);

    // Battery modules spread into a grid and glow.
    const mod = modules.current;
    if (mod) {
      const mat = mod.material as THREE.MeshStandardMaterial;
      setEmissive(mat, 0.02 + pCells * 0.12);
      const gap = 0.012 + pCells * 0.07;
      let n = 0;
      for (let c = 0; c < BATTERY_COLS; c++) {
        for (let r = 0; r < BATTERY_ROWS; r++) {
          const cx = (c - (BATTERY_COLS - 1) / 2) * (batt.cellX + gap);
          const cz = (r - (BATTERY_ROWS - 1) / 2) * (batt.cellZ + gap);
          // Each module pops up in a ripple from the centre.
          const ripple = Math.max(0, pCells - Math.hypot(c - BATTERY_COLS / 2, r - BATTERY_ROWS / 2) * 0.05);
          dummy.position.set(cx, batt.h / 2 + 0.02 + ripple * 0.08, cz);
          dummy.scale.set(batt.cellX - 0.014, batt.h, batt.cellZ - 0.014);
          dummy.updateMatrix();
          mod.setMatrixAt(n++, dummy.matrix);
        }
      }
      mod.instanceMatrix.needsUpdate = true;
    }
    if (powertrain.current) powertrain.current.position.y = pCells * 0.04;
  });

  // Real models carry their own detail; five well-spaced chips read better than eight.
  const label = (key: PartKey, position: [number, number, number], delay: number, lift?: number) =>
    glb && (key === 'seats' || key === 'cabin' || key === 'drive') ? null : (
    <PartLabel
      key={key}
      position={position}
      title={car.parts[key].title}
      sub={car.parts[key].sub}
      accent={PART_COLORS[key]}
      visible={labels}
      delay={delay}
      lift={lift}
    />
  );

  const yb = shape.bottom(0);

  return (
    <group ref={root}>
      {/* Soft ambient-occlusion shadow under the body… */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={-1}>
        <planeGeometry args={[shape.xMax - shape.xMin + 0.9, car.dims.width + 0.9]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.85} />
      </mesh>
      {/* …and a tight dark contact patch under each tyre, which is what grounds a car. */}
      {axles.flatMap((ax) =>
        SIDES.map((sd) => (
          <mesh key={`${ax}${sd}`} rotation-x={-Math.PI / 2} position={[ax, 0.005, wheelZ * sd]} renderOrder={-1}>
            <planeGeometry args={[R * 2.2, 0.75]} />
            <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.95} />
          </mesh>
        )),
      )}

      <HeadlightBeams shape={shape} />

      {/* ---------- sprung mass ---------- */}
      <group ref={suspension}>
        {SIDES.map((s) => (
          <group key={s} ref={(g) => void (halves.current[s] = g)}>
            {glb ? (
              <primitive object={s === 1 ? glb.pos : glb.neg} />
            ) : (
              <>
                <mesh geometry={geo.body[s]} material={holo} />
                <lineSegments geometry={edges[s]} material={edgeMat} />
                <mesh geometry={geo.grille[s]} material={MAT.piano} />
                {/* Four rings: two per half, so the badge splits with the car. */}
                {[0.045, 0.135].map((z) => {
                  const zz = z * s;
                  const y = shape.top(shape.xMax - 0.05) - 0.12;
                  return (
                    <mesh key={z} material={MAT.chrome} position={[shape.surfaceX(Math.abs(zz) + 0.06, 1) + 0.03, y, zz]} rotation-y={Math.PI / 2}>
                      <torusGeometry args={[0.052, 0.008, 10, 40]} />
                    </mesh>
                  );
                })}
                {geo.head
                  .filter((h) => h.side === s)
                  .map((h) => (
                    <mesh key={`h${h.i}`} geometry={h.g} material={segMats.head[h.i]} />
                  ))}
                {geo.tail
                  .filter((h) => h.side === s)
                  .map((h) => (
                    <mesh key={`t${h.i}`} geometry={h.g} material={segMats.tail[h.i]} />
                  ))}
              </>
            )}
            {s === 1 && label('body', [0.1, shape.top(0.1) + 0.02, halfW * 0.9], 0, 70)}
          </group>
        ))}

        <group ref={glassG}>
          {glb ? (
            <primitive object={glb.glass} />
          ) : (
            <>
              {SIDES.map((s) => (
                <mesh key={s} geometry={geo.glass[s]} material={holoGlass} renderOrder={2} />
              ))}
              <lineSegments geometry={edges.g1} material={edgeMat} />
              <lineSegments geometry={edges.g2} material={edgeMat} />
            </>
          )}
          {label('glass', [(shape.glassMin + shape.glassMax) / 2, shape.roofMax + 0.02, 0], 80, 40)}
        </group>

        <group ref={cabinG}>
          {glb ? <primitive object={glb.cabin} /> : <Cabin car={car} shape={shape} screens={screens} />}
          {label('cockpit', anchors.cockpit, 160, 60)}
          {label('seats', anchors.seats, 220, 50)}
          {label('cabin', anchors.cabin, 200, 30)}
        </group>
      </group>

      {/* ---------- unsprung: wheels ---------- */}
      {SIDES.map((s) => (
        <group key={s} ref={(g) => void (wheelSides.current[s] = g)}>
          {glb ? (
            <primitive object={s === 1 ? glb.wheelsPos : glb.wheelsNeg} />
          ) : (
            axles.map((ax, i) => (
              <group key={ax} position={[ax, R, wheelZ * s]} ref={(g) => void (i === 0 && g && (steer.current[s === 1 ? 0 : 1] = g))}>
                <Wheel R={R} side={s} spin={(g) => void (g && (wheelSpin.current[(s === 1 ? 0 : 2) + i] = g))} />
              </group>
            ))
          )}
          {s === 1 && label('wheels', [car.dims.frontAxle, R * 2 + 0.05, wheelZ + 0.1], 120, 40)}
        </group>
      ))}

      {/* ---------- powertrain: stays on the floor, the reveal ---------- */}
      <group ref={powertrain}>
        {car.powertrain === 'ev' ? (
          <>
            <Battery shape={shape} modules={(m) => void (modules.current = m)} />
            <EMotor x={car.dims.frontAxle} y={R} track={(wheelZ - 0.1) * 2} hv={hv} />
            <EMotor x={car.dims.rearAxle} y={R} track={(wheelZ - 0.1) * 2} hv={hv} />
            {label('energy', [0, yb + 0.2, 0], 300, 30)}
            {label('drive', [car.dims.rearAxle, R + 0.2, 0], 260, 40)}
          </>
        ) : car.powertrain === 'front' ? (
          <>
            {!glb && <Engine x={car.dims.frontAxle - 0.08} y={R + 0.12} cylinders={car.cylinders ?? 6} shaftTo={car.dims.rearAxle} heat={hv} />}
            {label('energy', [car.dims.frontAxle - 0.08, R + 0.5, 0], 300, 30)}
            {label('drive', [(car.dims.frontAxle + car.dims.rearAxle) / 2, R + 0.05, 0], 260, 40)}
          </>
        ) : (
          <>
            {!glb && <Engine x={car.dims.rearAxle + 0.62} y={R + 0.12} cylinders={car.cylinders ?? 10} shaftTo={car.dims.frontAxle} heat={hv} />}
            {label('energy', [car.dims.rearAxle + 0.62, R + 0.5, 0], 300, 30)}
            {label('drive', [car.dims.frontAxle - 0.4, R + 0.05, 0], 260, 40)}
          </>
        )}
      </group>
    </group>
  );
}
