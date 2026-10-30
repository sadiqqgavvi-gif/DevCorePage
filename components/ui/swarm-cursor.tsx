"use client";

import { useEffect, useRef } from "react";

const COUNT = 64;
const SPRITE_SIZE = 32;
const COLORS = ["#5b8cff", "#8a63ff", "#6fe7ff"];

type Particle = { x: number; y: number; vx: number; vy: number; phase: number; size: number; life: number; color: number };

function makeSprite(color: string) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = SPRITE_SIZE;
  const context = sprite.getContext("2d")!;
  const half = SPRITE_SIZE / 2;
  const glow = context.createRadialGradient(half, half, 0, half, half, half);
  glow.addColorStop(0, color);
  glow.addColorStop(0.28, `${color}66`);
  glow.addColorStop(1, `${color}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return sprite;
}

/**
 * A restrained particle swarm that trails the pointer inside `[data-swarm]` sections.
 *
 * Built for Devcore: the original SwarmCursor source was not available. It is a passive overlay,
 * so the native cursor, clicks, selection and keyboard use are untouched. The loop only runs while
 * particles are moving. Touch gets a short burst per tap, and reduced motion gets nothing.
 */
export function SwarmCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const sprites = COLORS.map(makeSprite);
    const particles: Particle[] = [];
    const target = { x: 0, y: 0, seen: false };
    let inSection = false;
    let dpr = 1;
    let frame = 0;
    let last = 0;
    let lastMove = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    resize();

    const spawn = (x: number, y: number, spread: number, life: number): Particle => ({
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread,
      vx: (Math.random() - 0.5) * 1.6,
      vy: (Math.random() - 0.5) * 1.6,
      phase: Math.random() * Math.PI * 2,
      size: 5 + Math.random() * 9,
      life,
      color: Math.floor(Math.random() * COLORS.length),
    });

    const tick = (now: number) => {
      const elapsed = now - last;
      const step = Math.min(2.5, elapsed / 16.7 || 1);
      last = now;
      const engaged = finePointer && inSection && target.seen && now - lastMove < 1800;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.phase += 0.03 * step;
        if (engaged) {
          // Steer towards an orbit around the pointer rather than onto it.
          const orbit = 26 + (i % 7) * 7;
          const goalX = target.x + Math.cos(p.phase + i) * orbit;
          const goalY = target.y + Math.sin(p.phase * 1.2 + i) * orbit;
          p.vx += (goalX - p.x) * 0.0045 * step;
          p.vy += (goalY - p.y) * 0.0045 * step;
        } else {
          // Measured in time, so the loop ends just as promptly on a slow device.
          p.life -= elapsed / 1000;
        }
        p.vx *= 0.93 ** step;
        p.vy *= 0.93 ** step;
        p.x += p.vx * step;
        p.y += p.vy * step;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const size = p.size * dpr;
        context.globalAlpha = Math.min(1, p.life) * 0.62;
        context.drawImage(sprites[p.color], p.x * dpr - size / 2, p.y * dpr - size / 2, size, size);
      }

      if (particles.length) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const wake = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      target.seen = true;
      lastMove = performance.now();
      if (!inSection) return;
      while (particles.length < COUNT) particles.push(spawn(target.x, target.y, 60, 1));
      wake();
    };

    // Touch: one small burst where the finger lands. It never touches scrolling.
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !inSection) return;
      for (let i = 0; i < 14; i += 1) {
        const p = spawn(event.clientX, event.clientY, 14, 0.8);
        const angle = (i / 14) * Math.PI * 2;
        p.vx = Math.cos(angle) * 2.4;
        p.vy = Math.sin(angle) * 2.4;
        particles.push(p);
      }
      wake();
    };

    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      inSection = visible.size > 0;
    });
    document.querySelectorAll("[data-swarm]").forEach((section) => observer.observe(section));

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-40 h-full w-full" />;
}
