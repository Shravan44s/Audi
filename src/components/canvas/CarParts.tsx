'use client';

import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Car } from '@/data/cars';
import type { Shape } from './carGeometry';

/* Shared materials. Module-level so the four cars reuse the same shader programs. */
export const MAT = {
  rubber: new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.92 }),
  rim: new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.9, roughness: 0.28 }),
  rimFace: new THREE.MeshStandardMaterial({ color: '#8d9198', metalness: 1, roughness: 0.22 }),
  disc: new THREE.MeshStandardMaterial({ color: '#6f7176', metalness: 0.85, roughness: 0.45 }),
  caliper: new THREE.MeshStandardMaterial({ color: '#c8102e', metalness: 0.3, roughness: 0.35 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#e6e8ec', metalness: 1, roughness: 0.08 }),
  piano: new THREE.MeshStandardMaterial({ color: '#050506', metalness: 0.4, roughness: 0.12, side: THREE.DoubleSide }),
  alu: new THREE.MeshStandardMaterial({ color: '#9aa0a8', metalness: 0.85, roughness: 0.35 }),
  darkAlu: new THREE.MeshStandardMaterial({ color: '#2d3036', metalness: 0.7, roughness: 0.45 }),
  carpet: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.95 }),
  dash: new THREE.MeshStandardMaterial({ color: '#111113', roughness: 0.55 }),
  intake: new THREE.MeshStandardMaterial({ color: '#b3121f', metalness: 0.5, roughness: 0.3 }),
};

/* ---------------------------------------------------------------- Wheel */

const tireGeo = (R: number) => {
  const w = 0.13;
  const r0 = R * 0.66;
  const pts = [
    new THREE.Vector2(r0, -w),
    new THREE.Vector2(R - 0.03, -w),
    new THREE.Vector2(R - 0.005, -w + 0.035),
    new THREE.Vector2(R, 0),
    new THREE.Vector2(R - 0.005, w - 0.035),
    new THREE.Vector2(R - 0.03, w),
    new THREE.Vector2(r0, w),
  ];
  // Lathe revolves around Y; rotate so the axle runs along Z.
  return new THREE.LatheGeometry(pts, 64).rotateX(Math.PI / 2);
};

/**
 * Wheel with tyre, multi-spoke rim, brake disc and a fixed (non-rotating) caliper.
 * The spinning part is exposed through `spin` so the rig can roll it with the car's motion.
 */
export function Wheel({ R, side, spin }: { R: number; side: 1 | -1; spin: (g: THREE.Group | null) => void }) {
  const tire = useMemo(() => tireGeo(R), [R]);
  const rimR = R * 0.66;
  const spokes = 10;
  useEffect(() => () => tire.dispose(), [tire]);

  return (
    <group>
      <group ref={spin}>
        <mesh geometry={tire} material={MAT.rubber} />
        {/* rim barrel */}
        <mesh material={MAT.rim} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[rimR, rimR, 0.22, 48, 1, true]} />
        </mesh>
        {/* spokes on the outer face */}
        <group position-z={0.1 * side}>
          {Array.from({ length: spokes }, (_, i) => (
            <mesh key={i} material={MAT.rimFace} rotation-z={(i / spokes) * Math.PI * 2} position-z={0}>
              <boxGeometry args={[0.035, rimR * 1.9, 0.028]} />
            </mesh>
          ))}
          <mesh material={MAT.rimFace} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[rimR * 0.22, rimR * 0.24, 0.05, 24]} />
          </mesh>
          <mesh material={MAT.rim} rotation-x={Math.PI / 2}>
            <torusGeometry args={[rimR * 0.97, 0.018, 8, 64]} />
          </mesh>
        </group>
        {/* drilled brake disc */}
        <mesh material={MAT.disc} rotation-x={Math.PI / 2} position-z={0.02 * side}>
          <cylinderGeometry args={[rimR * 0.86, rimR * 0.86, 0.03, 48]} />
        </mesh>
      </group>
      {/* caliper stays put while the wheel turns */}
      <mesh material={MAT.caliper} position={[rimR * 0.48, rimR * 0.48, 0.055 * side]} rotation-z={-Math.PI / 4}>
        <boxGeometry args={[0.1, rimR * 0.55, 0.06]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- Cabin */

function Seat({ trim, position, scale = 1, sport = true }: { trim: THREE.Material; position: [number, number, number]; scale?: number; sport?: boolean }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.5, 0.12, 0.48]} radius={0.05} smoothness={3} material={trim} position={[0, 0.06, 0]} />
      <group position={[-0.24, 0.1, 0]} rotation-z={0.22}>
        <RoundedBox args={[0.12, 0.62, 0.48]} radius={0.05} smoothness={3} material={trim} position={[0, 0.31, 0]} />
        {sport && (
          <>
            <RoundedBox args={[0.14, 0.5, 0.08]} radius={0.035} smoothness={3} material={trim} position={[0.03, 0.3, 0.22]} />
            <RoundedBox args={[0.14, 0.5, 0.08]} radius={0.035} smoothness={3} material={trim} position={[0.03, 0.3, -0.22]} />
          </>
        )}
        <RoundedBox args={[0.1, 0.18, 0.28]} radius={0.04} smoothness={3} material={trim} position={[0, 0.72, 0]} />
      </group>
    </group>
  );
}

