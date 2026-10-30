"use client"

import { useEffect, useRef, useState } from "react"

// ─────────────────────────────────────────────────────────────
// THE CITY OPENS — scroll-scrub video hero
// The video stays pinned to the screen while scrolling drives
// video.currentTime, forward and backward. Once the video reaches
// the end the page simply carries on, and scrolling back up scrubs
// it in reverse.
//
// Changed from the 21st.dev original, which pinned the body with
// position:fixed and swallowed wheel/touch input for the component's
// whole lifetime. That leaves no way past it on a longer page, and
// resets window.scrollY, which the page's GSAP and stage read. A tall
// track with a sticky pin gives the same effect through native scroll.
// ─────────────────────────────────────────────────────────────

export interface MetroHeroProps {
  videoSrc?: string
  title?: string
  scrollHint?: string
  tagline?: string
  signature?: { name: string; url: string } | false
  /** Total scroll distance (px) needed to scrub the full video. Tune to taste. */
  scrubDistance?: number
  /** The thin line along the bottom that fills as the video advances. */
  showProgress?: boolean
  className?: string
  style?: React.CSSProperties
}

const DEFAULT_VIDEO = "https://cdn.21st.dev/assets/mirror/21/21a77eac28eacbb7e142016eefeaa0b4a766619e51113629a3bc6df6af066c0f.mp4"
const DEFAULT_SIGNATURE = { name: "guglielmogiannattasio.exe", url: "https://www.guglielmogiannattasio.it" }
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const DISPLAY = `var(--font-display, ${SANS})`

const COL_BG = "#05070d"
const COL_TEXT = "#f2f4f8"

/** Frames kept per second of video on phones. They are cross-faded, so this stays affordable. */
const FRAME_RATE = 10;
/** The chase toward the scroll position, per 60fps frame. */
const FOLLOW = 0.1;

