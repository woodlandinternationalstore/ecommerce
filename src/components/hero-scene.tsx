"use client";

import { useEffect, useRef } from "react";
import { Gear } from "./gear";

/**
 * Hero artwork as a small 3D scene: the vehicle photo sits in the middle, gears float in front of and behind it,
 * the whole thing tilts with the mouse, drifts with scroll, and gently sways on its own (so phones get motion too).
 * Everything is transform-only and switches off for people who prefer reduced motion.
 */
export function HeroScene({ alt }: { alt: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        el.style.setProperty("--sy", `${(y * 0.1).toFixed(1)}px`);
        el.style.setProperty("--gs", `${(y * 0.25).toFixed(1)}deg`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = root.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(0)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(0)}%`);
  }
  function leave() {
    const el = root.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={root} className="hero-scene" onPointerMove={move} onPointerLeave={leave}>
      <div className="scene-stage">
        <div className="scene-sway">
          <div className="scene-rot">
            <div className="scene-glow" aria-hidden="true" />

            <span className="scene-layer scene-back" aria-hidden="true">
              <Gear teeth={14} className="gear-spin-rev h-full w-full" />
            </span>

            {/* Artwork supplied by the owner (design mockup). Replace public/brand/hero*.webp to change it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/hero-m-2x.webp" alt={alt} width={942} height={944} className="scene-img hero-art fade-top block lg:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/hero-2x.webp" alt={alt} width={1736} height={670} className="scene-img hero-art fade-left hidden lg:block" />

            <span className="scene-layer scene-front" aria-hidden="true">
              <Gear teeth={10} className="gear-spin h-full w-full" />
            </span>
            <span className="scene-layer scene-front-2" aria-hidden="true">
              <Gear teeth={8} className="gear-spin-rev h-full w-full" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
