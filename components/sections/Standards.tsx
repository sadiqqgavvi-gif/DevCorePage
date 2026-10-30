"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { STANDARDS } from "@/lib/content";
import { gsap, MEDIA, ScrollTrigger, scrollToY, useGsapMedia } from "@/lib/motion";

const COUNT = STANDARDS.length;
/** Portion of the section spent bringing the ring in and sending it away. */
const ENTER_END = 0.07;
const EXIT_START = 0.93;
/** Room kept under the front card for the readout, dots and timeline. */
const BOTTOM_ROOM = 92;
/** The cards share one full circle, so the ring really does come back around. */
const STEP = (Math.PI * 2) / COUNT;

const clamp = gsap.utils.clamp(0, 1);

export function Standards() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const trackTrigger = useRef<ScrollTrigger | null>(null);

  /** Scroll position at which a given card sits at the front of the ring. */
  const scrollToCard = (index: number) => {
    const trigger = trackTrigger.current;
    if (!trigger) return;
    const local = ENTER_END + (index / (COUNT - 1)) * (EXIT_START - ENTER_END);
    scrollToY(trigger.start + (trigger.end - trigger.start) * local);
  };

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.story, () => {
      const cards = gsap.utils.toArray<HTMLElement>(".orbit-card");
      const orbit = gsap.utils.toArray<HTMLElement>(".orbit-list, .orbit-track");
      const stage = element.querySelector<HTMLElement>(".orbit-stage");
      const state = { p: 0 };
      let radius = 0;
      let depth = 0;
      let lift = 0;
      let width = 0;
      let lastActive = 0;

      // Every distance is a multiple of the card, so a phone gets the same orbit as a desktop.
      const measure = () => {
        width = window.innerWidth;
        element.style.setProperty("--card-height", "auto");
        const cardHeight = Math.max(...cards.map((card) => card.offsetHeight));
        const cardWidth = cards[0].offsetWidth;
        element.style.setProperty("--card-height", `${cardHeight}px`);

        radius = cardWidth * 1.02;
        depth = cardWidth * 0.9;
        lift = cardHeight * 0.3;
        element.style.setProperty("--orbit-center", `${window.innerHeight - BOTTOM_ROOM - cardHeight / 2}px`);
        element.style.setProperty("--orbit-width", `${radius * 2}px`);
        if (stage) stage.style.perspective = `${cardWidth * 3.5}px`;
      };

      const render = () => {
        const { p } = state;
        const enter = clamp(p / ENTER_END);
        const exit = clamp((p - EXIT_START) / (1 - EXIT_START));
        const turn = clamp((p - ENTER_END) / (EXIT_START - ENTER_END));

        // Each card rests at the front for part of its range, so nothing is read mid-flight.
        const raw = turn * (COUNT - 1);
        const whole = Math.min(COUNT - 2, Math.floor(raw));
        const part = clamp((raw - whole - 0.2) / 0.6);
        const settled = whole + part * part * (3 - 2 * part);

        // The ring sweeps in from the right and leaves to the left.
        gsap.set(orbit, {
          x:
            (1 - gsap.parseEase("power3.out")(enter)) * width * 0.5 -
            gsap.parseEase("power2.in")(exit) * width * 0.6,
          opacity: Math.min(enter * 1.8, 1 - exit),
        });

        cards.forEach((card, index) => {
          const angle = (index - settled) * STEP;
          const front = Math.cos(angle);
          gsap.set(card, {
            x: Math.sin(angle) * radius,
            y: (1 - front) * -lift,
            z: (front - 1) * depth,
            rotationY: Math.sin(angle) * -28,
            // Sideways still reads as a neighbour. Round the back the card is gone.
            opacity: front >= 0 ? 0.72 + front * 0.28 : clamp(0.72 + front * 1.1),
            zIndex: Math.round((front + 1) * 50),
            "--f": clamp((front - 0.5) * 2),
          });
        });

        const next = Math.round(settled);
        if (next !== lastActive) {
          lastActive = next;
          setActive(next);
        }
      };

      measure();
      render();
      const tween = gsap.to(state, {
        p: 1,
        ease: "none",
        onUpdate: render,
        scrollTrigger: {
          trigger: element,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onRefresh: () => {
            measure();
            render();
          },
        },
      });
      trackTrigger.current = tween.scrollTrigger ?? null;

      return () => {
        trackTrigger.current = null;
        ["--card-height", "--orbit-center", "--orbit-width"].forEach((name) =>
          element.style.removeProperty(name),
        );
        if (stage) stage.style.removeProperty("perspective");
      };
    });
  });

  return (
    <section id="standards" ref={root} aria-labelledby="standards-title" className="track track-standards">
      <div className="pin py-20">
        <header className="shell standards-head">
          <h2 id="standards-title" className="eyebrow">
            in every build
          </h2>
        </header>

        <div className="orbit-stage">
          <span aria-hidden className="orbit-track" />
          <ul className="orbit-list" style={{ listStyle: "none" }}>
            {STANDARDS.map((standard, index) => (
              <li key={standard.title} className="orbit-card">
                <article className="orbit-card-body">
                  <p className="orbit-part-1 label text-cyan">
                    0{index + 1} · {standard.eyebrow}
                  </p>
                  <h3 className="orbit-part-1 display-md">{standard.title}</h3>
                  <p className="orbit-part-2 text-[0.9375rem] leading-relaxed text-muted">{standard.body}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>

        <div className="services-nav absolute bottom-2 left-1/2 z-10 -translate-x-1/2 flex-col items-center">
          <p className="label whitespace-nowrap text-paper">
            <span className="text-cyan">0{active + 1}</span> / 0{COUNT}
          </p>
          <nav aria-label="Choose a standard" className="flex items-center">
            {STANDARDS.map((standard, index) => (
              <button
                key={standard.title}
                type="button"
                onClick={() => scrollToCard(index)}
                aria-label={standard.title}
                aria-current={active === index ? "true" : undefined}
                className="relative grid size-11 place-items-center rounded-full lg:size-8"
              >
                {active === index && (
                  <motion.span
                    layoutId="standards-dot"
                    className="absolute inset-[0.65rem] rounded-full border border-cyan lg:inset-1.5"
                    transition={{ type: "spring", stiffness: 340, damping: 30 }}
                  />
                )}
                <span className={`size-1.5 rounded-full ${active === index ? "bg-cyan" : "bg-white/40"}`} />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
