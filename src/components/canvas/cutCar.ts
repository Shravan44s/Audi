import * as THREE from 'three';
import type { Car } from '@/data/cars';
import { makeShape } from './carGeometry';

/** A real model cut into the explode layers ExplodableCar animates. */
export type GlbLayers = {
  pos: THREE.Group;
  neg: THREE.Group;
  glass: THREE.Group;
  cabin: THREE.Group;
  wheelsPos: THREE.Group;
  wheelsNeg: THREE.Group;
  /** One pivot per wheel at its hub, for rolling. Order: pos-front, pos-rear, neg-front, neg-rear. */
  wheelPivots: THREE.Group[];
  /** Car-paint materials, recoloured by the configurator. */
  paint: THREE.MeshPhysicalMaterial[];
};

type Bucket = 'pos' | 'neg' | 'cabin' | 'w0' | 'w1' | 'w2' | 'w3';
const BUCKETS: Bucket[] = ['pos', 'neg', 'cabin', 'w0', 'w1', 'w2', 'w3'];

/** A sub-mesh that shares the source attributes but draws only some triangles. */
function subMesh(src: THREE.Mesh, index: number[], m: THREE.Matrix4): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(src.geometry.attributes)) g.setAttribute(name, attr);
  g.setIndex(index);
  // Bounds must cover only *these* triangles: the shared position buffer spans the
  // whole source mesh (e.g. all four tyres), which would put every wheel hub — and
  // so every wheel's spin axis — in the middle of the car.
  const pos = src.geometry.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3();
  for (const i of index) box.expandByPoint(v.fromBufferAttribute(pos, i));
  g.boundingBox = box;
  g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  const out = new THREE.Mesh(g, src.material);
  m.decompose(out.position, out.quaternion, out.scale);
  out.castShadow = true;
  return out;
}

/** Panel edges sharper than this keep a hard normal; anything softer is smoothed across. */
const CREASE = Math.cos(Math.PI / 3);

/**
 * Rebuilds normals in full float precision. The models ship with KHR_mesh_quantization,
 * which stores normals as 8-bit values: on a mirror clearcoat those few steps read as
 * dents and ripples all over the panels. Faces are welded by position (UV seams no
 * longer break the shading) and averaged area-weighted, except across a real crease.
 */
function smoothNormals(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = src.index ? src.toNonIndexed() : src.clone();
  const pos = g.attributes.position;
  const orig = g.attributes.normal;
  const n = pos.count;
  const faces = n / 3;
  const fn = new Float64Array(faces * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let f = 0; f < faces; f++) {
    a.fromBufferAttribute(pos, f * 3);
    b.fromBufferAttribute(pos, f * 3 + 1);
    c.fromBufferAttribute(pos, f * 3 + 2);
    // Unnormalised cross product: its length is twice the area, so big faces weigh more.
    c.sub(b).cross(a.sub(b));
    // Keep the side the file's own (coarse) normals face, whatever the winding.
    if (orig) {
      a.fromBufferAttribute(orig, f * 3).add(b.fromBufferAttribute(orig, f * 3 + 1)).add(b.fromBufferAttribute(orig, f * 3 + 2));
      if (a.dot(c) < 0) c.negate();
    }
    fn[f * 3] = c.x;
    fn[f * 3 + 1] = c.y;
    fn[f * 3 + 2] = c.z;
  }

  const key = (i: number) => `${Math.round(pos.getX(i) * 1e5)},${Math.round(pos.getY(i) * 1e5)},${Math.round(pos.getZ(i) * 1e5)}`;
  const shared = new Map<string, number[]>();
  const keys: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const k = (keys[i] = key(i));
    const list = shared.get(k);
    if (list) list.push((i / 3) | 0);
    else shared.set(k, [(i / 3) | 0]);
  }

  const out = new Float32Array(n * 3);
  const unit = (f: number) => {
    const l = Math.hypot(fn[f * 3], fn[f * 3 + 1], fn[f * 3 + 2]) || 1;
    return [fn[f * 3] / l, fn[f * 3 + 1] / l, fn[f * 3 + 2] / l];
  };
  for (let i = 0; i < n; i++) {
    const self = (i / 3) | 0;
    const own = unit(self);
    let x = 0;
    let y = 0;
    let z = 0;
    for (const f of shared.get(keys[i])!) {
      const u = unit(f);
      if (f !== self && u[0] * own[0] + u[1] * own[1] + u[2] * own[2] < CREASE) continue;
      x += fn[f * 3];
      y += fn[f * 3 + 1];
      z += fn[f * 3 + 2];
    }
    const l = Math.hypot(x, y, z);
    // Sliver triangles in the shut lines have no area and so no direction: a zero normal
    // renders black. Those keep the file's own normal.
    if (l < 1e-12) {
      if (orig) a.fromBufferAttribute(orig, i).normalize();
      else a.set(0, 1, 0);
      out[i * 3] = a.x;
      out[i * 3 + 1] = a.y;
      out[i * 3 + 2] = a.z;
      continue;
    }
    out[i * 3] = x / l;
    out[i * 3 + 1] = y / l;
    out[i * 3 + 2] = z / l;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}

