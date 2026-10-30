"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { PrismCometPhase } from "@/components/ui/prism-comet-preloader";
import { reveal } from "@/lib/intro";
import { INTRO_KEY } from "@/lib/intro-key";

const PrismCometPreloader = dynamic(() => import("@/components/ui/prism-comet-preloader"), {
  ssr: false,
});

/** Hard limit: whatever happens to the shader or timers, the site appears. */
const FAILSAFE_MS = 11000;

const PALETTE = {
  background: "#000203",
  blue: "#2456ff",
  violet: "#7b3dff",
  magenta: "#9a6bff",
  cyan: "#7fe8ff",
  gold: "#bfe9ff",
};

const subscribeNever = () => () => {};
const needsIntro = () => !document.documentElement.classList.contains("intro-seen");

function lockPage(locked: boolean) {
  document.documentElement.classList.toggle("intro-active", locked);
  const site = document.getElementById("site");
  if (site) site.inert = locked;
}

/**
 * The cinematic entry: the Prism Comet Preloader over the real, already-rendered page. It plays
 * once per tab session, and any click, key or scroll gets a visitor through it straight away.
 */
export function IntroGate() {
  const wanted = useSyncExternalStore(subscribeNever, needsIntro, () => false);
  const [finished, setFinished] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const closed = useRef(false);

  const finish = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Private modes can block storage; the intro then simply plays on the next visit too.
    }
    document.documentElement.classList.add("intro-seen");
    lockPage(false);
    reveal();
    setFinished(true);
  }, []);

  const skip = useCallback(() => {
    if (closed.current) return;
    setSkipped(true);
    reveal();
    window.setTimeout(finish, 350);
  }, [finish]);

  useEffect(() => {
    if (!wanted) {
      reveal();
      return;
    }
    // A tab opened in the background would only see the end of the show.
    if (document.hidden) {
      finish();
      return;
    }
    lockPage(true);
    const failsafe = window.setTimeout(finish, FAILSAFE_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "ArrowDown" || event.key === "PageDown") skip();
    };
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(failsafe);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", onKey);
      lockPage(false);
    };
  }, [wanted, finish, skip]);

  const onPhase = useCallback((phase: PrismCometPhase) => {
    // The hero starts as the camera passes through the portal.
    if (phase === "lift") window.setTimeout(reveal, 450);
  }, []);

  if (!wanted || finished) return null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="intro-overlay" data-skipped={skipped}>
      <PrismCometPreloader
        word="DEVCORE"
        caption="Intelligent Software. Extraordinary Experiences."
        hint="Click or scroll to enter"
        palette={PALETTE}
        durationMs={reduced ? 700 : 2300}
        igniteMs={1600}
        holdMs={reduced ? 700 : 1500}
        liftMs={1300}
        quality={window.innerWidth < 768 ? 0.45 : 0.6}
        height="100dvh"
        fontFamily="var(--font-display)"
        onPhase={onPhase}
        onComplete={finish}
      >
        <></>
      </PrismCometPreloader>
    </div>
  );
}
