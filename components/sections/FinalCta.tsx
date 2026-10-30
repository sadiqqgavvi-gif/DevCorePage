"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { SplitWords } from "@/components/ui/SplitWords";
import { mailto, SITE } from "@/lib/content";
import { gsap, MEDIA, SCRUB, useGsapMedia } from "@/lib/motion";

export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.motion, () => {
      gsap.fromTo(
        ".horizon",
        { yPercent: 12 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: element, start: "top bottom", end: "top top", scrub: SCRUB },
        },
      );
      gsap.from(".cta-word", {
        yPercent: 112,
        rotate: 3,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: element, start: "top 60%", once: true },
      });
      gsap.from("[data-cta-fade]", {
        y: 20,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.35,
        scrollTrigger: { trigger: element, start: "top 60%", once: true },
      });
    });
  });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  return (
    <section
      id="contact"
      ref={root}
      aria-labelledby="contact-title"
      data-swarm
      className="relative isolate overflow-hidden"
    >
      <div aria-hidden className="horizon -z-10" />

      <div className="shell flex min-h-svh flex-col items-center justify-end pb-44 pt-[46svh] text-center portrait:pt-[38svh]">
        <p data-cta-fade className="label mb-4">
          start a conversation
        </p>
        <h2 id="contact-title" className="display-lg">
          <SplitWords
            lines={["Let's Build Something", "Extraordinary."]}
            accent={["Extraordinary."]}
            wordClassName="cta-word"
          />
        </h2>
        <p data-cta-fade className="lede mt-5 max-w-xl">
          Tell us what you are building, where it is stuck, or what you would like to exist. A few
          lines are enough to get started.
        </p>
        <div data-cta-fade className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <MagneticLink href={mailto("New project enquiry")}>Start a project</MagneticLink>
          <button type="button" onClick={copyEmail} className="pill pill-ghost">
            <span className="font-mono text-sm normal-case">{SITE.email}</span>
            <span className="relative inline-block w-12 text-left text-xs text-muted">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? "copied" : "copy"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.16 }}
                  className="block"
                >
                  {copied ? "Copied" : "Copy"}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
          <span role="status" className="sr-only">
            {copied ? "Email address copied" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
