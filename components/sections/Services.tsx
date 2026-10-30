"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Letters } from "@/components/ui/Letters";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { mailto, SERVICES, type Service } from "@/lib/content";
import { gsap, MEDIA, SCRUB, ScrollTrigger, scrollToY, useGsapMedia } from "@/lib/motion";

const COUNT = SERVICES.length;
/** Portion of the section spent bringing the track in and sending it away. */
const ENTER_END = 0.07;
const EXIT_START = 0.93;
/** Room kept under the front card for the readout, dots and timeline. */
const BOTTOM_ROOM = 92;

const clamp = gsap.utils.clamp(0, 1);

export function Services() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const trackTrigger = useRef<ScrollTrigger | null>(null);

  /** Scroll position at which a given card sits in the centre of the track. */
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
      const state = { p: 0 };
      let spacing = 0;
      let arc = 0;
      let width = 0;
      let lastActive = 0;

      const measure = () => {
        width = window.innerWidth;
        const height = window.innerHeight;
        element.style.setProperty("--card-height", "auto");
        const cardHeight = Math.max(...cards.map((card) => card.offsetHeight));
        const cardWidth = cards[0].offsetWidth;
        element.style.setProperty("--card-height", `${cardHeight}px`);

        // Neighbours stay in view on every screen: alongside on desktop, peeking in on phones.
        spacing = cardWidth * (width < 720 ? 0.97 : 1.07);
        arc = height * (width < 720 ? 0.012 : 0.03);
        const center = height - BOTTOM_ROOM - cardHeight / 2;
        element.style.setProperty("--orbit-center", `${center}px`);
        element.style.setProperty("--orbit-width", `${spacing * 2.6}px`);
      };

      const render = () => {
        const { p } = state;
        const enter = clamp(p / ENTER_END);
        const exit = clamp((p - EXIT_START) / (1 - EXIT_START));
        const turn = clamp((p - ENTER_END) / (EXIT_START - ENTER_END));

        // Each card rests in the centre for part of its range, so nothing is read mid-flight.
        const raw = turn * (COUNT - 1);
        const whole = Math.min(COUNT - 2, Math.floor(raw));
        const part = clamp((raw - whole - 0.2) / 0.6);
        const settled = whole + part * part * (3 - 2 * part);

        // The track sweeps in from the right and leaves to the left.
        gsap.set(orbit, {
          x:
            (1 - gsap.parseEase("power3.out")(enter)) * width * 0.5 -
            gsap.parseEase("power2.in")(exit) * width * 0.6,
          // Opacity, not autoAlpha: hidden links could not receive keyboard focus.
          opacity: Math.min(enter * 1.8, 1 - exit),
        });

        cards.forEach((card, index) => {
          const offset = index - settled;
          const distance = Math.abs(offset);
          const near = clamp(distance);
          gsap.set(card, {
            x: offset * spacing,
            y: distance * distance * arc,
            z: -Math.min(distance, 3) * 150,
            rotationY: gsap.utils.clamp(-2, 2, offset) * -11,
            scale: 1 - Math.min(distance, 2) * 0.035,
            opacity: distance <= 1 ? 1 - near * 0.14 : clamp(0.86 - (distance - 1) * 0.46),
            zIndex: 100 - Math.round(distance * 10),
            pointerEvents: distance < 1.5 ? "auto" : "none",
            "--f": 1 - near,
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
          scrub: SCRUB,
          onRefresh: () => {
            measure();
            render();
          },
        },
      });
      trackTrigger.current = tween.scrollTrigger ?? null;

      gsap.fromTo(
        ".services-head-inner",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 90%", end: "top 15%", scrub: SCRUB },
        },
      );

      return () => {
        trackTrigger.current = null;
        ["--card-height", "--orbit-center", "--orbit-width"].forEach((name) =>
          element.style.removeProperty(name),
        );
      };
    });
  });

  return (
    <section id="services" ref={root} aria-labelledby="services-title" className="track track-services">
      <div className="pin py-20">
        <div className="services-head">
          <div className="services-head-inner shell text-center">
            <h2 id="services-title" data-letters className="services-title">
              <Letters text="Six disciplines." />{" "}
              <span className="max-sm:block">
                <Letters text="One engineering core." />
              </span>
            </h2>
          </div>
        </div>

        <div className="orbit-stage">
          <span aria-hidden className="orbit-track" />
          <ul className="orbit-list" style={{ listStyle: "none" }}>
            {SERVICES.map((service, index) => (
              <li key={service.id} className="orbit-card" onFocusCapture={() => scrollToCard(index)}>
                <ServiceCard service={service} index={index} />
              </li>
            ))}
          </ul>
        </div>

        <div className="services-nav absolute bottom-2 left-1/2 z-10 -translate-x-1/2 flex-col items-center">
          <p className="label whitespace-nowrap text-paper">
            <span className="text-cyan">0{active + 1}</span> / 0{COUNT}
          </p>
          <nav aria-label="Choose a service" className="flex items-center">
            {SERVICES.map((service, index) => (
              <button
                key={service.id}
                type="button"
                onClick={() => scrollToCard(index)}
                aria-label={service.title}
                aria-current={active === index ? "true" : undefined}
                className="relative grid size-11 place-items-center rounded-full lg:size-8"
              >
                {active === index && (
                  <motion.span
                    layoutId="orbit-dot"
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

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <article className="orbit-card-body">
      <div className="orbit-part-1 flex items-start justify-between">
        <ServiceIcon name={service.icon} />
        <span aria-hidden className="font-mono text-xs text-faint">
          0{index + 1} / 0{COUNT}
        </span>
      </div>
      <h3 className="orbit-part-1 font-display text-xl font-semibold leading-tight tracking-tight [font-stretch:110%]">
        {service.title}
      </h3>
      <p className="orbit-part-2 text-[0.9375rem] leading-relaxed text-muted">{service.description}</p>
      <div className="orbit-part-3 mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
        <ul className="flex flex-wrap gap-1.5" aria-label={`${service.title} focus areas`}>
          {service.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
        <motion.a
          href={mailto(`${service.title} enquiry`)}
          className="inline-flex min-h-11 items-center text-sm text-paper underline decoration-white/30 underline-offset-4 hover:decoration-cyan"
          aria-label={`Enquire about ${service.title}`}
          whileHover={{ x: 3 }}
        >
          Enquire →
        </motion.a>
      </div>
    </article>
  );
}
