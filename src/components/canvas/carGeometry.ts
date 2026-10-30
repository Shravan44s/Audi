import * as THREE from 'three';
import type { Car } from '@/data/cars';

/**
 * Procedural car bodies. Each body is lofted from cross-sections along the car's
 * length (x), which keeps the surfaces smooth enough for clearcoat reflections and
 * lets the shell be built as two open halves — the seam at z = 0 is what the
 * explode view pulls apart, like the cigarette's lengthwise split in factory-twin.
 */

const STATIONS = 140;
/** How far the wheel sits in from the body side, and how deep the arch well is. */
export const WHEEL_INSET = 0.17;
const WELL = 0.4;
const SHOULDER = 0.11;

export type Shape = {
  car: Car;
  xMin: number;
  xMax: number;
  /** Body top height at x. */
  top: (x: number) => number;
  /** Body underside at x. */
  bottom: (x: number) => number;
  /** Half width of the body at x (plan view). */
  half: (x: number) => number;
  /** Glasshouse top at x (NaN outside the glass). */
  glassTop: (x: number) => number;
  glassMin: number;
  glassMax: number;
  /** Nose (+1) or tail (−1) surface x for a given |z| in the flank band. */
  surfaceX: (zAbs: number, end: 1 | -1) => number;
  roofMax: number;
};

/** Sample a Catmull-Rom curve through pts densely and expose y(x) by interpolation. */
function sampler(pts: [number, number][]) {
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const s = curve.getPoints(400).sort((a, b) => a.x - b.x);
  return (x: number) => {
    if (x <= s[0].x) return s[0].y;
    if (x >= s[s.length - 1].x) return s[s.length - 1].y;
    let lo = 0;
    let hi = s.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s[mid].x <= x) lo = mid;
      else hi = mid;
    }
    const t = (x - s[lo].x) / (s[hi].x - s[lo].x || 1);
    return s[lo].y + (s[hi].y - s[lo].y) * t;
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function makeShape(car: Car): Shape {
  const pts = car.body;
  // Drop the two bottom points: what remains is the top line, monotonic in x.
  const topPts = pts.slice(1, -1);
  const top = sampler(topPts);
  const xMax = Math.max(...topPts.map((p) => p[0]));
  const xMin = Math.min(...topPts.map((p) => p[0]));
  const yb = pts[0][1];
  const xc = (xMax + xMin) / 2;
  const halfL = (xMax - xMin) / 2;
  const W = car.dims.width / 2;
  const { frontAxle, rearAxle } = car.dims;

  const half = (x: number) => {
    const t = Math.min(1, Math.abs((x - xc) / halfL));
    // Superellipse plan form: flat flanks that round off over the last ~10 % of length.
    const plan = Math.pow(1 - Math.pow(t, 3.2), 1 / 3.2);
    // quattro blisters over each axle.
    const blister = 1 + 0.03 * (Math.exp(-(((x - frontAxle) / 0.55) ** 2)) + Math.exp(-(((x - rearAxle) / 0.55) ** 2)));
    return Math.max(0.0001, W * plan * blister) * (1 / 1.03);
  };

  const bottom = (x: number) => {
    const t = Math.abs((x - xc) / halfL);
    return yb + 0.1 * smooth(0.82, 1, t);
  };

  const glassTop = sampler(car.glass);
  const glassMax = Math.max(...car.glass.map((p) => p[0]));
  const glassMin = Math.min(...car.glass.map((p) => p[0]));
  const roofMax = Math.max(...car.glass.map((p) => p[1]));

  const surfaceX = (zAbs: number, end: 1 | -1) => {
    // half() is monotonic from the centre outwards: bisect for half(x) = zAbs.
    let a = xc;
    let b = end === 1 ? xMax : xMin;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (half(m) > zAbs) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };

  return {
    car,
    xMin,
    xMax,
    top,
    bottom,
    half,
    glassTop: (x) => (x < glassMin || x > glassMax ? NaN : glassTop(x)),
    glassMin,
    glassMax,
    surfaceX,
    roofMax,
  };
}

