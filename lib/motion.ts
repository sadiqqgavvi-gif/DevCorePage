"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

/**
 * `story` is the sticky, scroll-choreographed layout on every device, driven by native scrolling.
 * `flat` covers reduced motion and landscape phones. Keep both in sync with globals.css.
 */
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  story: "(prefers-reduced-motion: no-preference) and (min-height: 481px)",
  flat: "(prefers-reduced-motion: no-preference) and (max-height: 480px)",
  still: "(prefers-reduced-motion: reduce), (max-height: 480px)",
  pointer: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

/**
 * Runs GSAP setup in a matchMedia context scoped to `scope`, so selectors stay
 * local and every tween and ScrollTrigger is reverted on unmount or breakpoint change.
 */
export function useGsapMedia(
  scope: RefObject<HTMLElement | null>,
  setup: (mm: gsap.MatchMedia, root: HTMLElement) => void,
) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);
    setup(mm, root);
    return () => mm.revert();
    // Setup runs once per mount; matchMedia handles later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
}

/** Staggered entrance for `[data-reveal]` children. Call inside a matchMedia handler. */
export function revealOnScroll(trigger: Element, selector = "[data-reveal]") {
  const items = gsap.utils.toArray<HTMLElement>(selector, trigger);
  if (!items.length) return;
  gsap.from(items, {
    y: 28,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger: 0.08,
    scrollTrigger: { trigger, start: "top 80%", once: true },
  });
}

let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}

/** Scrolls through Lenis where it runs (desktop), otherwise natively (touch and reduced motion). */
export function scrollToY(y: number) {
  if (lenisInstance) {
    lenisInstance.scrollTo(y, { duration: 1 });
  } else {
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
  }
}
