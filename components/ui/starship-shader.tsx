"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

/** A still moment of the animation, used when motion is reduced. */
const STILL_TIME = 24;
const GUARD_WINDOW = 2;
const GUARD_SLOW_FPS = 30;
const GUARD_MIN_FPS = 10;
const MIN_RESOLUTION = 0.4;

function FullscreenShader({ reduced }: { reduced: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const buffer = useMemo(() => new THREE.Vector2(), []);

  // Create a small static noise texture for iChannel0
  const noiseTexture = useMemo(() => {
    const w = 256;
    const h = 256;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h * 4; i++) data[i] = Math.floor(Math.random() * 256);
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Data textures default to nearest, which shows up as squares in the streaks.
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => () => noiseTexture.dispose(), [noiseTexture]);

  const uniforms = useMemo(
    () => ({
      iTime: { value: STILL_TIME },
      iResolution: { value: new THREE.Vector2(1, 1) },
      iChannel0: { value: noiseTexture },
    }),
    [noiseTexture],
  );

  useFrame(({ clock, gl }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.iTime.value = reduced ? STILL_TIME : clock.elapsedTime;
    // gl_FragCoord counts device pixels, so the resolution has to as well.
    materialRef.current.uniforms.iResolution.value.copy(gl.getDrawingBufferSize(buffer));
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        depthWrite={false}
        depthTest={false}
        blending={THREE.NoBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;

          uniform float iTime;
          uniform vec2 iResolution;
          uniform sampler2D iChannel0;

          // "Starship" by @XorDev (adapted)
          void mainImage(out vec4 O, vec2 I)
          {
              vec2 r = iResolution.xy,
                   p = (I+I-r) / r.y * mat2(3.,4.,4.,-3.) / 1e2;

              vec4 S = vec4(0.0);
              vec4 C = vec4(1.,2.,3.,0.);
              vec4 W;

              for(float t=iTime, T=.1*t+p.y, i=0.; i<50.; i+=1.){
                  S += (cos(W=sin(i)*C)+1.)
                       * exp(sin(i+i*T))
                       / length(max(p,
                         p / vec2(2.0, texture(iChannel0, p/exp(W.x)+vec2(i,t)/8.).r*40.0)
                       )) / 1e4;

                  p += .02 * cos(i*(C.xz+8.0+i) + T + T);
              }

              // Premultiplied, with empty space fully transparent, so the page shows through.
              vec3 col = tanh((S*S).rgb);
              O = vec4(col, max(col.r, max(col.g, col.b)));
          }

          void main() {
            vec2 fragCoord = gl_FragCoord.xy;
            vec4 O;
            mainImage(O, fragCoord);
            gl_FragColor = O;
          }
        `}
      />
    </mesh>
  );
}

/**
 * Requests frames only while the canvas is on screen and the tab is visible, capped at 30fps on touch
 * devices. Reduced motion draws a single frame.
 */
function Driver({ touch, reduced }: { touch: boolean; reduced: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (reduced) {
      invalidate();
      return;
    }
    let frame = 0;
    let last = 0;
    let visible = false;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || (touch && time - last < 32)) return;
      last = time;
      invalidate();
    };
    const observer = new IntersectionObserver((entries) => {
      const next = entries.some((entry) => entry.isIntersecting);
      if (next === visible) return;
      visible = next;
      cancelAnimationFrame(frame);
      frame = next ? requestAnimationFrame(tick) : 0;
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [canvas, invalidate, touch, reduced]);

  return null;
}

/** Steps resolution down on a slow device, and gives up before rendering could starve scrolling. */
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

function supportsWebGL2() {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    // Browsers cap live contexts, so release the probe straight away.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

export const Component = () => {
  const [touch] = useState(() => window.matchMedia("(hover: none), (pointer: coarse)").matches);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [resolution, setResolution] = useState(() =>
    Math.min(window.devicePixelRatio || 1, touch ? 0.6 : 1),
  );
  const [failed, setFailed] = useState(() => !supportsWebGL2());
  const [ready, setReady] = useState(false);

  if (failed) return null;

  return (
    <div
      className="h-full w-full transition-opacity duration-[1800ms] motion-reduce:transition-none"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={resolution}
        frameloop="demand"
        gl={{ alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () => setFailed(true));
          setReady(true);
        }}
      >
        <Driver touch={touch} reduced={reduced} />
        {!reduced && (
          <FrameGuard
            onSlow={() => setResolution((value) => Math.max(MIN_RESOLUTION, value * 0.75))}
            onTooSlow={() => setFailed(true)}
          />
        )}
        <FullscreenShader reduced={reduced} />
      </Canvas>
    </div>
  );
};
