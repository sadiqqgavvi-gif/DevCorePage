"use client";

import { useRef } from "react";
import DitherHelixCarousel from "@/components/ui/dither-helix-carousel";
import { Letters } from "@/components/ui/Letters";
import { SHOWCASE, WORK } from "@/lib/content";
import { gsap, MEDIA, revealOnScroll, useGsapMedia } from "@/lib/motion";

// The helix wraps around, and with too few cards the wrap shows inside the frame.
const CARDS = [
  ...WORK,
  ...SHOWCASE.map((scene) => ({
    image: scene.back,
    eyebrow: "illustrative scene · inside the build",
    title: scene.title,
    caption: scene.text,
    alt: "",
  })),
];

export function SelectedWork() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.motion, () => {
      revealOnScroll(element.querySelector(".work-head")!);
      // The heading slides sideways out of the way as the frame takes over.
      gsap.to(".work-head-inner", {
        xPercent: -8,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: ".work-frame", start: "top 70%", end: "top 8%", scrub: true },
      });
      // The frame opens from an inset panel to full-bleed as it arrives.
      gsap.fromTo(
        ".work-pin",
        { clipPath: "inset(7% 5% 7% 5% round 8px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: { trigger: ".work-frame", start: "top 92%", end: "top 12%", scrub: true },
        },
      );
    });
  });

  return (
    <section
      id="work"
      ref={root}
      aria-labelledby="work-title"
      className="relative bg-gradient-to-b from-transparent to-ink-950 to-40%"
    >
      <header className="work-head work-head-inner shell grid gap-5 pb-14 pt-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:pb-20 lg:pt-36">
        <div>
          <p data-reveal className="eyebrow mb-4">
            selected work
          </p>
          <h2 id="work-title" data-reveal data-letters className="display-lg max-w-[15ch]">
            <Letters text="The kind of work we take on." />
          </h2>
        </div>
        <p data-reveal className="lede max-w-lg">
          These are illustrative sample projects, written to show the range of problems we like to
          solve. None of them represent a client engagement.
        </p>
      </header>

      <div
        ref={frame}
        className="work-frame track track-work"
        style={{ "--work-cards": CARDS.length } as React.CSSProperties}
      >
        <div className="pin work-pin">
          <DitherHelixCarousel
            items={CARDS}
            aria-label="Illustrative project concepts"
            scrollTrack={frame}
          />
        </div>
      </div>
    </section>
  );
}
