"use client";

import { gsap, ScrollTrigger } from "./motion";

/** Where the persistent 3D object is, in viewport terms: x/y run -1..1 (y up), size is a share of the short edge. */
export type Pose = {
  x: number;
  y: number;
  size: number;
  orb: number;
  net: number;
  spin: number;
  energy: number;
  sky: number;
};

type Key = { id: string; at: number; pose: Pose; portrait?: Partial<Pose> };

const BASE: Pose = { x: 0, y: 0, size: 0.2, orb: 0, net: 0, spin: 0, energy: 0, sky: 0 };
const k = (id: string, at: number, pose: Partial<Pose>, portrait?: Partial<Pose>): Key => ({
  id,
  at,
  pose: { ...BASE, ...pose },
  portrait,
});

/**
 * The whole page's camera script. `at` is a share of how far that section can scroll.
 * Keys with no orb or net switch the 3D scene off, which is what keeps sections that carry their own
 * heavy effect, or that cover the stage completely, from also paying for it.
 */
const KEYS: Key[] = [
  k("top", 0, { y: 0.14, size: 0.33, orb: 0.82, energy: 0 }, { y: 0.24, size: 0.32, orb: 0.82 }),
  k("top", 0.55, { y: 0.03, size: 0.44, orb: 1, energy: 0.5, sky: 0.4 }, { y: 0.1, size: 0.42 }),
  k("top", 1, { y: 0, size: 0.82, orb: 0.45, energy: 1, sky: 1 }),
  k("manifesto", 0, { x: -0.46, size: 0.3, orb: 1, energy: 0.55, sky: 1 }, { x: 0, y: 0.42, size: 0.22 }),
  k("manifesto", 1, { x: -0.46, size: 0.3, orb: 1, energy: 0.8, sky: 1 }, { x: 0, y: 0.42, size: 0.22 }),
  k("services", 0, { y: 0.2, size: 0.15, orb: 1, energy: 0.25, sky: 1 }, { y: 0.44, size: 0.13 }),
  k("services", 1, { y: 0.2, size: 0.15, orb: 1, energy: 0.45, sky: 2 }, { y: 0.44, size: 0.13 }),
  k("build", 0, { y: 0.2, size: 0.1, sky: 2 }, { y: 0.44 }),
  k("build", 1, { x: 0.46, y: 0.04, size: 0.3, sky: 2 }, { x: 0, y: 0.38 }),
  k("technology", 0, { x: 0.46, y: 0.04, size: 0.4, net: 1, sky: 2 }, { x: 0, y: 0.38, size: 0.46 }),
  k("technology", 1, { x: 0.46, y: 0.04, size: 0.4, net: 1, spin: 1, sky: 3 }, { x: 0, y: 0.38, size: 0.46 }),
  k("trail", 0, { x: 0.46, y: 0.04, size: 0.3, sky: 3 }, { x: 0, y: 0.38, size: 0.3 }),
  k("work", 0, { x: 0.46, y: 0.04, size: 0.3, sky: 3 }, { x: 0, y: 0.38, size: 0.3 }),
  k("work", 1, { x: 0.66, y: 0.5, size: 0.08, sky: 3 }, { x: 0.62, y: 0.72, size: 0.08 }),
  k("process", 0, { x: 0.66, y: 0.5, size: 0.085, orb: 0.9, sky: 3 }, { x: 0.62, y: 0.72, size: 0.09 }),
  k("process", 1, { x: -0.66, y: 0.5, size: 0.085, orb: 0.9, energy: 0.3, sky: 3 }, { x: -0.62, y: 0.72, size: 0.09 }),
  k("standards", 0, { y: 0.22, size: 0.14, orb: 1, energy: 0.3, sky: 3 }, { y: 0.44, size: 0.12 }),
  k("standards", 1, { y: 0.22, size: 0.14, orb: 1, energy: 0.45, sky: 3 }, { y: 0.44, size: 0.12 }),
  k("showcase", 0, { y: 0.22, size: 0.14, sky: 2 }, { y: 0.44, size: 0.12 }),
  k("showcase", 1, { x: 0.62, y: 0.42, size: 0.07, sky: 2 }),
  k("why", 0, { x: 0.76, y: 0.56, size: 0.1, orb: 0.9, energy: 0.2, sky: 2 }, { x: 0.55, y: 0.72, size: 0.09 }),
  k("why", 1, { x: 0.8, y: 0.62, size: 0.07, orb: 0, energy: 0.5, sky: 3 }, { x: 0.6, y: 0.76, size: 0.07 }),
  k("next-stop", 0, { x: 0.8, y: 0.62, size: 0.07, energy: 0.5, sky: 3 }, { x: 0.6, y: 0.76 }),
  k("next-stop", 1, { y: 0.54, size: 0.15, energy: 0.35, sky: 4 }, { y: 0.64, size: 0.17 }),
  k("contact", 0, { y: 0.54, size: 0.15, orb: 1, energy: 0.35, sky: 4 }, { y: 0.64, size: 0.17 }),
];

