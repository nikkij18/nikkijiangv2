"use client";

import { useEffect, useRef } from "react";

/*
  My signature, drawn live from a short clip of it being written. The clip is black ink on white, so
  each frame is redrawn onto a canvas with the white made fully transparent: only the ink is left,
  with no box around it on any background. Plays once, only after it has scrolled fully into view (blank until then); with reduced motion
  it shows the finished signature.
*/
const SRC = "/images/about/signature-n2k.mp4";
const INK: [number, number, number] = [20, 16, 20];

export default function Signature() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx) return;
    const v = document.createElement("video");
    v.src = SRC;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    let raf = 0;

    // One frame: dark pixels keep their darkness as opacity, white becomes transparent
    const paint = () => {
      if (!v.videoWidth) return;
      if (c.width !== v.videoWidth) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }
      ctx.drawImage(v, 0, 0);
      const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
        const a = Math.max(0, Math.min(1, (0.9 - lum) / 0.55)); // near-white drops out entirely
        d[i] = INK[0];
        d[i + 1] = INK[1];
        d[i + 2] = INK[2];
        d[i + 3] = a * 255;
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      paint();
      if (!v.ended) raf = requestAnimationFrame(loop);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMeta = () => {
      if (reduce) v.currentTime = v.duration; // straight to the finished signature
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("seeked", paint);
    v.addEventListener("ended", paint);

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || reduce) return;
        io.disconnect();
        v.currentTime = 0;
        v.playbackRate = 2.2; // the recording is slow; this makes it feel like a quick sign-off
        v.play().then(() => (raf = requestAnimationFrame(loop))).catch(() => {});
      },
      // wait until it's fully on screen and clear of the fade and pager at the bottom
      { threshold: 1, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(c);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      v.pause();
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("seeked", paint);
      v.removeEventListener("ended", paint);
    };
  }, []);

  return <canvas ref={canvas} className="signature" role="img" aria-label="Nikki Jiang's signature" />;
}