/**
 * How far a wheel is steered away from straight ahead, rad about y. A tyre's plan-view
 * footprint is long along the rolling direction, so the principal axis of its vertices
 * in the x/z plane points where the wheel rolls.
 */
function steerAngle(parts: { mesh: THREE.Mesh }[]): number {
  const v = new THREE.Vector3();
  let n = 0;
  let sx = 0;
  let sz = 0;
  let xx = 0;
  let zz = 0;
  let xz = 0;
  for (const { mesh } of parts) {
    mesh.updateMatrixWorld(true);
    const pos = mesh.geometry.attributes.position;
    for (const i of new Set(mesh.geometry.index!.array)) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      n++;
      sx += v.x;
      sz += v.z;
      xx += v.x * v.x;
      zz += v.z * v.z;
      xz += v.x * v.z;
    }
  }
  if (n < 3) return 0;
  const mx = sx / n;
  const mz = sz / n;
  const a = 0.5 * Math.atan2(2 * (xz / n - mx * mz), xx / n - mx * mx - (zz / n - mz * mz));
  // Under ~1° is modelling noise, not steer.
  return Math.abs(a) < 0.02 ? 0 : a;
}

/**
 * Normalises a downloaded car to the studio frame (nose → +x, tyres on y = 0, true
 * length) and then *cuts it*: every triangle is sorted by where it sits.
 *  - glass materials lift away whole;
 *  - wheel materials near an axle go to that corner's wheel (calipers stay fixed);
 *  - anything inside the cabin volume (seats, dash, wheel, console) rises as the cabin;
 *  - everything else is split exactly on the centreline into left and right shells,
 *    so the real car opens lengthwise like the factory-twin cigarette.
 */