/** Floor, dashboard with glowing displays, steering wheel, console and seats. */
export function Cabin({ car, shape, screens }: { car: Car; shape: Shape; screens: THREE.MeshStandardMaterial }) {
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: car.trim, roughness: 0.62 }), [car.trim]);
  useEffect(() => () => trim.dispose(), [trim]);

  const { glassMax, bottom, car: c } = shape;
  const cw = c.dims.cabinWidth;
  const floorY = bottom(0) + 0.12;
  const dashX = glassMax - 0.32;
  const dashY = c.dims.belt - 0.08;
  const frontSeatX = dashX - 0.85;
  const twoSeater = c.powertrain === 'mid';
  const rearSeatX = frontSeatX - 0.9;
  const seatY = floorY + 0.12;
  const driverZ = -cw * 0.25;
  const len = (twoSeater ? dashX - frontSeatX + 0.5 : dashX - rearSeatX + 0.55) + 0.1;

  return (
    <group>
      <mesh material={MAT.carpet} position={[dashX + 0.1 - len / 2, floorY, 0]}>
        <boxGeometry args={[len, 0.05, cw * 0.95]} />
      </mesh>
      {/* Dashboard */}
      <RoundedBox args={[0.42, 0.2, cw * 0.95]} radius={0.06} smoothness={3} material={MAT.dash} position={[dashX, dashY, 0]} />
      {/* Virtual cockpit + MMI: emissive panels, pulse with the explode */}
      <mesh material={screens} position={[dashX - 0.19, dashY + 0.13, driverZ]} rotation={[0, -Math.PI / 2, 0.18]}>
        <planeGeometry args={[0.34, 0.12]} />
      </mesh>
      {!twoSeater && (
        <mesh material={screens} position={[dashX - 0.2, dashY + 0.02, 0]} rotation={[0, -Math.PI / 2, 0.35]}>
          <planeGeometry args={[0.26, 0.17]} />
        </mesh>
      )}
      {/* Steering wheel */}
      <group position={[dashX - 0.42, dashY + 0.02, driverZ]} rotation={[0, 0, 0.42]}>
        <mesh material={MAT.dash} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.17, 0.022, 12, 40]} />
        </mesh>
        <mesh material={MAT.dash} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 12]} />
        </mesh>
        <mesh material={MAT.intake} position={[0, 0.17, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.03]} />
        </mesh>
      </group>
      {/* Centre console */}
      <RoundedBox
        args={[twoSeater ? 0.9 : 1.1, 0.18, 0.2]}
        radius={0.05}
        smoothness={3}
        material={MAT.dash}
        position={[dashX - 0.6, floorY + 0.12, 0]}
      />
      <mesh material={screens} position={[dashX - 0.45, floorY + 0.215, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.22, 0.12]} />
      </mesh>
      {/* Seats */}
      <Seat trim={trim} position={[frontSeatX, seatY, driverZ]} />
      <Seat trim={trim} position={[frontSeatX, seatY, -driverZ]} />
      {!twoSeater && (
        <>
          <Seat trim={trim} position={[rearSeatX, seatY + 0.02, driverZ * 1.05]} scale={0.95} sport={false} />
          <Seat trim={trim} position={[rearSeatX, seatY + 0.02, -driverZ * 1.05]} scale={0.95} sport={false} />
        </>
      )}
    </group>
  );
}

