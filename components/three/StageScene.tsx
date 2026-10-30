"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "@/lib/motion";
import { pose } from "@/lib/stage";
import { seededRandom } from "./random";
import {
  dustFragment,
  dustVertex,
  haloFragment,
  haloVertex,
  orbFragment,
  orbVertex,
} from "./shaders";

/** A still moment of the animation, used when motion is reduced. */
const STILL_TIME = 18;
const NODE_COUNT = 64;
const NEIGHBOURS = 3;
const PULSE_COUNT = 18;
const BANDS = 4;
const COLOR_IDLE = new THREE.Color("#5d6787");
const COLOR_ACTIVE = new THREE.Color("#6fe7ff");
const ON_TOUCH = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;

export default function StageScene({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const [touch] = useState(ON_TOUCH);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [resolution, setResolution] = useState(touch ? 1.25 : 1.5);

  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 36 }}
      dpr={Math.min(window.devicePixelRatio || 1, resolution)}
      gl={{ alpha: true, antialias: !touch, powerPreference: "high-performance" }}
      frameloop="demand"
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onLost);
        onReady();
      }}
    >
      <Driver touch={touch} reduced={reduced} />
      {!reduced && <FrameGuard onSlow={() => setResolution((value) => (value > 1 ? 1 : 0.7))} onTooSlow={onLost} />}
      <World touch={touch} reduced={reduced} />
    </Canvas>
  );
}

/**
 * Requests frames only when something is on stage, capped at 30fps on touch devices.
 * Reduced motion draws a single frame. Nothing renders behind the carousel or in a hidden tab.
 */
function Driver({ touch, reduced }: { touch: boolean; reduced: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (reduced) {
      invalidate();
      return;
    }
    let last = 0;
    const tick = (time: number) => {
      if (document.hidden || pose.orb + pose.net < 0.01) return;
      if (touch && time - last < 1 / 31) return;
      last = time;
      invalidate();
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [invalidate, touch, reduced]);

  return null;
}

const GUARD_WINDOW = 2;
const GUARD_SLOW_FPS = 24;
const GUARD_MIN_FPS = 8;

/**
 * Steps resolution down on a slow device, which keeps the real sphere on integrated graphics. Only if
 * it still cannot manage 8fps would rendering start to starve scrolling, so it hands over to the CSS core.
 */
function FrameGuard({ onSlow, onTooSlow }: { onSlow: () => void; onTooSlow: () => void }) {
  const sample = useRef({ elapsed: 0, frames: 0, slowWindows: 0 });

  useFrame((_, delta) => {
    // A gap this long means rendering was paused on purpose, so it says nothing about speed.
    if (delta > 1.5) return;
    const current = sample.current;
    current.elapsed += delta;
    current.frames += 1;
    if (current.elapsed < GUARD_WINDOW) return;
    const fps = current.frames / current.elapsed;
    current.elapsed = 0;
    current.frames = 0;
    if (fps < GUARD_SLOW_FPS) onSlow();
    current.slowWindows = fps < GUARD_MIN_FPS ? current.slowWindows + 1 : 0;
    if (current.slowWindows >= 3) onTooSlow();
  });

  return null;
}

function buildNetwork() {
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    nodes.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((node, a) => {
    nodes
      .map((other, b) => ({ b, distance: node.distanceToSquared(other) }))
      .filter(({ b }) => b !== a)
      .sort((x, y) => x.distance - y.distance)
      .slice(0, NEIGHBOURS)
      .forEach(({ b }) => {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([a, b]);
        }
      });
  });
  const linePositions = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    nodes[a].toArray(linePositions, i * 6);
    nodes[b].toArray(linePositions, i * 6 + 3);
  });
  return { nodes, edges, linePositions };
}

