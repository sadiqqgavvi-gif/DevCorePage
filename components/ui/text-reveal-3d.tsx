"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, MEDIA, useGsapMedia } from "@/lib/motion";

type TextReveal3DProps = {
  items: string[];
  className?: string;
  textClassName?: string;
  /** How far the page scrolls while the cylinder turns. */
  scrollDistance?: string;
  perspective?: number;
  /** Cylinder radius as a share of the viewport's short edge. */
  radiusOffset?: number;
  startRotation?: number;
  endRotation?: number;
  scrubSmoothing?: number;
  fontSize?: string;
  fontWeight?: number;
  /** Angle between lines, in degrees. */
  gap?: number;
};

/**
 * Lines of text turning on a 3D cylinder as you scroll.
 *
 * Built for Devcore, using no React Bits Pro source; only its public prop names are shared. Only
 * the wheel's transform changes while scrolling. Without scroll-driven layout (reduced motion,
 * short screens) the lines are an ordinary list.
 */
export function TextReveal3D({
  items,
  className = "",
  textClassName = "",
  scrollDistance = "320svh",
  perspective = 1000,
  radiusOffset = 0.4,
  startRotation,
  endRotation,
  scrubSmoothing = 0.5,
  fontSize = "clamp(2.25rem, min(9vw, 14svh), 7rem)",
  fontWeight = 600,
  gap = 22,
}: TextReveal3DProps) {
  const root = useRef<HTMLDivElement>(null);
  const from = startRotation ?? -gap * 2;
  const to = endRotation ?? gap * (items.length + 1);

  useGsapMedia(root, (mm, element) => {
    mm.add(MEDIA.story, () => {
      gsap.fromTo(
        ".cyl-wheel",
        { rotationX: from },
        {
          rotationX: to,
          ease: "none",
          scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: scrubSmoothing },
        },
      );
    });
  });

  return (
    <div
      ref={root}
      className={`cyl-track ${className}`}
      style={
        {
          "--cyl-distance": scrollDistance,
          "--cyl-perspective": `${perspective}px`,
          "--cyl-radius": `calc(min(100vw, 100svh) * ${radiusOffset})`,
          "--cyl-gap": `${gap}deg`,
        } as CSSProperties
      }
    >
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div aria-hidden className="cyl-pin">
        <div className="cyl-axis">
          <div className="cyl-wheel">
            {items.map((item, index) => (
              <span
                key={item}
                className={`cyl-item ${textClassName}`}
                style={{ "--i": index, fontSize, fontWeight } as CSSProperties}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
