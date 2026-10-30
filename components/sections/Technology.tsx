"use client";

import { useRef } from "react";
import { Letters } from "@/components/ui/Letters";
import { CAPABILITIES } from "@/lib/content";
import { gsap, MEDIA, SCRUB, revealOnScroll, useGsapMedia } from "@/lib/motion";

/** Where a chapter's four technologies sit around the core, as shares of the map's half-size. */
const SPOTS = [
  [-0.72, -0.78],
  [0.76, -0.62],
  [-0.84, 0.56],
  [0.7, 0.8],
] as const;

export function Technology() {
  const root = useRef<HTMLElement>(null);

  useGsapMedia(root, (mm, element) => {
    // Chapters slide through while their technologies connect to the core on the stage behind them.
    mm.add(MEDIA.story, () => {
      const blocks = gsap.utils.toArray<HTMLElement>(".tech-block");
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: SCRUB + 0.3 },
      });
      gsap.set(blocks.slice(1), { autoAlpha: 0 });

      blocks.forEach((block, index) => {
        const lines = element.querySelectorAll(`.tech-lines [data-chapter="${index}"]`);
        const chips = element.querySelectorAll(`.tech-chip[data-chapter="${index}"]`);

        // Arriving and leaving each take about a third of a chapter's scroll, with short
        // distances and no overshoot, so one capability eases into the next.
        timeline.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.04, ease: "sine.inOut" }, index + 0.02);
        timeline.fromTo(
          chips,
          { autoAlpha: 0, scale: 0.9 },
          { autoAlpha: 1, scale: 1, duration: 0.26, stagger: 0.04, ease: "sine.out" },
          index + 0.08,
        );
        // Layered parallax: the chips keep drifting at a different speed from the lines.
        timeline.fromTo(chips, { y: 14 }, { y: -14, duration: 1 }, index);

        if (index > 0) {
          timeline.fromTo(
            block.children,
            { x: 28, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: "sine.out" },
            index + 0.02,
          );
          timeline.set(block, { autoAlpha: 1 }, index);
        }
        if (index < blocks.length - 1) {
          timeline.to(block.children, { x: -28, opacity: 0, duration: 0.26, stagger: 0.02, ease: "sine.in" }, index + 0.68);
          timeline.to(chips, { autoAlpha: 0, duration: 0.24, ease: "sine.in" }, index + 0.74);
          timeline.to(lines, { strokeDashoffset: -1, duration: 0.24, ease: "sine.inOut" }, index + 0.74);
          timeline.set(block, { autoAlpha: 0 }, index + 1);
        }
      });
      // The last chapter rests before the section releases.
      timeline.to({}, { duration: 0.7 }, blocks.length - 1 + 0.3);

      gsap.fromTo(
        ".tech-head-inner",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 90%", end: "top 20%", scrub: SCRUB },
        },
      );
    });

    mm.add(MEDIA.flat, () => {
      revealOnScroll(element.querySelector(".tech-head")!);
      gsap.utils.toArray<HTMLElement>(".tech-block").forEach((block) => {
        gsap.from(block.children, {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: block, start: "top 88%", once: true },
        });
      });
    });
  });

  return (
    <section id="technology" ref={root} aria-labelledby="technology-title" className="track track-tech">
      <div className="pin py-20">
        <div aria-hidden className="tech-map">
          <svg className="tech-lines" viewBox="-100 -100 200 200" preserveAspectRatio="none" fill="none">
            {CAPABILITIES.map((capability, chapter) =>
              SPOTS.map(([x, y]) => (
                <line
                  key={`${capability.id}-${x}`}
                  data-chapter={chapter}
                  x2={x * 100}
                  y2={y * 100}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              )),
            )}
          </svg>
          {CAPABILITIES.map((capability, chapter) =>
            capability.stack.map((tool, spot) => (
              <span
                key={tool}
                data-chapter={chapter}
                className="tech-chip"
                style={{
                  left: `${50 + SPOTS[spot][0] * 50}%`,
                  top: `${50 + SPOTS[spot][1] * 50}%`,
                }}
              >
                {tool}
              </span>
            )),
          )}
        </div>

        <header className="tech-head">
          <div className="tech-head-inner shell">
            <p data-reveal className="eyebrow mb-2 lg:mb-4">
              capabilities
            </p>
            <h2 id="technology-title" data-reveal data-letters className="display-md max-w-[16ch]">
              <Letters text="Four layers, one working system." />
            </h2>
          </div>
        </header>

        <ol className="tech-blocks shell mt-10 flex flex-col gap-12" style={{ listStyle: "none" }}>
          {CAPABILITIES.map((capability, index) => (
            <li key={capability.id} className="tech-block">
              <p className="label text-cyan">
                0{index + 1} / 0{CAPABILITIES.length}
              </p>
              <h3 className="display-lg mt-2">{capability.title}</h3>
              <p className="lede mt-3 max-w-xl text-paper/85">{capability.summary}</p>
              <ul className="tech-stack mt-4 flex flex-wrap gap-2" aria-label={`${capability.title} tools`}>
                {capability.stack.map((tool) => (
                  <li key={tool} className="tag">
                    {tool}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
