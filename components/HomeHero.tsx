"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Bouquet3D from "@/components/Bouquet3D";

const SETTLE_AT = 4500; // ms: bouquet glides aside and the name comes in

export default function HomeHero() {
  const stage = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);
  const [ready, setReady] = useState(false);

  // Measure how far the bouquet must shift to sit in the middle of the screen.
  useLayoutEffect(() => {
    const measure = () => {
      const el = stage.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const prev = getComputedStyle(el).getPropertyValue("--to-center");
      const shift = window.innerWidth / 2 - (r.left + r.width / 2) + (parseFloat(prev) || 0);
      el.style.setProperty("--to-center", `${shift}px`);
    };
    measure();
    setReady(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const played = sessionStorage.getItem("intro-played") === "1";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played || reduce) {
      setSettled(true);
      return;
    }
    const id = setTimeout(() => {
      setSettled(true);
      sessionStorage.setItem("intro-played", "1");
    }, SETTLE_AT);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={`home-hero${settled ? " is-settled" : ""}${ready ? " is-ready" : ""}`}>
      <h1 className="home-name" aria-label="Nikki Jiang">
        <span className="line"><span>Nikki</span></span>
        <span className="line"><span>Jiang</span></span>
      </h1>
      <div className="home-stage" ref={stage}>
        <Bouquet3D className="home-bouquet" />
      </div>
    </div>
  );
}
