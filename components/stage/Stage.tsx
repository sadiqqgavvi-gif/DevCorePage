"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { CoreVisual } from "@/components/ui/CoreVisual";
import { startStage } from "@/lib/stage";

const StageScene = dynamic(() => import("@/components/three/StageScene"), { ssr: false });

const SKIES = [0, 1, 2, 3, 4];

let webglSupport: boolean | null = null;

function detectWebGL() {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupport = Boolean(context);
      // Browsers cap live contexts, so release the probe straight away.
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const subscribeNever = () => () => {};

/** The one fixed stage behind the whole page: sky layers, the 3D object or its CSS stand-in, and grain. */
export function Stage() {
  const skyRefs = useRef<HTMLDivElement[]>([]);
  const coreRef = useRef<HTMLDivElement>(null);
  const webgl = useSyncExternalStore(subscribeNever, detectWebGL, () => false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const useScene = webgl && !failed;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (coreRef.current) coreRef.current.style.transform = "translate3d(0, -25svh, 0) scale(3)";
      return;
    }
    return startStage(skyRefs.current, coreRef.current);
  }, []);

  return (
    <div aria-hidden className="stage">
      {SKIES.map((index) => (
        <div
          key={index}
          ref={(element) => {
            if (element) skyRefs.current[index] = element;
          }}
          className={`stage-sky stage-sky-${index}`}
        />
      ))}
      <div ref={coreRef} className="stage-core" data-hidden={useScene && ready}>
        <CoreVisual />
      </div>
      {useScene && (
        <div className="stage-scene" data-ready={ready}>
          <StageScene onReady={() => setReady(true)} onLost={() => setFailed(true)} />
        </div>
      )}
      <div className="stage-grain" />
    </div>
  );
}