function World({ touch, reduced }: { touch: boolean; reduced: boolean }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const network = useMemo(() => buildNetwork(), []);

  const rig = useRef<THREE.Group>(null);
  const orbGroup = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const rings = useRef<THREE.Group>(null);
  const orb = useRef<THREE.ShaderMaterial>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const dust = useRef<THREE.ShaderMaterial>(null);

  const netGroup = useRef<THREE.Group>(null);
  const nodesMesh = useRef<THREE.InstancedMesh>(null);
  const netLines = useRef<THREE.LineBasicMaterial>(null);
  const netInner = useRef<THREE.LineSegments>(null);
  const netInnerMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.MeshBasicMaterial>(null);
  const pulses = useRef<THREE.Points>(null);
  const pulseMat = useRef<THREE.PointsMaterial>(null);
  const netRings = useRef<THREE.Group>(null);

  const pointer = useRef({ x: 0, y: 0 });
  const smoothed = useRef({ x: 0, y: 0 });
  const direction = useMemo(() => new THREE.Vector3(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (touch || reduced) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [touch, reduced]);

  const orbUniforms = useMemo(
    () => ({
      uTime: { value: STILL_TIME },
      uEnergy: { value: 0 },
      uAlpha: { value: 1 },
      uPointer: { value: new THREE.Vector3(0.4, 0.4, 0.8).normalize() },
    }),
    [],
  );
  const haloUniforms = useMemo(() => ({ uStrength: { value: 0.5 } }), []);
  const dustUniforms = useMemo(
    () => ({ uTime: { value: STILL_TIME }, uPixelRatio: { value: dpr }, uOpacity: { value: 1 } }),
    [dpr],
  );

  const dustGeometry = useMemo(() => {
    const random = seededRandom(7);
    const count = touch ? 240 : 620;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const radius = 2 + random() * 5.5;
      const theta = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (random() - 0.5) * 5;
      positions[i * 3 + 2] = Math.sin(theta) * radius * 0.7;
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geometry;
  }, [touch]);

  const shellGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.42, 1)),
    [],
  );
  const innerGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.4, 0)),
    [],
  );

  useEffect(
    () => () => {
      dustGeometry.dispose();
      shellGeometry.dispose();
      innerGeometry.dispose();
    },
    [dustGeometry, shellGeometry, innerGeometry],
  );

  const pulseSeeds = useMemo(() => {
    const random = seededRandom(21);
    return Array.from({ length: PULSE_COUNT }, () => ({
      edge: Math.floor(random() * network.edges.length),
      speed: 0.25 + random() * 0.4,
      offset: random(),
    }));
  }, [network]);
  const pulseBuffer = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);

  useLayoutEffect(() => {
    const mesh = nodesMesh.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    network.nodes.forEach((node, i) => {
      matrix.setPosition(node);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, COLOR_IDLE);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [network]);

  useFrame((state, delta) => {
    const time = reduced ? STILL_TIME : state.clock.elapsedTime;
    const { width, height } = state.size;
    const unit = (2 * 6.4 * Math.tan((18 * Math.PI) / 180)) / height;
    const portrait = width < height;
    const radius = pose.size * Math.min(width, height) * (portrait ? 1.35 : 1) * unit;

    const s = smoothed.current;
    const ease = 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
    s.x += (pointer.current.x - s.x) * ease;
    s.y += (pointer.current.y - s.y) * ease;

    if (rig.current) {
      rig.current.position.set(
        ((pose.x * width) / 2) * unit + s.x * 0.08,
        ((pose.y * height) / 2) * unit + s.y * 0.06,
        0,
      );
      rig.current.scale.setScalar(radius);
    }

    // The orb
    const orbVisible = pose.orb > 0.005;
    if (orbGroup.current) orbGroup.current.visible = orbVisible;
    // The rings have fixed opacities, so they leave before the fading sphere would orphan them.
    if (rings.current) rings.current.visible = pose.orb > 0.3;
    if (orbVisible) {
      if (spin.current) {
        spin.current.rotation.y = time * 0.06 + s.x * 0.32 + pose.energy * 1.8;
        spin.current.rotation.x = -s.y * 0.22 + pose.energy * 0.6;
      }
      if (shell.current) {
        shell.current.rotation.y = -time * 0.035 - s.x * 0.2;
        shell.current.rotation.z = time * 0.02 + pose.energy;
        (shell.current.material as THREE.LineBasicMaterial).opacity = 0.09 * pose.orb;
      }
      if (rings.current) {
        rings.current.rotation.z = time * 0.05 + s.x * 0.12;
        rings.current.rotation.x = 1.2 + s.y * 0.14 + pose.energy * 0.9;
        rings.current.children.forEach((ring, index) => {
          ring.rotation.z = time * (0.14 + index * 0.05) * (index % 2 ? -1 : 1);
        });
      }
      if (orb.current) {
        orb.current.uniforms.uTime.value = time;
        orb.current.uniforms.uEnergy.value = pose.energy;
        orb.current.uniforms.uAlpha.value = pose.orb;
        direction.set(s.x * 1.3, s.y * 1.3, 0.75).normalize();
        orb.current.uniforms.uPointer.value.copy(direction);
      }
      if (halo.current) halo.current.uniforms.uStrength.value = (0.42 + pose.energy * 0.35) * pose.orb;
    }
    if (dust.current) {
      dust.current.uniforms.uTime.value = time;
      dust.current.uniforms.uOpacity.value = Math.max(pose.orb, pose.net);
    }

    // The network
    const netVisible = pose.net > 0.005;
    if (netGroup.current) {
      netGroup.current.visible = netVisible;
      if (netVisible) {
        netGroup.current.rotation.y = pose.spin * Math.PI * 1.6 + time * 0.03;
        netGroup.current.rotation.x = 0.28 - pose.spin * 0.6;
        netGroup.current.scale.setScalar(0.72 + pose.net * 0.28);
      }
    }
    if (netVisible) {
      if (netInner.current) {
        netInner.current.rotation.y = -pose.spin * Math.PI * 2 - time * 0.06;
        netInner.current.rotation.z = pose.spin * Math.PI;
        netInner.current.scale.setScalar(0.92 + Math.sin(pose.spin * Math.PI) * 0.2);
      }
      if (netRings.current) {
        netRings.current.children.forEach((ring, index) => {
          ring.rotation.set(
            Math.PI / 2 + pose.spin * (1.1 - index * 0.8),
            pose.spin * (0.5 + index * 0.2) + index * 0.4,
            time * 0.05 * (index % 2 ? -1 : 1),
          );
        });
      }
      if (netLines.current) netLines.current.opacity = 0.2 * pose.net;
      if (netInnerMat.current) netInnerMat.current.opacity = 0.8 * pose.net;
      if (nodeMat.current) nodeMat.current.opacity = pose.net;
      if (pulseMat.current) pulseMat.current.opacity = 0.95 * pose.net;

      // Each capability lights one latitude band of the network.
      const mesh = nodesMesh.current;
      if (mesh && mesh.instanceColor) {
        const focus = Math.min(BANDS - 1, Math.floor(pose.spin * BANDS));
        const blend = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 5);
        let dirty = false;
        for (let i = 0; i < NODE_COUNT; i += 1) {
          const band = Math.floor((i / NODE_COUNT) * BANDS);
          mesh.getColorAt(i, tint);
          const goal = band === focus ? COLOR_ACTIVE : COLOR_IDLE;
          if (Math.abs(tint.g - goal.g) > 0.004) {
            tint.lerp(goal, blend);
            mesh.setColorAt(i, tint);
            dirty = true;
          }
        }
        if (dirty) mesh.instanceColor.needsUpdate = true;
      }

      if (pulses.current) {
        const attribute = pulses.current.geometry.getAttribute("position") as THREE.BufferAttribute;
        pulseSeeds.forEach((pulse, i) => {
          const [a, b] = network.edges[pulse.edge];
          const along = (time * pulse.speed + pulse.offset) % 1;
          const from = network.nodes[a];
          const to = network.nodes[b];
          attribute.setXYZ(
            i,
            from.x + (to.x - from.x) * along,
            from.y + (to.y - from.y) * along,
            from.z + (to.z - from.z) * along,
          );
        });
        attribute.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <group ref={rig}>
        <group ref={orbGroup}>
          <mesh position={[0, 0, -1.6]} renderOrder={-1}>
            <planeGeometry args={[7, 7]} />
            <shaderMaterial
              ref={halo}
              vertexShader={haloVertex}
              fragmentShader={haloFragment}
              uniforms={haloUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <group ref={spin}>
            <mesh>
              <sphereGeometry args={[1, touch ? 40 : 96, touch ? 28 : 64]} />
              <shaderMaterial
                ref={orb}
                vertexShader={orbVertex}
                fragmentShader={orbFragment}
                uniforms={orbUniforms}
                transparent
              />
            </mesh>
          </group>
          <lineSegments ref={shell} geometry={shellGeometry}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.09} depthWrite={false} />
          </lineSegments>
          <group ref={rings} rotation={[1.2, 0.2, 0]}>
            <Ring radius={1.32} tilt={[0, 0, 0]} color="#6fe7ff" opacity={0.42} />
            <Ring radius={1.58} tilt={[0.42, 0.18, 0]} color="#ffffff" opacity={0.17} />
            <Ring radius={1.86} tilt={[-0.3, 0.34, 0]} color="#8a63ff" opacity={0.3} />
          </group>
        </group>

        <group ref={netGroup} visible={false}>
          <instancedMesh ref={nodesMesh} args={[undefined, undefined, NODE_COUNT]}>
            <sphereGeometry args={[0.018, 10, 10]} />
            <meshBasicMaterial ref={nodeMat} transparent />
          </instancedMesh>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[network.linePositions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial ref={netLines} color="#a9b8ff" transparent opacity={0.2} depthWrite={false} />
          </lineSegments>
          <points ref={pulses}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pulseBuffer, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={pulseMat}
              color="#6fe7ff"
              size={0.04}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
          <lineSegments ref={netInner} geometry={innerGeometry}>
            <lineBasicMaterial ref={netInnerMat} color="#7f9bff" transparent depthWrite={false} />
          </lineSegments>
          <group ref={netRings}>
            {[1.28, 1.43, 1.55].map((size, index) => (
              <mesh key={size}>
                <torusGeometry args={[size, 0.002, 6, 120]} />
                <meshBasicMaterial
                  color={["#6fe7ff", "#ffffff", "#8a63ff"][index]}
                  transparent
                  opacity={[0.45, 0.2, 0.35][index]}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      <points geometry={dustGeometry}>
        <shaderMaterial
          ref={dust}
          vertexShader={dustVertex}
          fragmentShader={dustFragment}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function Ring({
  radius,
  tilt,
  color,
  opacity,
}: {
  radius: number;
  tilt: [number, number, number];
  color: string;
  opacity: number;
}) {
  return (
    <group rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.003, 6, 140]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
