import * as THREE from 'three';

/**
 * "Materialise" effect shared by every material on the car. Fragments ahead of the
 * scan plane are discarded and a hot line glows at the plane itself, so on intro and
 * model swaps the car is printed from tail to nose. The plane runs along the car's
 * own nose axis, in world space, so it works for GLB meshes with arbitrary transforms.
 */
export const scanUniforms = {
  uScan: { value: -4 },
  uScanOrigin: { value: new THREE.Vector3() },
  uScanAxis: { value: new THREE.Vector3(1, 0, 0) },
  uScanColor: { value: new THREE.Color('#5ee6ff') },
};

const patched = new WeakSet<THREE.Material>();

export function materialize(material: THREE.Material): void {
  if (patched.has(material) || (material as THREE.ShaderMaterial).isShaderMaterial) return;
  patched.add(material);
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    Object.assign(shader.uniforms, scanUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vScanW;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 scanW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          scanW = instanceMatrix * scanW;
        #endif
        vScanW = (modelMatrix * scanW).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vScanW;
        uniform float uScan;
        uniform vec3 uScanOrigin;
        uniform vec3 uScanAxis;
        uniform vec3 uScanColor;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float scanD = uScan - dot(vScanW - uScanOrigin, uScanAxis);
        if (scanD < 0.0) discard;
        float scanEdge = 1.0 - smoothstep(0.0, 0.18, scanD);
        // Faint print lines just behind the edge.
        float scanLines = step(0.5, fract(vScanW.y * 60.0)) * (1.0 - smoothstep(0.0, 0.9, scanD)) * 0.35;`,
      );
    if (shader.fragmentShader.includes('#include <emissivemap_fragment>')) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance += uScanColor * (scanEdge * 6.0 + scanLines);',
      );
    }
  };
  material.customProgramCacheKey = () => 'materialize';
  material.needsUpdate = true;
}

/** Patch every material under an object. */
export function materializeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach(materialize);
  });
}

/**
 * Hologram material for the procedural stand-in car: fresnel rim, horizontal scan
 * bands and a slow flicker, additive. Used until a real GLB is dropped in.
 */
export function hologramMaterial(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      ...scanUniforms,
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uScan;
      uniform vec3 uScanOrigin;
      uniform vec3 uScanAxis;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        float d = uScan - dot(vW - uScanOrigin, uScanAxis);
        if (d < 0.0) discard;
        float fres = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2);
        float bands = smoothstep(0.35, 0.5, fract(vW.y * 18.0 - uTime * 0.6)) * 0.18;
        float sweep = smoothstep(0.0, 0.08, fract(vW.x * 0.12 - uTime * 0.25)) * smoothstep(0.2, 0.08, fract(vW.x * 0.12 - uTime * 0.25));
        float flicker = 0.92 + 0.08 * sin(uTime * 37.0 + vW.y * 4.0);
        float edge = 1.0 - smoothstep(0.0, 0.15, d);
        float a = (0.05 + fres * 0.85 + bands + sweep * 0.5) * flicker;
        gl_FragColor = vec4(uColor * (a + edge * 3.0), (a + edge) * uOpacity);
      }`,
  });
}