/** Live, smoothed pose. The 3D scene reads this each frame; only the controller below writes it. */
export const pose: Pose = { ...KEYS[0].pose };

const smooth = (t: number) => t * t * (3 - 2 * t);
const NUMERIC = Object.keys(BASE) as (keyof Pose)[];

type Anchor = { y: number; pose: Pose };

function buildAnchors() {
  const height = window.innerHeight;
  const portrait = window.innerWidth / height < 1;
  // Small phones have less room above the headline, so the object scales down with them.
  const tight = portrait && height < 640;
  const anchors: Anchor[] = [];
  for (const key of KEYS) {
    const element = document.getElementById(key.id);
    if (!element) continue;
    const box = element.getBoundingClientRect();
    const top = box.top + window.scrollY;
    const resolved = portrait && key.portrait ? { ...key.pose, ...key.portrait } : key.pose;
    anchors.push({
      y: top + key.at * Math.max(0, box.height - height),
      pose: tight
        ? { ...resolved, size: resolved.size * 0.72, y: Math.min(0.7, resolved.y + 0.1) }
        : resolved,
    });
  }
  return anchors;
}

function sampleInto(out: Pose, anchors: Anchor[], y: number) {
  let next = anchors.findIndex((anchor) => anchor.y > y);
  if (next === -1) next = anchors.length - 1;
  const b = anchors[next];
  const a = anchors[Math.max(0, next - 1)];
  const span = b.y - a.y;
  const t = span > 0 ? smooth(gsap.utils.clamp(0, 1, (y - a.y) / span)) : 1;
  for (const name of NUMERIC) out[name] = a.pose[name] + (b.pose[name] - a.pose[name]) * t;
}

/**
 * Drives the fixed stage from scroll. Skies are crossfaded as separate static layers, which keeps
 * it to compositor-only opacity changes on phones. The CSS core is moved here too, so the page
 * keeps its 3D object's choreography when WebGL is unavailable.
 */
export function startStage(skies: HTMLElement[], core: HTMLElement | null) {
  let anchors = buildAnchors();
  const target = { ...pose };
  const rebuild = () => {
    anchors = buildAnchors();
  };
  ScrollTrigger.addEventListener("refresh", rebuild);
  const sizeWatcher = new ResizeObserver(rebuild);
  sizeWatcher.observe(document.body);

  const opacities = skies.map(() => -1);
  let firstFrame = true;

  const tick = (_time: number, deltaMs: number) => {
    if (!anchors.length) return;
    sampleInto(target, anchors, window.scrollY);

    // The first frame snaps, so a page opened part-way down starts in the right place.
    let moved = firstFrame;
    const blend = firstFrame ? 1 : 1 - Math.exp(-Math.min(deltaMs, 100) * 0.0045);
    for (const name of NUMERIC) {
      const gap = target[name] - pose[name];
      if (Math.abs(gap) > 0.0004) moved = true;
      pose[name] += gap * blend;
    }
    firstFrame = false;
    if (!moved) return;

    skies.forEach((layer, index) => {
      const opacity = gsap.utils.clamp(0, 1, 1 - Math.abs(pose.sky - index));
      if (Math.abs(opacities[index] - opacity) > 0.002) {
        opacities[index] = opacity;
        layer.style.opacity = opacity.toFixed(3);
      }
    });

    if (core) {
      const short = Math.min(window.innerWidth, window.innerHeight);
      const radius = pose.size * short * (window.innerWidth < window.innerHeight ? 1.35 : 1);
      const px = (pose.x * window.innerWidth) / 2;
      const py = (-pose.y * window.innerHeight) / 2;
      // The sphere fills 56% of the 200px element.
      core.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${(radius / 56).toFixed(3)})`;
      core.style.opacity = Math.max(pose.orb, pose.net).toFixed(3);
    }
  };

  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
    sizeWatcher.disconnect();
    ScrollTrigger.removeEventListener("refresh", rebuild);
  };
}
