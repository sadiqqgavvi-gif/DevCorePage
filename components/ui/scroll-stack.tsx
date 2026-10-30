"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, MEDIA, useGsapMedia } from "@/lib/motion";

export type ScrollStackItem = {
  eyebrow?: string;
  title: string;
  body?: string;
};

type ScrollStackProps = {
  items: ScrollStackItem[];
  /** Viewport heights of scrolling assigned to each card. */
  scrollLength?: number;
  /** Pixels a covered card slides up so its edge peeks out. */
  peek?: number;
  /** How much a covered card shrinks per step. */
  scaleStep?: number;
  /** How far a covered card darkens per step, from 0 to 1. */
  dim?: number;
  /** How many covered cards stay visible behind the active one. */
  depth?: number;
  cardWidth?: number;
  /** Card height as a share of the viewport. */
  cardHeight?: number;
  showProgress?: boolean;
  showCounter?: boolean;
  className?: string;
};

/**
 * Cards that stack and fade away as you scroll.
 *
 * Built for Devcore, using no React Bits Pro source; only its public prop names are shared. Only
 * transforms and opacity animate, with no blur, so the stack stays smooth on phones. Without
 * scroll-driven layout (reduced motion, short screens) the cards are an ordinary list.
 */
export function ScrollStack({
  items,
  scrollLength = 0.9,
  peek = 26,
  scaleStep = 0.07,
  dim = 0.3,
  depth = 2,
  cardWidth = 880,
  cardHeight = 0.56,
  showProgress = true,
  showCounter = true,
  className = "",
}: ScrollStackProps) {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.story, () => {
      const cards = gsap.utils.toArray<HTMLElement>(".stack-card", element);
      const shades = gsap.utils.toArray<HTMLElement>(".stack-shade", element);
      let shown = 0;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        // On the timeline rather than the trigger, so the counter follows the smoothed position.
        onUpdate: () => {
          const index = Math.min(cards.length - 1, Math.round(timeline.time()));
          if (index !== shown && counter.current) {
            shown = index;
            counter.current.textContent = String(index + 1).padStart(2, "0");
          }
        },
        scrollTrigger: {
          trigger: element,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, index) => {
        if (index === 0) return;
        const at = index - 1;
        // Waiting cards start a full screen down, so none of them show below the one in front.
        timeline.fromTo(card, { y: () => window.innerHeight }, { y: 0, duration: 1, ease: "power1.out" }, at);
        cards.slice(0, index).forEach((covered, under) => {
          const steps = index - under;
          timeline.to(
            covered,
            {
              y: -peek * Math.min(steps, depth),
              scale: 1 - scaleStep * Math.min(steps, depth),
              opacity: steps > depth ? 0 : 1,
              duration: 1,
            },
            at,
          );
          timeline.to(shades[under], { opacity: Math.min(0.8, dim * steps), duration: 1 }, at);
        });
      });

      const bar = element.querySelector(".stack-bar");
      if (bar) {
        timeline.fromTo(bar, { scaleX: 1 / cards.length }, { scaleX: 1, duration: cards.length - 1 }, 0);
      }
      // The last card holds for a moment before the page moves on.
      timeline.to({}, { duration: 0.35 }, cards.length - 1);
    });
  });

  return (
    <div
      ref={root}
      className={`stack-track ${className}`}
      style={
        {
          "--stack-steps": (items.length - 1 + 0.35) * scrollLength,
          "--stack-width": `${cardWidth}px`,
          "--stack-height": cardHeight,
        } as CSSProperties
      }
    >
      <div className="stack-pin">
        <ul className="stack-list">
          {items.map((item, index) => (
            <li key={item.title} className="stack-card">
              <div className="stack-card-body">
                {item.eyebrow && (
                  <p className="label text-cyan">
                    0{index + 1} · {item.eyebrow}
                  </p>
                )}
                <div className="mt-auto">
                  <h3 className="display-lg max-w-[18ch]">{item.title}</h3>
                  {item.body && <p className="lede mt-4 max-w-xl">{item.body}</p>}
                </div>
              </div>
              <span aria-hidden className="stack-shade" />
            </li>
          ))}
        </ul>

        {(showProgress || showCounter) && (
          <div aria-hidden className="stack-meta">
            {showCounter && (
              <p className="label whitespace-nowrap">
                <span ref={counter} className="text-paper">
                  01
                </span>{" "}
                / {String(items.length).padStart(2, "0")}
              </p>
            )}
            {showProgress && (
              <div className="stack-rail">
                <div className="stack-bar" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
