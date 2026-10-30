import { TextReveal3D } from "@/components/ui/text-reveal-3d";
import { BUILD_LINES } from "@/lib/content";

export function WhatWeBuild() {
  return (
    <section id="build" aria-labelledby="build-title" className="relative">
      <div className="build-head shell">
        <h2 id="build-title" className="eyebrow">
          what we build
        </h2>
      </div>
      <TextReveal3D
        items={BUILD_LINES}
        textClassName="cyl-text"
        fontSize="clamp(2rem, min(7.5vw, 11.5svh), 5.5rem)"
        fontWeight={500}
      />
    </section>
  );
}
