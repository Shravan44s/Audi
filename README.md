# Audi — Vorsprung (concept)

A cinematic, scroll-driven 3D showroom. The cars stay parked in a studio of light and the camera moves around them like a car commercial. Click a car and it splits open to show its interior, the same way the factory-twin cigarette explorer does. The site also covers Audi Sport, the group brands and services.

```bash
npm run dev       # http://localhost:3000
npm run build
```

## The cars

These are real, detailed 3D replicas (CC BY 4.0, credited in the footer and in `public/models/LICENSE-*.txt`):

| Car | Model | Author |
| --- | --- | --- |
| RS e-tron GT | Audi e-Tron GT – made with Blender | gbarzu |
| R8 V10 performance | 2021 Audi R8 V10 Performance Quattro | supercarmodels |
| A5 Sportback S line | Audi A5 Sportback S Line – 2021 | Unn Interativa |
| S5 Coupé | 2017 Audi S5 | supercarmodels |

Each one was packed into a single GLB, stripped of studio ground planes, and compressed (meshopt geometry, 1024 px WebP textures) to 1–6 MB. The e-tron came exported tilted (about 7° of roll), so it was levelled from its four hub centres. In the browser, `CarModel.cutCar` slices every triangle into layers: the body splits exactly on the centreline, cabin parts are found by volume, and each wheel gets its own hub pivot (centred on the tyre) so it can roll. The per-car material map lives in `CARS[].match` in `src/data/cars.ts`.

## How it fits together

- `src/lib/stage.ts`: camera shots (`KEYS`) pinned to section ids, plus the shared per-frame `stage` object (explode, rolling road, scan, lights, drag).
- `src/components/canvas/Stage.tsx` (`CameraRig`): a spring-driven orbit camera with auto-orbit, drag-to-orbit, pointer parallax and hand-held drift.
- `src/components/canvas/CarRig.tsx`: the parked car. It handles model swaps (lights off → drive out → scan-in → lights on), the rolling road, and chassis dynamics (squat, dive, road buzz).
- `src/components/canvas/Studio.tsx`: the mirror floor, streaming grid, light-gate tunnel and speed streaks.
- `src/components/canvas/materialize.ts`: the scan-line "print" shader patched onto every car material, plus the hologram material.
- `src/components/canvas/ExplodableCar.tsx` / `CarModel.tsx`: the split-open view. Real GLB meshes are sorted into layers by mesh and material name, paint is upgraded to recolourable clearcoat, and each wheel rolls on its own pivot.

## Credits

3D models: CC BY 4.0 authors on Sketchfab. Photos: Wikimedia Commons, CC licences. All are listed in the site footer. This is a concept site, not affiliated with AUDI AG. Specs and prices are indicative.
