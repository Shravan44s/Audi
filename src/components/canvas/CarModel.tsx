'use client';

import { useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Car } from '@/data/cars';
import { ExplodableCar } from './ExplodableCar';
import { cutCar, type GlbLayers } from './cutCar';

export type { GlbLayers };

/** Cut layers per car, computed once (during the loader) and reused on every swap. */
const cuts = new Map<string, GlbLayers>();
function layersFor(car: Car, scene: THREE.Object3D) {
  let l = cuts.get(car.id);
  if (!l) {
    l = cutCar(car, scene);
    cuts.set(car.id, l);
  }
  return l;
}

/** Loads and renders a real model; suspends while the file streams in. */
export function GlbCar({ car }: { car: Car }) {
  const { scene } = useGLTF(car.model, true, true);
  const layers = useMemo(() => layersFor(car, scene), [car, scene]);
  return <ExplodableCar car={car} glb={layers} />;
}

/**
 * Downloads and cuts every car while the loader is still up, then flags the scene
 * ready, so nothing heavy ever runs mid-animation.
 */
export function PrecutCars({ cars }: { cars: Car[] }) {
  const gltfs = useGLTF(
    cars.map((c) => c.model),
    true,
    true,
  );
  useMemo(() => cars.forEach((c, i) => layersFor(c, gltfs[i].scene)), [cars, gltfs]);
  useEffect(() => useApp.getState().setModelReady(), []);
  return null;
}