const CSS = `
.metro-track{height:calc(100lvh + var(--metro-scrub))}
@keyframes metro-hero-bounce{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(5px);opacity:1}}
.metro-arrow{animation:metro-hero-bounce 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .metro-track{height:100lvh}
  .metro-hint{display:none!important}
}
`

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function MetroHero({
  videoSrc = DEFAULT_VIDEO,
  title = "THE CITY OPENS",
  scrollHint = "SCROLL",
  tagline = "Every door in the city is already open.",
  signature = DEFAULT_SIGNATURE,
  scrubDistance = 3200,
  showProgress = true,
  className,
  style,
}: MetroHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const framesRef = useRef<HTMLCanvasElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [usingFrames, setUsingFrames] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    const pin = pinRef.current
    if (!video || !section || !pin) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let duration = 0
    let rafId = 0
    let currentProgress = 0
    let hasStartedScrolling = false
    let isSeeking = false
    let pendingTime: number | null = null
    let lastTime = -1
    let lastFrame = 0

    // Seeking makes a phone decode from the nearest keyframe on nearly every scroll step,
    // which no amount of throttling hides. So phones walk the video once, keep a still of
    // just the part the screen shows, and from then on scrubbing only draws images.
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches
    const canvas = framesRef.current
    const context = canvas?.getContext("2d") ?? null
    let useFrames = coarse && !reduceMotion && Boolean(context) && typeof createImageBitmap === "function"
    const frames: (ImageBitmap | undefined)[] = []
    let frameTotal = 0
    let drawnAt = -1
    let disposed = false

    const seekAndWait = (time: number) =>
      new Promise<void>((resolve) => {
        const done = () => {
          video.removeEventListener("seeked", done)
          window.clearTimeout(timeout)
          resolve()
        }
        const timeout = window.setTimeout(done, 2000)
        video.addEventListener("seeked", done)
        video.currentTime = time
      })

    const captureFrames = async () => {
      const { videoWidth, videoHeight } = video
      const boxWidth = pin.clientWidth
      const boxHeight = pin.clientHeight
      if (!canvas || !videoWidth || !videoHeight || !boxWidth || !boxHeight) throw new Error("No size")

      const scale = Math.max(boxWidth / videoWidth, boxHeight / videoHeight)
      const cropWidth = boxWidth / scale
      const cropHeight = boxHeight / scale
      const cropX = (videoWidth - cropWidth) / 2
      const cropY = (videoHeight - cropHeight) / 2
      const height = Math.min(720, Math.round(boxHeight * Math.min(window.devicePixelRatio || 1, 1.5)))
      const width = Math.round((height * boxWidth) / boxHeight)
      canvas.width = width
      canvas.height = height

      video.pause()
      frameTotal = Math.max(2, Math.floor(duration * FRAME_RATE))
      // Coarse passes first, so the whole video is on hand within a few seeks and the rest
      // only adds detail. Someone scrolling fast never waits at a frame that has not been kept.
      for (const step of [8, 4, 2, 1]) {
        for (let index = 0; index < frameTotal; index += step) {
          if (frames[index]) continue
          if (disposed) return
          await seekAndWait((index / (frameTotal - 1)) * Math.max(0, duration - 0.05))
          if (disposed) return
          frames[index] = await createImageBitmap(video, cropX, cropY, cropWidth, cropHeight, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: "medium",
          })
          if (index === 0) setUsingFrames(true)
          drawnAt = -1
        }
      }
    }

    const onLoadedData = () => {
      duration = video.duration || 0
      setReady(true)
      if (reduceMotion) {
        video.currentTime = duration * 0.92
      }
      if (useFrames) {
        captureFrames().catch(() => {
          // Fall back to scrubbing the video itself, keeping whatever could not be drawn out of it.
          useFrames = false
          setUsingFrames(false)
        })
      }
    }
    video.addEventListener("loadeddata", onLoadedData)

    // iOS Safari often won't buffer any video data — even with
    // preload="auto" — until playback actually starts, to save mobile
    // data. Since we only ever seek (never call play() elsewhere), the
    // video can stay permanently blank on iPhone. Force a silent
    // play-then-immediately-pause on mount to kick off real loading.
    const kickstartLoad = () => {
      const p = video.play()
      if (p && typeof p.then === "function") {
        p.then(() => video.pause()).catch(() => {})
      } else {
        video.pause()
      }
    }

    // The file is only fetched once the hero is within a screen of the viewport.
    const loader = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loader.disconnect()
          // Frames are read back out of the video, which takes a CORS-enabled source. A copy
          // already cached without CORS would fail that check outright, so this one is requested
          // under its own address and cannot collide with it.
          if (useFrames) {
            video.crossOrigin = "anonymous"
            video.src = `${videoSrc}${videoSrc.includes("?") ? "&" : "?"}frames=1`
          } else {
            video.src = videoSrc
          }
          kickstartLoad()
        }
      },
      { rootMargin: "150% 0px" },
    )
    loader.observe(section)

    const onSeeked = () => {
      isSeeking = false
      if (pendingTime !== null) {
        const t = pendingTime
        pendingTime = null
        isSeeking = true
        video.currentTime = t
      }
    }
    video.addEventListener("seeked", onSeeked)

    // If the CORS copy cannot be had, the plain video still plays. Slower to scrub, never blank.
    const onError = () => {
      if (!useFrames) return
      useFrames = false
      setUsingFrames(false)
      video.removeAttribute("crossorigin")
      video.src = videoSrc
      kickstartLoad()
    }
    video.addEventListener("error", onError)

    function seekTo(t: number) {
      // Seeking to where the video already is still makes the browser decode a frame.
      if (Math.abs(t - lastTime) < 0.001) return
      lastTime = t
      if (isSeeking) {
        pendingTime = t
        return
      }
      isSeeking = true
      video!.currentTime = t
    }

    /** Draws the moment between two kept frames, so scrubbing never steps from one to the next. */
    function drawFrames() {
      if (!context || !frames[0]) return
      const at = currentProgress * (frameTotal - 1)
      if (Math.abs(at - drawnAt) < 0.004) return
      drawnAt = at
      // The nearest kept frames either side, however far apart the passes have got them so far.
      let before = Math.floor(at)
      while (before > 0 && !frames[before]) before--
      let after = Math.ceil(at)
      while (after < frameTotal && !frames[after]) after++
      context.globalAlpha = 1
      context.drawImage(frames[before]!, 0, 0)
      const next = frames[after]
      if (next && after > before) {
        const between = (at - before) / (after - before)
        if (between > 0.01) {
          context.globalAlpha = between
          context.drawImage(next, 0, 0)
        }
      }
    }

    function frame(now: number) {
      const rect = section!.getBoundingClientRect()
      const distance = rect.height - pin!.offsetHeight
      const targetProgress = distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0
      if (targetProgress > 0.001) hasStartedScrolling = true

      // Scaled by the time since the last frame, so the pace holds through a dropped frame.
      const elapsed = clamp((now - (lastFrame || now)) / 16.667, 0.25, 4)
      lastFrame = now
      currentProgress += (targetProgress - currentProgress) * (1 - Math.pow(1 - FOLLOW, elapsed))

      if (useFrames) {
        drawFrames()
      } else if (duration > 0) {
        seekTo(currentProgress * duration)
      }

      const visual = useFrames ? framesRef.current : videoRef.current
      if (visual) {
        const scale = 1 + currentProgress * 0.06
        visual.style.transform = `scale(${scale})`
      }
      if (titleRef.current) {
        const t = 1 - clamp(currentProgress / 0.35, 0, 1)
        titleRef.current.style.opacity = String(t)
        titleRef.current.style.transform = `translateY(${(1 - t) * -24}px) scale(${0.96 + t * 0.04})`
        // Re-blurring large text on every frame is more than a phone can spare here.
        if (!coarse) titleRef.current.style.filter = `blur(${(1 - t) * 10}px)`
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = hasStartedScrolling ? "0" : "1"
      }
      if (taglineRef.current) {
        // Mirrors the title's blur-focus treatment, timed as the payoff
        // once the reveal is nearly complete — not a background afterthought.
        const t = clamp((currentProgress - 0.82) / 0.18, 0, 1)
        taglineRef.current.style.opacity = String(t)
        taglineRef.current.style.transform = `translateY(${(1 - t) * 20}px) scale(${0.97 + t * 0.03})`
        if (!coarse) taglineRef.current.style.filter = `blur(${(1 - t) * 8}px)`
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${currentProgress})`
      }

      rafId = requestAnimationFrame(frame)
    }

    // The loop only runs while the hero is on screen.
    const visibility = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting)
      cancelAnimationFrame(rafId)
      rafId = visible && !reduceMotion ? requestAnimationFrame(frame) : 0
    })
    visibility.observe(section)

    return () => {
      disposed = true
      loader.disconnect()
      visibility.disconnect()
      video.removeEventListener("loadeddata", onLoadedData)
      video.removeEventListener("seeked", onSeeked)
      video.removeEventListener("error", onError)
      cancelAnimationFrame(rafId)
      for (const bitmap of frames) bitmap?.close()
    }
  }, [videoSrc])

  return (
    <div
      ref={sectionRef}
      className={"metro-track" + (className ? " " + className : "")}
      style={
        {
          "--metro-scrub": `${scrubDistance}px`,
          position: "relative",
          width: "100%",
          background: COL_BG,
          ...style,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      <div
        ref={pinRef}
        style={{
          position: "sticky",
          top: 0,
          // Large, not small: with the browser's address bar hidden, a small-viewport pin
          // would leave a strip of bare page under the video.
          height: "100lvh",
          width: "100%",
          overflow: "hidden",
          background: COL_BG,
        }}
      >
        <video
          ref={videoRef}
          aria-hidden="true"
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: ready && !usingFrames ? 1 : 0,
            transformOrigin: "center center",
            willChange: "transform",
            transition: "opacity 0.6s ease",
            pointerEvents: "none",
          }}
        />

        <canvas
          ref={framesRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: usingFrames ? 1 : 0,
            transformOrigin: "center center",
            willChange: "transform",
            transition: "opacity 0.6s ease",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(5,7,13,0.35), rgba(5,7,13,0) 30%, rgba(5,7,13,0.15) 70%, rgba(5,7,13,0.55))",
            pointerEvents: "none",
          }}
        />

        <div
          ref={titleRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 6%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontStretch: "118%",
              fontSize: "clamp(30px, 7vw, 96px)",
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: COL_TEXT,
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              display: "inline-block",
              willChange: "transform, opacity",
            }}
          >
            {title}
          </span>
        </div>

        {tagline && (
          <div
            ref={taglineRef}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8%",
              textAlign: "center",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontStretch: "118%",
                fontSize: "clamp(20px, 3.4vw, 40px)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: COL_TEXT,
                textShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            >
              {tagline}
            </span>
          </div>
        )}

        <div
          ref={hintRef}
          className="metro-hint"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "clamp(20px, 6vh, 48px)",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: "rgba(240,244,248,0.75)",
            fontFamily: SANS,
            fontSize: "clamp(10px, 1.4vw, 12px)",
            fontWeight: 600,
            letterSpacing: "0.3em",
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          <span>{scrollHint}</span>
          <svg className="metro-arrow" width="14" height="18" viewBox="0 0 14 18">
            <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Thin progress line — fills as the video advances. */}
        {showProgress && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              background: "rgba(255,255,255,0.12)",
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                height: "100%",
                width: "100%",
                background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.95))",
                transform: "scaleX(0)",
                transformOrigin: "left center",
              }}
            />
          </div>
        )}

        {signature && (
          <span
            style={{
              position: "absolute",
              right: "clamp(12px, 2.5vw, 24px)",
              bottom: "clamp(10px, 2vw, 18px)",
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: "clamp(11px, 1.4vw, 13px)",
              letterSpacing: "0.01em",
              color: "rgba(220,224,232,0.6)",
              zIndex: 2,
            }}
          >
            by{" "}
            <a
              href={signature.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "rgba(220,224,232,0.6)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = COL_TEXT
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = "rgba(220,224,232,0.6)"
              }}
            >
              {signature.name}
            </a>
          </span>
        )}
      </div>
    </div>
  )
}
