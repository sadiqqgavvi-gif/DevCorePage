"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { gsap, MEDIA, SCRUB, ScrollTrigger, scrollToY, setLenis } from "@/lib/motion";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    // Smooth wheel scrolling on desktop only. Touch stays entirely native.
    if (window.matchMedia(MEDIA.pointer).matches) {
      const instance = new Lenis({ anchors: { duration: 1.6 }, autoRaf: false, lerp: 0.08, wheelMultiplier: 0.85 });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(instance);
      lenis = instance;
    }

    // Without Lenis, in-page links still need to animate and to account for section heights.
    const onClick = (event: MouseEvent) => {
      if (lenis) return;
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      scrollToY(target.getBoundingClientRect().top + window.scrollY);
      history.replaceState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    // Section headings light up letter by letter as their section arrives.
    const letters = gsap.matchMedia();
    letters.add(MEDIA.motion, () => {
      gsap.utils.toArray<HTMLElement>("[data-letters]").forEach((heading) => {
        gsap.fromTo(
          heading.querySelectorAll(".letter"),
          { opacity: 0.12 },
          {
            opacity: 1,
            duration: 0.1,
            ease: "none",
            stagger: { amount: 1 },
            scrollTrigger: {
              trigger: heading.closest("section") ?? heading,
              start: "top 80%",
              end: "top 15%",
              scrub: SCRUB,
            },
          },
        );
      });
    });

    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      letters.revert();
      document.removeEventListener("click", onClick);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