export function cutCar(car: Car, scene: THREE.Object3D): GlbLayers {
  const root = scene.clone(true);
  const shape = makeShape(car);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  // Turn the long axis onto x (+z → +x); car.yaw fixes models authored facing the other way.
  if (size.z > size.x) root.rotation.y = Math.PI / 2;
  root.rotation.y += car.yaw ?? 0;
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  box.getSize(size);
  root.scale.multiplyScalar((shape.xMax - shape.xMin) / size.x);
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  // Ground = bottom of the tyres. The overall box can be thrown off by stray parts
  // (the A5 ships a plate mesh that dips 15 cm below the wheels).
  const tyres = new THREE.Box3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    const mat = m.isMesh ? (Array.isArray(m.material) ? m.material[0] : m.material) : null;
    if (mat && car.match.tire.test(mat.name)) tyres.expandByObject(m);
  });
  const ground = tyres.isEmpty() ? box.min.y : tyres.min.y;
  root.position.add(new THREE.Vector3(-c.x, -ground, -c.z));
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  const halfW = (box.max.z - box.min.z) / 2;

  const { match, dims } = car;
  const R = dims.wheelRadius;
  const axles = [dims.frontAxle, dims.rearAxle];
  const cabin = {
    x0: shape.glassMin + 0.05,
    x1: shape.glassMax + 0.08,
    z: dims.cabinWidth / 2 - 0.12,
    y0: 0.22,
    y1: shape.roofMax - 0.05,
  };

  const layers: GlbLayers = {
    pos: new THREE.Group(),
    neg: new THREE.Group(),
    glass: new THREE.Group(),
    cabin: new THREE.Group(),
    wheelsPos: new THREE.Group(),
    wheelsNeg: new THREE.Group(),
    wheelPivots: [],
    paint: [],
  };

  // ---- Materials: clearcoat paint the configurator can recolour, believable glass ----
  const upgraded = new Map<THREE.Material, THREE.Material>();
  const upgrade = (m: THREE.Material): THREE.Material => {
    if (upgraded.has(m)) return upgraded.get(m)!;
    let out = m;
    const std = m as THREE.MeshStandardMaterial;
    if (match.paint.test(m.name) && std.isMeshStandardMaterial) {
      const p = new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(p, std);
      // Metallic base under a glossy clearcoat, just soft enough to hide the low-poly panels: the flake gives depth, the coat gives the long, crisp reflections.
      p.clearcoat = 1;
      p.clearcoatRoughness = 0.07;
      p.metalness = 0.55;
      p.roughness = 0.32;
      p.map = null;
      p.envMapIntensity = 2.2;
      // Never exactly 0, so the iridescence branch is compiled once and pearl paints don't hitch on a swap.
      p.iridescence = 0.001;
      p.iridescenceIOR = 1.5;
      p.iridescenceThicknessRange = [260, 520];
      layers.paint.push(p);
      out = p;
    } else if (match.glass.test(m.name) && std.isMeshStandardMaterial) {
      // Dark privacy tint that still mirrors the softboxes.
      const g = std.clone();
      g.transparent = true;
      g.opacity = 0.6;
      g.color.set('#05070a');
      g.depthWrite = false;
      g.roughness = 0;
      g.metalness = 0.85;
      g.side = THREE.DoubleSide;
      g.envMapIntensity = 2.6;
      out = g;
    } else if (match.tire.test(m.name) && std.isMeshStandardMaterial) {
      // Tyres read as soft black rubber, never shiny plastic.
      const t = std.clone();
      t.color.set('#121213');
      t.metalness = 0;
      t.roughness = 0.92;
      t.envMapIntensity = 0.35;
      out = t;
    } else if (std.isMeshStandardMaterial) {
      // Everything metallic (rims, chrome, trims) gets polished; models often ship it dull.
      const s = std.clone();
      if (!match.caliper?.test(m.name) && (s.metalness > 0.5 || match.wheel.test(m.name))) {
        s.metalness = Math.max(s.metalness, 0.9);
        s.roughness = Math.min(s.roughness, 0.22);
      }
      s.envMapIntensity = 1.6;
      out = s;
    }
    upgraded.set(m, out);
    return out;
  };

  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  const wheelParts: { mesh: THREE.Mesh; spins: boolean; tire: boolean; k: number }[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();

  const smoothed = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  for (const mesh of meshes) {
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const name = mat?.name ?? '';
    // Paint and glass are mirrors: they get clean normals before they are cut.
    if (match.paint.test(name) || match.glass.test(name)) {
      let g = smoothed.get(mesh.geometry);
      if (!g) smoothed.set(mesh.geometry, (g = smoothNormals(mesh.geometry)));
      mesh.geometry = g;
    }
    mesh.material = upgrade(mat);
    const mw = mesh.matrixWorld;

    if (match.glass.test(name)) {
      layers.glass.attach(mesh);
      continue;
    }

    const isWheel = match.wheel.test(name);
    const isCaliper = !!match.caliper?.test(name);
    const isPaint = match.paint.test(name);
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    const triCount = idx ? idx.count / 3 : pos.count / 3;
    const out: Record<Bucket, number[]> = { pos: [], neg: [], cabin: [], w0: [], w1: [], w2: [], w3: [] };

    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1);
      d.fromBufferAttribute(pos, i2);
      a.add(b).add(d).multiplyScalar(1 / 3).applyMatrix4(mw);

      let bucket: Bucket;
      // Wheel triangles must sit inside the wheel's disc (side view), so exhaust tips or
      // arch liners sharing a wheel material never end up spinning.
      const nearAxle = axles.findIndex((ax) => Math.hypot(a.x - ax, a.y - R) < R * 1.25);
      if (isWheel && nearAxle >= 0 && Math.abs(a.z) > halfW * 0.35) {
        bucket = `w${(a.z >= 0 ? 0 : 2) + nearAxle}` as Bucket;
      } else if (
        !isPaint &&
        a.x > cabin.x0 &&
        a.x < cabin.x1 &&
        Math.abs(a.z) < cabin.z &&
        a.y > cabin.y0 &&
        a.y < cabin.y1
      ) {
        bucket = 'cabin';
      } else {
        bucket = a.z >= 0 ? 'pos' : 'neg';
      }
      out[bucket].push(i0, i1, i2);
    }

    for (const key of BUCKETS) {
      if (!out[key].length) continue;
      const m = subMesh(mesh, out[key], mw);
      if (key === 'pos' || key === 'neg' || key === 'cabin') layers[key].add(m);
      else wheelParts.push({ mesh: m, spins: !isCaliper, tire: match.tire.test(name), k: Number(key[1]) });
    }
  }

  // ---- Wheels: a pivot at each hub so the real wheel rolls about its own axle ----
  for (let k = 0; k < 4; k++) {
    const group = k < 2 ? layers.wheelsPos : layers.wheelsNeg;
    const parts = wheelParts.filter((p) => p.k === k);
    const pivot = new THREE.Group();
    const hub = new THREE.Box3();
    // The tyre is round and centred on the axle, so its bounds give the true hub.
    const ref = parts.some((p) => p.tire) ? parts.filter((p) => p.tire) : parts.filter((p) => p.spins);
    (ref.length ? ref : parts).forEach((p) => hub.expandByObject(p.mesh));
    if (!hub.isEmpty()) hub.getCenter(pivot.position);
    group.add(pivot);
    pivot.updateMatrixWorld(true);
    // Some models ship with the fronts steered (the e-tron's by ~28°). Spun about the
    // car's axle, a steered wheel wobbles diagonally, so straighten it about its hub first.
    const toe = steerAngle(ref.length ? ref : parts);
    const spinning = new THREE.Group();
    const fixed = new THREE.Group();
    fixed.position.copy(pivot.position);
    pivot.add(spinning);
    group.add(fixed);
    fixed.updateMatrixWorld(true);
    for (const p of parts) (p.spins ? spinning : fixed).attach(p.mesh);
    spinning.rotation.y = toe;
    fixed.rotation.y = toe;
    layers.wheelPivots.push(pivot);
  }

  return layers;
}

