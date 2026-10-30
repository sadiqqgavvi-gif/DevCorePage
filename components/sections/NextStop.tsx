import MetroHero from "@/components/ui/scroll-locked-video-hero";

export function NextStop() {
  return (
    <section id="next-stop" aria-label="Next stop">
      <MetroHero
        title="Next stop: what's next."
        tagline="The doors are open. Let's build it."
        signature={false}
        showProgress={false}
        scrubDistance={4200}
        style={{ background: "#000203" }}
      />
    </section>
  );
}
