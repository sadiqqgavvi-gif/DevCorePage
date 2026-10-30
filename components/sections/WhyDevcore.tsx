"use client";

import { useRef } from "react";
import { PRINCIPLES, WHY_STATEMENT } from "@/lib/content";
import { gsap, MEDIA, SCRUB, useGsapMedia } from "@/lib/motion";

export function WhyDevcore() {
  const root = useRef<HTMLElement>(null);

  useGsapMedia(root, (mm, element) => {
    // The statement lights up word by word, with the scroll position as the pen.
    mm.add(MEDIA.story, () => {
      gsap.fromTo(
        ".why-word",
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: {
            trigger: element.querySelector(".track-why"),
            start: "top top",
            end: "bottom bottom",
            scrub: SCRUB,
          },
        },
      );
    });

    // Principles arrive from alternating sides, each drawing its own rule.
    mm.add(MEDIA.motion, () => {
      gsap.utils.toArray<HTMLElement>(".why-row").forEach((row, index) => {
        const side = index % 2 ? 1 : -1;
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: row, start: "top 100%", end: "top 40%", scrub: SCRUB },
        });
        timeline
          .fromTo(row.querySelector(".why-rule"), { scaleX: 0 }, { scaleX: 1 }, 0)
          .fromTo(row.querySelector(".why-title"), { x: side * 36, opacity: 0 }, { x: 0, opacity: 1 }, 0)
          .fromTo(row.querySelector(".why-text"), { x: side * -20, opacity: 0 }, { x: 0, opacity: 1 }, 0.15);
      });
    });
  });

  return (
    <section id="why" ref={root} aria-labelledby="why-title" className="relative">
      <div className="track track-why">
        <div className="pin flex flex-col justify-center py-24">
          <div className="shell">
            <p className="eyebrow mb-5">why devcore</p>
            <h2 id="why-title" className="display-lg max-w-[20ch]">
              {WHY_STATEMENT.split(" ").map((word, index) => (
                <span key={`${word}-${index}`}>
                  <span className="why-word">{word}</span>{" "}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </div>

      <ul className="shell pb-16 lg:pb-24" style={{ listStyle: "none" }}>
        {PRINCIPLES.map((principle) => (
          <li key={principle.title} className="why-row relative grid gap-3 py-8 md:grid-cols-2 md:gap-12 lg:py-12">
            <span aria-hidden className="why-rule absolute inset-x-0 top-0 h-px origin-left bg-white/20" />
            <h3 className="why-title display-md">{principle.title}</h3>
            <p className="why-text lede">{principle.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
