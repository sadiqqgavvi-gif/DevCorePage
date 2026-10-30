"use client";

import { useRef } from "react";
import { Letters } from "@/components/ui/Letters";
import { MANIFESTO } from "@/lib/content";
import { gsap, MEDIA, useGsapMedia } from "@/lib/motion";

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGsapMedia(root, (mm, element) => {
    // One statement at a time over the stage, lit letter by letter with the scroll position.
    mm.add(MEDIA.story, () => {
      const statements = gsap.utils.toArray<HTMLElement>(".mf-statement", element);
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: 0.4 },
      });

      statements.forEach((statement, index) => {
        const at = index * 1.5;
        if (index > 0) timeline.fromTo(statement, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, at);
        timeline.fromTo(
          statement.querySelectorAll(".letter"),
          { opacity: 0.12 },
          { opacity: 1, duration: 0.04, stagger: { amount: 0.95 } },
          at,
        );
        if (index < statements.length - 1) {
          timeline.to(statement, { autoAlpha: 0, y: -28, duration: 0.25 }, at + 1.25);
        }
      });
    });
  });

  return (
    <section id="manifesto" ref={root} aria-label="What Devcore believes" className="track track-manifesto">
      <div className="pin mf-pin">
        <div className="shell">
          {MANIFESTO.map((statement) => (
            <p key={statement} className="mf-statement display-md">
              <Letters text={statement} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