/** Builds an indexed grid from rings of equal length and smooths its normals. */
function loft(rings: THREE.Vector3[][], flip: boolean): THREE.BufferGeometry {
  const m = rings[0].length;
  const pos = new Float32Array(rings.length * m * 3);
  rings.forEach((ring, i) => ring.forEach((p, j) => p.toArray(pos, (i * m + j) * 3)));
  const index: number[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < m - 1; j++) {
      const a = i * m + j;
      const b = (i + 1) * m + j;
      if (flip) index.push(a, a + 1, b, b, a + 1, b + 1);
      else index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/**
 * One side of the lower body as an open shell. side = +1 is the car's right
 * flank (+z), −1 the left. The ring runs top-centre → shoulder → flank →
 * wheel-arch well → underside centre.
 */
export function bodyHalf(shape: Shape, side: 1 | -1): THREE.BufferGeometry {
  const { car, xMin, xMax, top, bottom, half } = shape;
  const R = car.dims.wheelRadius;
  const archR = R + 0.045;
  const axles = [car.dims.frontAxle, car.dims.rearAxle];
  const rings: THREE.Vector3[][] = [];

  for (let i = 0; i <= STATIONS; i++) {
    // Cosine spacing packs stations at nose and tail where curvature is highest.
    const u = (1 - Math.cos((i / STATIONS) * Math.PI)) / 2;
    const x = xMax - u * (xMax - xMin);
    const yt = top(x);
    const yb = bottom(x);
    const w = i === 0 || i === STATIONS ? 0.0001 : half(x);
    const ymid = Math.max(yb + 0.02, yt - SHOULDER);

    let yArch = yb;
    for (const ax of axles) {
      const d = Math.abs(x - ax);
      if (d < archR) yArch = Math.max(yArch, R + Math.sqrt(archR * archR - d * d));
    }
    yArch = Math.min(yArch, ymid - 0.015);

    const ring: THREE.Vector3[] = [];
    // Shoulder: superellipse quarter from the top centre to the flank.
    const SEG = 12;
    for (let k = 0; k <= SEG; k++) {
      const a = (k / SEG) * (Math.PI / 2);
      const z = w * Math.pow(Math.sin(a), 2 / 3.2);
      const y = ymid + (yt - ymid) * Math.pow(Math.cos(a), 2 / 3.2);
      ring.push(new THREE.Vector3(x, y, z * side));
    }
    // Flank, with a slight tuck towards the sill.
    const FL = 6;
    for (let k = 1; k <= FL; k++) {
      const t = k / FL;
      const y = ymid + (yArch - ymid) * t;
      const z = w * (1 - 0.035 * t * t);
      ring.push(new THREE.Vector3(x, y, z * side));
    }
    // Arch well (collapses onto the underside away from the wheels).
    const wIn = Math.max(0.02, w - WELL);
    ring.push(new THREE.Vector3(x, yArch, wIn * side));
    ring.push(new THREE.Vector3(x, yb, wIn * side));
    ring.push(new THREE.Vector3(x, yb, 0));
    rings.push(ring);
  }

  return loft(rings, side === -1);
}

/** Glasshouse half, from the roof centreline down to the beltline. */
export function glassHalf(shape: Shape, side: 1 | -1): THREE.BufferGeometry {
  const { car, glassMin, glassMax, glassTop, top } = shape;
  const cw = car.dims.cabinWidth / 2;
  const rings: THREE.Vector3[][] = [];
  const N = 70;
  const mid = (glassMin + glassMax) / 2;
  const hl = (glassMax - glassMin) / 2;

  for (let i = 0; i <= N; i++) {
    const u = (1 - Math.cos((i / N) * Math.PI)) / 2;
    const x = glassMax - u * (glassMax - glassMin);
    const yBase = top(x) - 0.02;
    // Endpoints can land a hair outside the glass range in floating point; treat that as zero height.
    const g = glassTop(x);
    const yt = Math.max(yBase + 0.001, Number.isFinite(g) ? g : yBase);
    const t = Math.abs((x - mid) / hl);
    const w = i === 0 || i === N ? 0.0001 : cw * Math.pow(1 - Math.pow(t, 4), 1 / 4);
    const ring: THREE.Vector3[] = [];
    const SEG = 14;
    for (let k = 0; k <= SEG; k++) {
      const a = (k / SEG) * (Math.PI / 2);
      // Tumblehome: the glass leans in towards the roof.
      const z = w * Math.pow(Math.sin(a), 2 / 2.6) * (0.78 + 0.22 * (k / SEG));
      const y = yBase + (yt - yBase) * Math.pow(Math.cos(a), 2 / 2.6);
      ring.push(new THREE.Vector3(x, y, z * side));
    }
    ring.push(new THREE.Vector3(x, yBase, 0));
    rings.push(ring);
  }
  return loft(rings, side === -1);
}

/**
 * Hexagonal Singleframe grille projected onto the nose surface. One half per side,
 * so it splits open with the body.
 */
export function grilleHalf(shape: Shape, side: 1 | -1): THREE.BufferGeometry {
  const { top, bottom, xMax, half, surfaceX } = shape;
  const xRef = xMax - 0.12;
  const gw = half(xRef) * 0.6;
  const y0 = bottom(xRef) + 0.07;
  const y1 = Math.min(top(xMax - 0.05) - 0.05, y0 + 0.42);
  const rows = 10;
  const cols = 12;
  const rings: THREE.Vector3[][] = [];
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const y = y0 + (y1 - y0) * v;
    // Octagon-ish Singleframe: widest at two-thirds height, chamfered top and bottom.
    const widthAt = gw * (0.78 + 0.22 * Math.sin(Math.min(1, v * 1.4) * Math.PI * 0.5) - 0.1 * smooth(0.75, 1, v));
    const ring: THREE.Vector3[] = [];
    for (let c = 0; c <= cols; c++) {
      const z = (c / cols) * widthAt;
      ring.push(new THREE.Vector3(surfaceX(Math.max(z, 0.002), 1) + 0.006, y, z * side));
    }
    rings.push(ring);
  }
  return loft(rings, side === 1);
}

/** Thin light strip that hugs the nose or tail surface. */
export function lightStrip(shape: Shape, end: 1 | -1, side: 1 | -1, from: number, to: number, y: number, h: number) {
  const { half, xMax, xMin, surfaceX } = shape;
  const xRef = end === 1 ? xMax - 0.15 : xMin + 0.12;
  const w = half(xRef);
  const rings: THREE.Vector3[][] = [];
  for (let r = 0; r <= 1; r++) {
    const ring: THREE.Vector3[] = [];
    for (let c = 0; c <= 16; c++) {
      const z = w * (from + (to - from) * (c / 16));
      ring.push(new THREE.Vector3(surfaceX(Math.max(z, 0.002), end) + 0.008 * end, y + (r - 0.5) * h, z * side));
    }
    rings.push(ring);
  }
  return loft(rings, (side === 1) !== (end === 1));
}

/** Soft elliptical contact shadow. */
export function shadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.9)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
