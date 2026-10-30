"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { SplitWords } from "@/components/ui/SplitWords";
import { onReveal } from "@/lib/intro";
import { gsap, MEDIA, SCRUB, useGsapMedia } from "@/lib/motion";

const StarshipShader = dynamic(
  () => import("@/components/ui/starship-shader").then((module) => module.Component),
  { ssr: false },
);

/** Long enough for the headline's entrance to finish before the shader compiles. */
const STARSHIP_DELAY = 1200;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [showStarship, setShowStarship] = useState(false);

  useEffect(() => {
    let timer = 0;
    const cancel = onReveal(() => {
      timer = window.setTimeout(() => setShowStarship(true), STARSHIP_DELAY);
    });
    return () => {
      cancel();
      window.clearTimeout(timer);
    };
  }, []);

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.motion, () => {
      const intro = gsap.timeline({ paused: true });
      intro
        .fromTo(
          ".hero-word",
          { yPercent: 115, rotate: 4 },
          { yPercent: 0, y: 0, rotate: 0, duration: 1.3, ease: "expo.out", stagger: 0.085 },
          0,
        )
        .fromTo(
          ".hero-geo",
          { scale: 0.86, opacity: 0 },
          { scale: 1, opacity: 1, duration: 2, ease: "power2.out" },
          0,
        )
        .fromTo(
          "[data-hero-fade]",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.95, ease: "power3.out", stagger: 0.09 },
          0.5,
        );
      // GSAP holds the entrance state from here, so the pre-paint CSS can step aside.
      document.documentElement.classList.add("hero-in");
      return onReveal(() => intro.play());
    });

    // Layers leave at different speeds and in different directions as the sphere swells behind them.
    mm.add(MEDIA.story, () => {
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: SCRUB },
        })
        .to(".hero-title .sw-line:nth-child(1)", { xPercent: -14, yPercent: -18, duration: 0.7 }, 0)
        .to(".hero-title .sw-line:nth-child(2)", { xPercent: 14, yPercent: 10, duration: 0.7 }, 0)
        .to(".hero-title", { opacity: 0, duration: 0.42 }, 0.28)
        .to(".hero-label", { y: -40, opacity: 0, duration: 0.25 }, 0)
        .to(".hero-support", { y: -70, opacity: 0, duration: 0.4 }, 0)
        .to(".hero-scrim", { opacity: 0, duration: 0.5 }, 0.1)
        .to(".hero-geo-layer", { rotation: 48, scale: 1.9, opacity: 0, duration: 0.9 }, 0)
        .to(".hero-starship", { opacity: 0, duration: 0.9 }, 0);
    });
  });

  return (
    <section id="top" ref={root} aria-labelledby="hero-title" data-swarm className="track track-hero">
      <div className="pin hero-pin">
        <div aria-hidden className="hero-starship">
          {showStarship && <StarshipShader />}
        </div>
        <div aria-hidden className="hero-geo-layer">
          <svg viewBox="-500 -500 1000 1000" className="hero-geo" fill="none">
            <ellipse rx="470" ry="150" transform="rotate(-18)" stroke="#5fe3ff" strokeOpacity=".26" />
            <ellipse rx="430" ry="240" transform="rotate(32)" stroke="#9a7bff" strokeOpacity=".24" />
            <ellipse rx="490" ry="330" transform="rotate(-58)" stroke="#fff" strokeOpacity=".09" />
            <circle cx="447" cy="-145" r="4" fill="#5fe3ff" />
            <circle cx="-300" cy="-310" r="3" fill="#9a7bff" />
            <circle cx="210" cy="400" r="3" fill="#fff" fillOpacity=".7" />
          </svg>
        </div>
        <div aria-hidden className="hero-scrim" />

        <div className="shell relative flex h-full min-h-svh flex-col items-center justify-center pb-[max(3rem,6svh)] pt-20 text-center">
          <p data-hero-fade className="hero-label label mb-4 [@media(max-height:620px)]:hidden">
            software engineering &amp; ai agency
          </p>
          <h1 id="hero-title" className="hero-title display-hero">
            <SplitWords
              lines={["We Engineer", "What's Next."]}
              accent={["What's", "Next."]}
              wordClassName="hero-word"
            />
          </h1>
          <div className="hero-support flex w-full flex-col items-center">
            <p data-hero-fade className="lede mt-5 max-w-[37rem] text-paper/85 lg:mt-7">
              We design and build intelligent software, AI-powered products, and digital experiences
              that move businesses forward.
            </p>
            <div data-hero-fade className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:mt-8">
              <MagneticLink href="#work">See our work</MagneticLink>
              <MagneticLink href="#contact" variant="ghost">
                Contact us
              </MagneticLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
