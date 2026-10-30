"use client";

import { useRef, type CSSProperties } from "react";
import { MagneticLink } from "@/components/ui/MagneticLink";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";
import { SHOWCASE, SHOWCASE_INTRO_CARDS } from "@/lib/content";
import { gsap, MEDIA, SCRUB, useGsapMedia } from "@/lib/motion";

function GlassCards({ cards }: { cards: readonly { title: string; text: string }[] }) {
  return (
    <ul className="show-cards" style={{ listStyle: "none" }}>
      {cards.map((card) => (
        <li key={card.title} className="show-card">
          <p className="font-display text-base font-medium leading-snug sm:text-lg">{card.title}</p>
          <p className="show-card-text mt-1 text-sm leading-snug text-paper/85">{card.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function Showcase() {
  const root = useRef<HTMLElement>(null);

  useGsapMedia(root, (mm, element) => {
    // One scene at a time over the sculpture, each handing over to the next as the page scrolls.
    mm.add(MEDIA.story, () => {
      const panels = gsap.utils.toArray<HTMLElement>(".show-panel");
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: SCRUB },
      });

      panels.forEach((panel, index) => {
        const stack = panel.querySelector(".show-cards");
        const cards = panel.querySelectorAll(".show-card");
        const copy = panel.querySelectorAll(".show-copy > *");

        // The cards keep drifting for the panel's whole life, not only while it enters.
        timeline.fromTo(stack, { y: 36 }, { y: -36, duration: 2 }, Math.max(0, index - 0.5));

        if (index > 0) {
          timeline.to(panels[index - 1], { autoAlpha: 0, duration: 0.3, ease: "sine.inOut" }, index - 0.5);
          timeline.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, index - 0.28);
          timeline.fromTo(
            copy,
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "sine.out" },
            index - 0.28,
          );
          timeline.fromTo(
            cards,
            { y: 56, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.34, stagger: 0.07, ease: "sine.out" },
            index - 0.26,
          );
        }
      });
      timeline.to({}, { duration: 0.4 }, panels.length - 0.5);

      // The section opens from an inset window as it arrives.
      gsap.fromTo(
        ".show-pin",
        { clipPath: "inset(10% 7% 10% 7% round 10px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: { trigger: element, start: "top 90%", end: "top top", scrub: SCRUB },
        },
      );
    });

    mm.add(MEDIA.flat, () => {
      gsap.utils.toArray<HTMLElement>(".show-panel").forEach((panel) => {
        gsap.from(panel.querySelectorAll(".show-copy > *"), {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: panel, start: "top 75%", once: true },
        });
      });
    });
  });

  return (
    <section id="showcase" ref={root} aria-labelledby="showcase-title" className="track track-showcase bg-ink-950">
      <h2 id="showcase-title" className="sr-only">
        Inside the build
      </h2>
      <div className="pin show-pin">
        <div aria-hidden className="show-sculpture">
          {/* The shader tints the metal by page colour / image colour, so it keeps the image's own
              #111110 to stay true. The section itself is painted in the site's ink through --sh-bg.
              Density and resolution are held down: this runs behind everything for the whole section. */}
          <SculptureHero
            fill
            scrollTrack={root}
            height="100%"
            style={{ "--sh-bg": "#000203" } as CSSProperties}
            theme="dark"
            darkBackground="#111110"
            showCredit={false}
            loadFonts={false}
            backdropText=""
            particleDensity={0.55}
            dotSize={1.2}
            maxDpr={1.25}
            radius={320}
            strength={0.75}
            particleSpread={0.75}
            turbulence={0.7}
            liquid={1.3}
          />
        </div>
        <div aria-hidden className="show-shade" />

        <article className="show-panel" aria-labelledby="show-craft">
          <GlassCards cards={SHOWCASE_INTRO_CARDS} />
          <div className="show-copy shell">
            <p className="label">built to last</p>
            <h3 id="show-craft" className="display-lg mt-3">
              Built to bend. <span className="accent-text">Made to hold.</span>
            </h3>
            <p className="lede mt-3 max-w-xl text-paper/85">
              Requirements shift, traffic spikes and teams change. We engineer software that takes
              the disturbance and settles back into shape.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <MagneticLink href="#contact">Start a project</MagneticLink>
              <MagneticLink href="#work" variant="ghost">
                See our work
              </MagneticLink>
            </div>
          </div>
        </article>

        {SHOWCASE.map((scene, index) => (
          <article key={scene.id} className="show-panel" aria-labelledby={`show-${scene.id}`}>
            <GlassCards cards={scene.cards} />
            <div className="show-copy shell">
              <p className="label">
                0{index + 1} / 0{SHOWCASE.length} · inside the build · illustrative
              </p>
              <h3 id={`show-${scene.id}`} className="display-lg mt-3">
                {scene.title}
              </h3>
              <p className="lede mt-3 max-w-xl text-paper/85">{scene.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
