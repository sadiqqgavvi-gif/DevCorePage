"use client";

import { useRef, useState } from "react";
import { Letters } from "@/components/ui/Letters";
import { PROCESS } from "@/lib/content";
import { gsap, MEDIA, revealOnScroll, useGsapMedia } from "@/lib/motion";

export function Process() {
  const root = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useGsapMedia(root, (mm, element) => {
    // Vertical scrolling drives the track sideways. Nothing here captures touch, so it can't trap.
    mm.add(MEDIA.story, () => {
      const track = element.querySelector<HTMLElement>(".process-track")!;
      const steps = gsap.utils.toArray<HTMLElement>(".process-step");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      let last = 0;

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: element,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const next = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
              if (next !== last) {
                last = next;
                setActiveStep(next);
              }
            },
          },
        })
        .fromTo(track, { x: 0 }, { x: () => -distance(), duration: 1 }, 0)
        .fromTo(".process-line", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
        .fromTo(".process-ghost", { xPercent: 4 }, { xPercent: -34, duration: 1 }, 0);

      gsap.fromTo(
        ".process-head",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 90%", end: "top 20%", scrub: true },
        },
      );
    });

    // The whole timeline is on show here, so no single step is "current".
    mm.add(MEDIA.still, () => {
      setActiveStep(-1);
      return () => setActiveStep(0);
    });

    mm.add(MEDIA.flat, () => {
      revealOnScroll(element.querySelector(".process-head")!);
      gsap.utils.toArray<HTMLElement>(".process-step").forEach((step) => {
        gsap.from(step.querySelectorAll("[data-step-text]"), {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 88%", once: true },
        });
      });
    });
  });

  return (
    <section id="process" ref={root} aria-labelledby="process-title" className="track track-process">
      <div className="pin flex flex-col justify-center gap-[clamp(2rem,7svh,4.5rem)] py-20">
        <p aria-hidden className="process-ghost">
          Discover → Design → Engineer → Launch → Scale
        </p>
        <header className="process-head shell">
          <p data-reveal className="eyebrow mb-2 lg:mb-4">
            how we work
          </p>
          <h2 id="process-title" data-reveal data-letters className="display-md max-w-[20ch]">
            <Letters text="From first question to lasting system." />
          </h2>
        </header>

        <div className="process-track relative shell">
          <div aria-hidden className="process-rail">
            <div className="process-line" />
          </div>
          <ol className="contents" style={{ listStyle: "none" }}>
            {PROCESS.map((step, index) => {
              const state =
                activeStep < 0
                  ? "done"
                  : index === activeStep
                    ? "active"
                    : index < activeStep
                      ? "done"
                      : "upcoming";
              return (
                <li
                  key={step.id}
                  data-state={state}
                  aria-current={state === "active" ? "step" : undefined}
                  className="process-step"
                >
                  <span aria-hidden className="process-dot" />
                  <div className="process-copy">
                    <p data-step-text className="label text-cyan">
                      0{index + 1} / 0{PROCESS.length}
                    </p>
                    <h3 data-step-text className="display-lg mt-2">
                      {step.title}
                    </h3>
                    <p data-step-text className="lede mt-3 max-w-md">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
