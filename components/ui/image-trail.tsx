"use client";

import React, { useEffect, useRef } from "react";
import { Expo, gsap, Power1, Quint } from "gsap";

interface ImageTrailProps {
  images: string[];
  /** Pixels, or any CSS length so the images can scale with the screen. */
  imageWidth?: number | string;
  imageHeight?: number | string;
  threshold?: number;
  duration?: number;
}

const length = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

export function ImageTrail({
  images = [],
  imageWidth = 200,
  imageHeight = 200,
  threshold = 50,
  duration = 1.6,
}: ImageTrailProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const cacheMousePos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const zIndexVal = useRef(1);
  const imgPosition = useRef(0);
  const parentSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const content = contentRef.current;
    if (!content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    imagesRef.current = Array.from(content.querySelectorAll("img"));
    if (imagesRef.current.length === 0) return;

    // Without a cursor, a slow path across the section leaves the same trail.
    const auto = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const step = auto ? threshold * 2.4 : threshold;

    const calcParentSize = () => {
      const rect = content.getBoundingClientRect();
      parentSize.current = { width: rect.width, height: rect.height };
    };

    // The first position after each start seeds the trail, so it never flies in from the corner.
    let fresh = true;
    const setPointer = (x: number, y: number) => {
      mousePos.current = { x, y };
      if (fresh) {
        fresh = false;
        cacheMousePos.current = { x, y };
        lastMousePos.current = { x, y };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = content.getBoundingClientRect();
      setPointer(e.clientX - rect.left, e.clientY - rect.top);
    };

    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

    const showNextImage = () => {
      const img = imagesRef.current[imgPosition.current];
      if (!img) return;

      const rect = img.getBoundingClientRect();
      gsap.killTweensOf(img);

      gsap
        .timeline()
        .set(img, {
          startAt: { opacity: 0 },
          opacity: 1,
          zIndex: zIndexVal.current,
          x: cacheMousePos.current.x - rect.width / 2,
          y: cacheMousePos.current.y - rect.height / 2,
        })
        .to(img, {
          duration: duration,
          ease: Expo.easeOut,
          x: mousePos.current.x - rect.width / 2,
          y: mousePos.current.y - rect.height / 2,
        })
        .to(
          img,
          {
            duration: 1,
            ease: Power1.easeOut,
            opacity: 0,
          },
          duration - 1 > 0 ? duration - 1 : 0.4,
        )
        .to(
          img,
          {
            duration: 1,
            ease: Quint.easeInOut,
            y: `+=${parentSize.current.height + rect.height / 2}`,
          },
          duration - 1 > 0 ? duration - 1 : 0.4,
        );
    };

    let frame = 0;

    const renderImages = (now: number) => {
      if (auto) {
        const t = now / 1000;
        setPointer(
          parentSize.current.width * (0.5 + 0.36 * Math.sin(t * 0.9)),
          parentSize.current.height * (0.5 + 0.3 * Math.sin(t * 1.4 + 1)),
        );
      }

      const distance = Math.hypot(
        mousePos.current.x - lastMousePos.current.x,
        mousePos.current.y - lastMousePos.current.y,
      );

      cacheMousePos.current.x = lerp(cacheMousePos.current.x, mousePos.current.x, 0.1);
      cacheMousePos.current.y = lerp(cacheMousePos.current.y, mousePos.current.y, 0.1);

      if (distance > step) {
        showNextImage();
        zIndexVal.current += 1;
        imgPosition.current = (imgPosition.current + 1) % imagesRef.current.length;
        lastMousePos.current = { ...mousePos.current };
      }

      frame = requestAnimationFrame(renderImages);
    };

    // The loop and the listener only exist while the section is on screen.
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      fresh = true;
      calcParentSize();
      lastMousePos.current = { ...mousePos.current };
      if (!auto) window.addEventListener("mousemove", handleMouseMove, { passive: true });
      frame = requestAnimationFrame(renderImages);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frame);
    };

    const visibility = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
      else stop();
    });
    visibility.observe(content);
    window.addEventListener("resize", calcParentSize);

    return () => {
      visibility.disconnect();
      stop();
      window.removeEventListener("resize", calcParentSize);
      gsap.killTweensOf(imagesRef.current);
    };
  }, [threshold, duration]);

  return (
    <div
      style={
        {
          "--image-width": length(imageWidth),
          "--image-height": length(imageHeight),
        } as React.CSSProperties
      }
      className="relative isolate z-0 flex h-full w-full items-center justify-center overflow-hidden"
      ref={contentRef}
    >
      {images.map((url) => (
        <img
          key={url}
          className="pointer-events-none absolute top-0 left-0 h-[var(--image-height)] w-[var(--image-width)] object-cover opacity-0 will-change-transform"
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

export default ImageTrail;
