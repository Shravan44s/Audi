'use client';

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { CARS } from '@/data/cars';
import { useApp } from '@/lib/store';
import { stage, welcomeLights } from '@/lib/stage';
import { clamp, damp } from '@/lib/utils';
import { GlbCar, PrecutCars } from './CarModel';
import { ExplodableCar } from './ExplodableCar';
import { scanUniforms } from './materialize';

/** Rolling-road speed at roll = 1, m/s (~110 km/h). */
const ROAD_SPEED = 30;
/**
 * Wheel spin limits. True rolling speed at 110 km/h is ~80 rad/s, over a radian per
 * frame: spoked rims then strobe (wagon-wheel effect) and seem to slide sideways or
 * backwards. The rate cap keeps it calm at 60 fps; the per-frame cap keeps each step
 * well under half a spoke gap (~0.6 rad on a 5-spoke rim) when the frame rate drops.
 */
const MAX_SPIN = 14;
const MAX_SPIN_STEP = 0.22;

/** Falls back to the hologram car if a GLB fails to parse. */
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The parked car and everything that happens to it: model swaps (drive off, next car
 * drives in and brakes onto its mark, welcome lights), the rolling road, and chassis
 * dynamics (squat, dive, road buzz) derived from what the car is actually doing.
 * The camera is handled separately in Stage.
 */
export function CarRig() {
  const body = useRef<THREE.Group>(null);
  const [shown, setShown] = useState(() => useApp.getState().car);
  const car = CARS[shown];
  const live = useRef({ prevV: 0, acc: 0, prevDrive: 0 });

  useEffect(() => {
    let tl: gsap.core.Timeline | null = null;
    const unsub = useApp.subscribe((s, p) => {
      if (s.car === p.car) return;
      tl?.kill();
      tl = gsap
        .timeline()
        .to(stage, { lights: 0, duration: 0.3, ease: 'power1.in' })
        // Pull away: gentle launch, accelerating out of frame.
        .to(stage, { drive: 18, duration: 1.3, ease: 'power2.in' }, 0.15)
        .add(() => setShown(useApp.getState().car))
        .set(stage, { drive: -18 })
        // Roll in and brake onto the mark — the deceleration dips the nose.
        .to(stage, { drive: 0, duration: 2.1, ease: 'power3.out' });
      welcomeLights(tl, '-=0.5');
    });
    return () => {
      unsub();
      tl?.kill();
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const l = live.current;
    const t = state.clock.elapsedTime;

    // Intro: the car rolls the last few metres onto its mark.
    const drive = stage.drive + (1 - stage.intro) * -6;
    body.current!.position.x = drive;

    // Longitudinal speed: rolling road + the car's own drive.
    const driveV = (drive - l.prevDrive) / Math.max(dt, 1e-4);
    l.prevDrive = drive;
    const roadV = stage.roll * ROAD_SPEED;
    stage.road += roadV * dt;
    const v = driveV + roadV;
    l.acc = damp(l.acc, clamp((v - l.prevV) / Math.max(dt, 1e-4), -30, 30), 5, dt);
    l.prevV = v;

    const m = stage.motion;
    // Squat under power, dive under braking; at speed the body sits low and hums over the road.
    const hum = stage.roll * (Math.sin(t * 37) * 0.0012 + Math.sin(t * 13.1) * 0.0018);
    m.pitch = damp(m.pitch, clamp(l.acc * 0.0018, -0.035, 0.035), 5, dt);
    m.heave = damp(m.heave, -stage.roll * 0.012 + Math.sin(t * 1.3) * 0.002, 3, dt) + hum;
    m.roll = damp(m.roll, Math.sin(t * 0.8) * 0.003 * stage.roll, 3, dt);
    m.spin += clamp(clamp(v / car.dims.wheelRadius, -MAX_SPIN, MAX_SPIN) * dt, -MAX_SPIN_STEP, MAX_SPIN_STEP);
    // The car only ever runs straight, so the front wheels stay straight too.
    m.steer = 0;

    // The hologram stand-in's scan plane follows the car (fully built unless a tween runs).
    body.current!.getWorldPosition(scanUniforms.uScanOrigin.value);
    scanUniforms.uScan.value = stage.scan;
    scanUniforms.uScanColor.value.set(car.glow);
  });

  const holo = <ExplodableCar key={car.id} car={car} />;

  return (
    <group>
      <group ref={body}>
        <Fallback key={car.id} fallback={holo}>
          <Suspense fallback={holo}>
            <GlbCar car={car} />
          </Suspense>
        </Fallback>
      </group>
      <Suspense fallback={null}>
        <PrecutCars cars={CARS} />
      </Suspense>
    </group>
  );
}
