import { ImageTrail } from "@/components/ui/image-trail";
import { Letters } from "@/components/ui/Letters";
import { SHOWCASE, WORK } from "@/lib/content";

const IMAGES = [...WORK.map((item) => item.image), ...SHOWCASE.map((scene) => scene.back)];

export function ConceptTrail() {
  return (
    <section id="trail" aria-labelledby="trail-title" className="trail-section">
      <div className="absolute inset-0">
        <ImageTrail
          images={IMAGES}
          imageWidth="clamp(9.5rem, 22vw, 19rem)"
          imageHeight="clamp(12rem, 28vw, 24rem)"
          threshold={60}
          duration={1.6}
        />
      </div>
      <div className="shell pointer-events-none relative z-10 flex min-h-[inherit] flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow mb-4">illustrative concepts</p>
        <h2 id="trail-title" data-letters className="display-lg max-w-[16ch]">
          <Letters text="Every problem leaves a trail." />
        </h2>
        <p className="lede mt-5 max-w-lg">
          Support queues, paperwork, fleets, billing. These are the kinds of problems we like to
          work through.
        </p>
      </div>
    </section>
  );
}
