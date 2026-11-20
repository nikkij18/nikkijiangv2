"use client";

import { useEffect, useRef } from "react";

// A quiet field of dot stars that blink at their own pace.
const TINTS = ["#fdf3f3", "#f4afb4", "#ffe3b0", "#cfe6f7"];

type Star = { x: number; y: number; r: number; c: string; speed: number; phase: number; base: number };

export default function Starfield({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let W = 0, H = 0, raf = 0;

    function seed() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((W * H) / 4200);
      let s = 12345;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      stars = Array.from({ length: count }, () => {
        const k = rnd();
        // mostly pinpricks, some small dots, a few larger dots
        const r = k < 0.6 ? 0.5 + rnd() * 0.4 : k < 0.9 ? 0.9 + rnd() * 0.6 : 1.5 + rnd() * 0.9;
        return {
          x: rnd() * W,
          y: rnd() * H,
          r,
          c: TINTS[(rnd() * TINTS.length) | 0],
          speed: 0.5 + rnd() * 1.8,
          phase: rnd() * Math.PI * 2,
          base: 0.08 + rnd() * 0.25,
        };
      });
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);
      for (const st of stars) {
        // sharp blink: mostly dim, briefly bright
        const tw = reduce ? 0.5 : Math.pow(0.5 + 0.5 * Math.sin(t * st.speed + st.phase), 6);
        const a = Math.min(1, st.base + tw * 0.9);
        ctx!.fillStyle = st.c;
        ctx!.globalAlpha = a;
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.r * (1 + tw * 0.35), 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      draw(now / 1000);
      raf = requestAnimationFrame(frame);
    }

    seed();
    if (reduce) draw(0);
    else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      seed();
      if (reduce) draw(0);
    });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
