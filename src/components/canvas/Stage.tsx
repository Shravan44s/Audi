'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '@/lib/store';
import { resolveKeys, shotAt, stage } from '@/lib/stage';
import { TIER_DPR, detectTier, downgrade } from '@/lib/tier';
import { clamp, damp, spring, type Spring } from '@/lib/utils';
import { CarRig } from './CarRig';
import { BEAM_LAYER } from './HeadlightBeams';
import { Effects } from './Effects';
import { Lights } from './Lights';
import { Studio } from './Studio';

const TAU = Math.PI * 2;
const wrap = (a: number) => a - TAU * Math.round(a / TAU);

/** Flags the scene ready after a few real frames, so the loader never reveals a blank canvas. */
function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current++ === 4) useApp.getState().setSceneReady();
  });
  return null;
}

/**
 * Cinematic camera. Scroll picks a shot (lib/stage.ts); critically damped springs
 * carry the camera between shots — it glides and settles without wobble, like a
 * motion-control rig. On top:
 * a slow auto-orbit, showroom drag-to-orbit, pointer parallax and a faint hand-held drift.
 */
function CameraRig() {
  const size = useThree((s) => s.size);
  const portrait = size.width < 768 || size.width / size.height < 0.9;
  const sp = useRef<Record<'az' | 'el' | 'dist' | 'shift' | 'lift' | 'fov', Spring>>({
    az: { x: 0.62, v: 0 },
    el: { x: 0.07, v: 0 },
    dist: { x: 8.6, v: 0 },
    shift: { x: 0, v: 0 },
    lift: { x: 0.75, v: 0 },
    fov: { x: 30, v: 0 },
  });
  const live = useRef({ orbit: 0, explode: 0, roll: 0, px: 0, py: 0 });
  const v = useMemo(() => ({ off: new THREE.Vector3(), target: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), []);

  // Key positions depend on layout: recompute on resize and once fonts settle.
  useEffect(() => {
    resolveKeys();
    const onRefresh = () => resolveKeys();
    window.addEventListener('audi:layout', onRefresh);
    document.fonts?.ready.then(onRefresh);
    return () => window.removeEventListener('audi:layout', onRefresh);
  }, [size.width, size.height]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const shot = shotAt(window.scrollY, portrait);
    const s = sp.current;
    const l = live.current;
    const { exploded } = useApp.getState();

    // Explode + road state the car reads.
    l.explode = damp(l.explode, Math.max(shot.explode, exploded ? 1 : 0), 2.2, dt);
    stage.explode = l.explode;
    l.roll = damp(l.roll, shot.roll, 1.6, dt);
    stage.roll = l.roll;

    // Auto-orbit; when the car opens, swing round to a fixed presentation angle instead.
    const openFromShowroom = exploded ? l.explode : 0;
    if (shot.spin > 0.001 && !exploded && !stage.drag.active) l.orbit += shot.spin * dt;
    else if (exploded) l.orbit = damp(l.orbit, l.orbit + wrap(0.0 - (shot.az + l.orbit + stage.drag.az) + 0.8), 2, dt);
    else l.orbit = damp(l.orbit, l.orbit + wrap(-l.orbit), 0.6, dt);
    if (!stage.drag.active) stage.drag.el = damp(stage.drag.el, 0, 2.5, dt);

    const K = 22;
    spring(s.az, shot.az + l.orbit + stage.drag.az, K, 1, dt);
    spring(s.el, clamp(shot.el + stage.drag.el + openFromShowroom * 0.42, -0.02, 1.45), K, 1, dt);
    spring(s.dist, shot.dist + openFromShowroom * 2 - (stage.hover && !exploded ? 0.4 : 0), K, 1, dt);
    spring(s.shift, shot.shift, K, 1, dt);
    spring(s.lift, shot.lift, K, 1, dt);
    spring(s.fov, shot.fov + l.roll * 6, K * 0.6, 1, dt);

    // Hand-held drift + pointer parallax.
    const t = state.clock.elapsedTime;
    // Pointer parallax is eased too, so mouse moves never jolt the frame.
    l.px = damp(l.px, stage.pointer.x, 2, dt);
    l.py = damp(l.py, stage.pointer.y, 2, dt);
    const az = s.az.x + l.px * 0.035 + Math.sin(t * 0.23) * 0.004;
    const el = Math.max(0.015, s.el.x + l.py * 0.018 + Math.sin(t * 0.31) * 0.003);
    const d = s.dist.x;

    v.off.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d);
    v.right.copy(v.off).negate().cross(v.up).normalize();
    v.target.set(0, s.lift.x, 0).addScaledVector(v.right, s.shift.x);
    // Road buzz reaches the camera a little when the car is "moving".
    const shake = l.roll * 0.006;
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.copy(v.target).add(v.off);
    cam.position.y += Math.sin(t * 23) * shake;
    cam.lookAt(v.target);
    if (Math.abs(cam.fov - s.fov.x) > 0.01) {
      cam.fov = s.fov.x;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

export default function Stage() {
  const tier = useApp((s) => s.tier);
  const setTier = useApp((s) => s.setTier);
  const visible = useApp((s) => s.sceneVisible);

  useEffect(() => {
    if (!useApp.getState().tier) setTier(detectTier());
  }, [setTier]);

  if (!tier) return null;

  return (
    <Canvas
      dpr={TIER_DPR[tier]}
      frameloop={visible ? 'always' : 'never'}
      camera={{ position: [5, 0.8, 7], fov: 30, near: 0.1, far: 120 }}
      onCreated={({ camera }) => camera.layers.enable(BEAM_LAYER)}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      aria-hidden
    >
      <PerformanceMonitor flipflops={2} onDecline={() => tier !== 'low' && setTier(downgrade(tier))} />
      <Lights />
      <CameraRig />
      <Suspense fallback={null}>
        <Studio tier={tier} />
        <CarRig />
        <Effects tier={tier} />
        <ReadySignal />
      </Suspense>
    </Canvas>
  );
}
