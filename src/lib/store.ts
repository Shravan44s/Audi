import { create } from 'zustand';
import { CARS } from '@/data/cars';
import type { Tier } from './tier';

type AppState = {
  /** Canvas has rendered its first frames; loader may leave. */
  sceneReady: boolean;
  /** Loader has finished its exit; hero intro may play. */
  introDone: boolean;
  tier: Tier | null;
  /** Index into CARS of the car on stage. */
  car: number;
  /** Showroom "look inside": the car splits open into its labelled parts. */
  exploded: boolean;
  /** Chosen paint per car id (hex). */
  paint: Record<string, string>;
  /** Car ids that have a real GLB in public/models. */
  glb: Record<string, boolean>;
  /** The first real model has streamed in and been cut into layers. */
  modelReady: boolean;
  /** False while an opaque section fully covers the viewport, so the canvas can stop rendering. */
  sceneVisible: boolean;
  setSceneReady: () => void;
  setIntroDone: () => void;
  setTier: (tier: Tier) => void;
  setCar: (car: number) => void;
  setExploded: (exploded: boolean) => void;
  setPaint: (id: string, hex: string) => void;
  setGlb: (id: string, ok: boolean) => void;
  setModelReady: () => void;
  setSceneVisible: (visible: boolean) => void;
};

export const useApp = create<AppState>((set) => ({
  sceneReady: false,
  introDone: false,
  tier: null,
  car: 0,
  exploded: false,
  paint: Object.fromEntries(CARS.map((c) => [c.id, c.paints[0].hex])),
  // Real models ship in public/models; CarRig's HEAD check flips any missing one back to the hologram.
  glb: Object.fromEntries(CARS.map((c) => [c.id, true])),
  modelReady: false,
  sceneVisible: true,
  setSceneReady: () => set({ sceneReady: true }),
  setIntroDone: () => set({ introDone: true }),
  setTier: (tier) => set({ tier }),
  setCar: (car) => set({ car }),
  setExploded: (exploded) => set({ exploded }),
  setPaint: (id, hex) => set((s) => ({ paint: { ...s.paint, [id]: hex } })),
  setGlb: (id, ok) => set((s) => ({ glb: { ...s.glb, [id]: ok } })),
  setModelReady: () => set({ modelReady: true }),
  setSceneVisible: (sceneVisible) => set({ sceneVisible }),
}));
