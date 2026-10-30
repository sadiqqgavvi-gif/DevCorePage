"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { CHAPTERS } from "@/lib/content";
import { getLenis } from "@/lib/motion";
import { Logo } from "@/components/ui/Logo";

export function SiteHeader() {
  const [chapter, setChapter] = useState(0);
  const [open, setOpen] = useState(false);
  const [orbiting, setOrbiting] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setChapter(CHAPTERS.findIndex((item) => item.id === entry.target.id));
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const { id } of CHAPTERS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  // The orbit sections keep their own dots where the scroll cue would sit.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setOrbiting(entry.isIntersecting);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const id of ["services", "standards"]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    const button = menuButton.current;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    menu.current?.querySelector("a")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button?.focus();
      }
      if (event.key === "Tab" && menu.current) {
        const links = menu.current.querySelectorAll("a");
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          button?.focus();
        } else if (event.shiftKey && document.activeElement === button) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          button?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div aria-hidden className="hud-backdrop pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-950/75 to-transparent" />
      <div className="shell relative z-10 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 lg:h-[4.5rem]">
        <div className="flex items-center gap-2">
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="-ml-2.5 grid size-11 place-items-center"
          >
            <span aria-hidden className="relative block h-2.5 w-5">
              <motion.span
                className="absolute left-0 top-0 h-px w-full bg-paper"
                animate={open ? { y: 4.5, rotate: 45 } : { y: 0, rotate: 0 }}
                transition={{ duration: 0.25 }}
              />
              <motion.span
                className="absolute bottom-0 left-0 h-px w-full bg-paper"
                animate={open ? { y: -4.5, rotate: -45 } : { y: 0, rotate: 0 }}
                transition={{ duration: 0.25 }}
              />
            </span>
          </button>
          <p className="label whitespace-nowrap max-[420px]:hidden">
            0{chapter + 1} / 0{CHAPTERS.length}
            <span className="ml-2 text-paper/70 max-sm:hidden">{CHAPTERS[chapter].label}</span>
          </p>
        </div>

        <a href="#top" aria-label="Devcore, back to top" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <div className="flex justify-end">
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="label inline-flex min-h-11 items-center whitespace-nowrap text-paper underline decoration-white/30 underline-offset-4 hover:decoration-cyan"
          >
            <span className="max-[420px]:hidden">start a project</span>
            <span className="min-[421px]:hidden">contact</span>
          </a>
        </div>
      </div>

      <p aria-hidden className="site-cue label" data-hidden={open || orbiting || chapter === CHAPTERS.length - 1}>
        scroll to continue
      </p>

      {/* The chapter timeline along the foot of the screen */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-1 bg-white/10">
        <motion.div className="h-full origin-left bg-cyan" style={{ scaleX: progress }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id="site-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 overflow-y-auto bg-ink-950 pt-24"
          >
            <nav aria-label="Chapters" className="shell">
              <ul className="flex flex-col">
                {CHAPTERS.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-white/10"
                  >
                    <a
                      href={`#${item.id}`}
                      aria-current={chapter === index ? "true" : undefined}
                      onClick={() => setOpen(false)}
                      className="display-md flex items-center justify-between py-4 capitalize"
                    >
                      {item.label}
                      <span aria-hidden className="font-mono text-sm font-normal text-faint">
                        0{index + 1}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