/** Anchor points for each layer's label, in the car's local space. */
export function cabinAnchors(shape: Shape) {
  const dashX = shape.glassMax - 0.32;
  return {
    cockpit: [dashX - 0.19, shape.car.dims.belt + 0.08, -shape.car.dims.cabinWidth * 0.25] as [number, number, number],
    seats: [dashX - 0.85, shape.bottom(0) + 0.8, shape.car.dims.cabinWidth * 0.25] as [number, number, number],
    cabin: [dashX - 0.6, shape.bottom(0) + 0.35, 0] as [number, number, number],
  };
}

/* ---------------------------------------------------------------- Powertrain */

/** Battery pack: tray plus glowing modules that spread apart as the car opens. */
export function Battery({ shape, modules }: { shape: Shape; modules: (m: THREE.InstancedMesh | null) => void }) {
  const { car } = shape;
  const x0 = car.dims.rearAxle + 0.32;
  const x1 = car.dims.frontAxle - 0.42;
  const w = car.dims.width * 0.72;
  const y = shape.bottom(0) + 0.05;
  return (
    <group position={[(x0 + x1) / 2, y, 0]}>
      <mesh material={MAT.darkAlu}>
        <boxGeometry args={[x1 - x0, 0.04, w]} />
      </mesh>
      <instancedMesh ref={modules} args={[undefined, undefined, BATTERY_COLS * BATTERY_ROWS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a3f46" metalness={0.9} roughness={0.28} emissive="#5ee6ff" emissiveIntensity={0.02} />
      </instancedMesh>
    </group>
  );
}

export const BATTERY_COLS = 9;
export const BATTERY_ROWS = 4;

export function batteryLayout(shape: Shape) {
  const { car } = shape;
  const len = car.dims.frontAxle - 0.42 - (car.dims.rearAxle + 0.32);
  const w = car.dims.width * 0.72;
  return { cellX: len / BATTERY_COLS, cellZ: w / BATTERY_ROWS, h: 0.1 };
}

/** Electric motor on an axle, with orange high-voltage rings and half-shafts to the wheels. */
export function EMotor({ x, y, track, hv }: { x: number; y: number; track: number; hv: THREE.Material }) {
  return (
    <group position={[x, y, 0]}>
      <mesh material={MAT.alu} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.16, 0.16, 0.42, 32]} />
      </mesh>
      {[-0.12, 0.12].map((z) => (
        <mesh key={z} material={hv} position-z={z}>
          <torusGeometry args={[0.165, 0.012, 8, 40]} />
        </mesh>
      ))}
      <mesh material={MAT.darkAlu} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, track, 12]} />
      </mesh>
    </group>
  );
}

/** V-engine: crankcase, two angled cylinder banks, red intakes, gearbox and shaft. */
export function Engine({
  x,
  y,
  cylinders,
  shaftTo,
  heat,
}: {
  x: number;
  y: number;
  cylinders: number;
  /** x of the axle the propshaft runs to. */
  shaftTo: number;
  heat: THREE.Material;
}) {
  const perBank = cylinders / 2;
  const pitch = 0.11;
  const len = perBank * pitch + 0.12;
  return (
    <group position={[x, y, 0]}>
      <RoundedBox args={[len, 0.24, 0.42]} radius={0.04} smoothness={2} material={MAT.darkAlu} />
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0.17, 0.13 * s]} rotation-x={-0.55 * s}>
          <RoundedBox args={[len - 0.04, 0.16, 0.16]} radius={0.03} smoothness={2} material={MAT.alu} />
          <RoundedBox args={[len - 0.08, 0.05, 0.14]} radius={0.02} smoothness={2} material={MAT.intake} position-y={0.1} />
          {Array.from({ length: perBank }, (_, i) => (
            <mesh key={i} material={MAT.chrome} position={[-len / 2 + 0.1 + i * pitch, 0.13, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Hot-V turbos / exhaust glow */}
      <mesh material={heat} position={[0, 0.2, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.05, 0.02, 8, 24]} />
      </mesh>
      {/* Gearbox + propshaft */}
      <mesh material={MAT.alu} position={[(shaftTo - x) * 0.25, -0.03, 0]}>
        <boxGeometry args={[0.3, 0.18, 0.22]} />
      </mesh>
      <mesh material={MAT.darkAlu} position={[(shaftTo - x) / 2, -0.06, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, Math.abs(shaftTo - x), 12]} />
      </mesh>
      <mesh material={MAT.alu} position={[shaftTo - x, -0.06, 0]}>
        <sphereGeometry args={[0.1, 16, 12]} />
      </mesh>
    </group>
  );
}
