import { IntroGate } from "@/components/intro/IntroGate";
import { Providers } from "@/components/layout/Providers";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ConceptTrail } from "@/components/sections/ConceptTrail";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { NextStop } from "@/components/sections/NextStop";
import { Process } from "@/components/sections/Process";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Services } from "@/components/sections/Services";
import { Showcase } from "@/components/sections/Showcase";
import { Standards } from "@/components/sections/Standards";
import { Technology } from "@/components/sections/Technology";
import { WhatWeBuild } from "@/components/sections/WhatWeBuild";
import { WhyDevcore } from "@/components/sections/WhyDevcore";
import { Stage } from "@/components/stage/Stage";
import { SwarmCursor } from "@/components/ui/swarm-cursor";

export default function Home() {
  return (
    <Providers>
      <div aria-hidden className="intro-cover" />
      <IntroGate />
      <Stage />
      <div id="site">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Manifesto />
          <Services />
          <WhatWeBuild />
          <Technology />
          <ConceptTrail />
          <SelectedWork />
          <Process />
          <Standards />
          <Showcase />
          <WhyDevcore />
          <NextStop />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
      <SwarmCursor />
    </Providers>
  );
}
