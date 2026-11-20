"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Bouquet3D from "@/components/Bouquet3D";
import { setLeaveHandler } from "@/lib/transition";

const SETTLE_AT = 3800; // ms: once the bouquet has bloomed, the name parts around it
const MAX_SIZE = 180; // px: largest the name gets
const MIN_SIZE = 28;
const STACKED = "(max-width: 860px) and (orientation: portrait)"; // matches the phone layout in globals.css
const MARGIN = 28; // px between the bouquet's widest reach and the ink of the I and the J

// Find the dot of a lowercase "i" in the given font by drawing it and scanning the pixels:
// its width, height, and horizontal center relative to the glyph's origin.
function measureIDot(font: string, size: number) {
  const W = Math.ceil(size), H = Math.ceil(size * 1.3), ox = Math.round(size * 0.3), base = Math.round(size * 1.1);
  const g = document.createElement("canvas");
  g.width = W;
  g.height = H;
  const ctx = g.getContext("2d", { willReadFrequently: true })!;
  ctx.font = font;
  ctx.fillText("i", ox, base);
  const px = ctx.getImageData(0, 0, W, H).data;
  let top = -1, bottom = -1, left = W, right = -1;
  for (let y = 0; y < H && bottom < 0; y++) {
    let inked = false;
    for (let x = 0; x < W; x++)
      if (px[(y * W + x) * 4 + 3] > 127) {
        inked = true; // only the dot's rows are scanned: the loop stops at the gap above the stem
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    if (inked && top < 0) top = y;
    else if (!inked && top >= 0) bottom = y;
  }
  if (top < 0 || bottom < 0) return { w: size * 0.12, h: size * 0.12, cx: size * 0.13 };
  return { w: right - left + 1, h: bottom - top, cx: (left + right + 1) / 2 - ox };
}

export default function HomeHero() {
  const hero = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const first = useRef<HTMLSpanElement>(null);
  const last = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const played = sessionStorage.getItem("intro-played") === "1";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(
      () => {
        setSettled(true);
        sessionStorage.setItem("intro-played", "1");
      },
      played || reduce ? 0 : SETTLE_AT,
    );
    return () => clearTimeout(id);
  }, []);

  // Size the name to fit, and place the words so the ink of the "I" and the "J" sits exactly the same
  // number of pixels from the bouquet's widest reach, with equal space outside the "N" and the "G".
  const reach = useRef(0);
  const edgeA = useRef<HTMLSpanElement>(null); // the last "I"
  const edgeB = useRef<HTMLSpanElement>(null); // the "J"
  const startA = useRef<HTMLSpanElement>(null); // the "N"
  const endB = useRef<HTMLSpanElement>(null); // the "g"
  const dotless = useRef<HTMLSpanElement>(null); // the "ı" in jiang
  const dot = useRef<HTMLSpanElement>(null); // its dot, which becomes the bouncing ball
  const measureRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const ink = document.createElement("canvas").getContext("2d");
    const measure = () => {
      const h = hero.current, n = name.current, a = first.current, b = last.current;
      const sA = startA.current, ea = edgeA.current, eb = edgeB.current, eB = endB.current;
      const bq = canvas.current?.querySelector("canvas");
      if (!h || !n || !a || !b || !sA || !ea || !eb || !eB || !bq || !ink) return;
      const W = h.getBoundingClientRect().width;
      const R = (reach.current || bq.getBoundingClientRect().width * 0.43) + MARGIN; // ink-to-bouquet-center, both sides

      // Ink extents of each word, relative to its own box (glyph side bearings make box edges unreliable)
      const inkBox = () => {
        const cs = getComputedStyle(ea);
        ink.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
        const at = (el: HTMLElement, r: DOMRect) => el.getBoundingClientRect().left - r.left;
        const aL = at(sA, ar) - ink.measureText("N").actualBoundingBoxLeft;
        const aR = at(ea, ar) + ink.measureText("i").actualBoundingBoxRight;
        const bL = at(eb, br) - ink.measureText("J").actualBoundingBoxLeft;
        const bR = at(eB, br) + ink.measureText("g").actualBoundingBoxRight;
        return { aL, aR, bL, bR, wa: a.offsetWidth, wb: b.offsetWidth };
      };

      const set = (el: HTMLElement, k: string, v: number) => el.style.setProperty(k, `${v}px`);
      let size: number;
      if (window.matchMedia(STACKED).matches) {
        // Phone held upright: Nikki above the bouquet, Jiang below it, split apart vertically
        const hr = h.getBoundingClientRect(), br = bq.getBoundingClientRect();
        const mid = hr.top + hr.height / 2;
        const top = br.top - mid, bottom = br.bottom - mid; // bouquet extent, relative to the hero's middle
        n.style.setProperty("--name-size", `${MAX_SIZE}px`);
        const widest = Math.max(a.offsetWidth, b.offsetWidth);
        const room = Math.min(hr.height / 2 + top, hr.height / 2 - bottom); // space above and below the bouquet
        size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, (MAX_SIZE * W * 0.9) / widest, room * 0.78));
        n.style.setProperty("--name-size", `${size}px`);
        const cs = getComputedStyle(ea);
        ink.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const fm = ink.measureText("N");
        const wh = b.offsetHeight;
        const baseline = (wh - (fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent)) / 2 + fm.fontBoundingBoxAscent;
        const capJ = ink.measureText("J").actualBoundingBoxAscent;
        const gap = Math.max(MARGIN * 0.6, size * 0.22);
        // Equal ink gaps: the bottom of "Nikki" (its baseline) and the top of the "J" each sit `gap` from the bouquet
        const aApart = top - gap - baseline + wh / 2;
        const bApart = bottom + gap - (baseline - capJ) + wh / 2;
        const aTogether = -wh / 2, bTogether = wh / 2;
        const over = Math.min(160, Math.max(40, 0.5 * (bApart - bTogether)));
        const back = Math.min(20, over * 0.12);
        set(h, "--bq-shift", 0);
        for (const k of ["together", "apart", "over", "back"]) {
          set(n, `--a-${k}`, 0);
          set(n, `--b-${k}`, 0);
        }
        set(n, "--a-together-y", aTogether);
        set(n, "--b-together-y", bTogether);
        set(n, "--a-apart-y", aApart);
        set(n, "--b-apart-y", bApart);
        set(n, "--a-over-y", aApart - over);
        set(n, "--b-over-y", bApart + over);
        set(n, "--a-back-y", aApart + back);
        set(n, "--b-back-y", bApart - back);
      } else {
        // Biggest size where N…I, the bouquet, and J…G all fit across the hero
        n.style.setProperty("--name-size", `${MAX_SIZE}px`);
        const m0 = inkBox();
        size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, (MAX_SIZE * (W - 2 * R)) / (m0.aR - m0.aL + m0.bR - m0.bL)));
        n.style.setProperty("--name-size", `${size}px`);
        const { aL, aR, bL, bR, wa, wb } = inkBox();

        // Center the whole group on screen: equal margins outside N and G, equal gaps either side of the
        // bouquet. The bouquet shifts slightly off-center to make up for JIANG being wider than NIKKI.
        const inkA = aR - aL, inkB = bR - bL;
        const c = (inkA - inkB) / 2; // bouquet center, relative to hero center
        const aApart = c - R - aR + wa / 2; // box-center offset putting the I's ink at c - R
        const bApart = c + R - bL + wb / 2; // box-center offset putting the J's ink at c + R
        const space = size * 0.28;
        const aTogether = c - (wa + space) / 2, bTogether = c + (wb + space) / 2;
        const over = Math.min(280, Math.max(90, 0.7 * (bApart - bTogether))); // how far past the final spot they fly
        const back = Math.min(28, over * 0.12); // and how far they spring back in before settling
        set(h, "--bq-shift", c);
        for (const k of ["together", "apart", "over", "back"]) {
          set(n, `--a-${k}-y`, 0);
          set(n, `--b-${k}-y`, 0);
        }
        set(n, "--a-together", aTogether);
        set(n, "--b-together", bTogether);
        set(n, "--a-apart", aApart);
        set(n, "--b-apart", bApart);
        set(n, "--a-over", aApart - over); // fly out past the final spot, then settle back in
        set(n, "--b-over", bApart + over);
        set(n, "--a-back", aApart + back);
        set(n, "--b-back", bApart - back);
      }

      // The square standing in for the dot of the "ı" in Jiang: an exact copy of the font's own i-dot
      const d = dot.current, di = dotless.current;
      if (d && di) {
        const md = ink.measureText("ı"), fm = ink.measureText("i");
        const iDot = measureIDot(ink.font, size);
        const baseline = (b.offsetHeight - (fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent)) / 2 + fm.fontBoundingBoxAscent;
        const restTop = baseline - md.actualBoundingBoxAscent - iDot.h; // sitting on top of the stem
        set(d, "left", di.offsetLeft + iDot.cx - iDot.w / 2);
        set(d, "top", restTop);
        set(d, "width", iDot.w);
        set(d, "height", iDot.h);
        set(d, "--dot-apex", -b.offsetHeight * 0.17);
        set(d, "--dot-lift", baseline - fm.actualBoundingBoxAscent - restTop); // where the real dot sits
      }
    };
    measureRef.current = measure;
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (hero.current) ro.observe(hero.current);
    return () => ro.disconnect();
  }, []);

  // Leaving for About: the dot swells until it fills the screen, and About opens on its color.
  const router = useRouter();
  const settledRef = useRef(false);
  useEffect(() => {
    settledRef.current = settled;
  }, [settled]);

  useEffect(() => {
    setLeaveHandler((href) => {
      const d = dot.current;
      if (href !== "/about" || !d || !settledRef.current) return false;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      if (document.querySelector(".dot-cover")) return true; // already on its way

      if (getComputedStyle(d).borderTopLeftRadius === "0px") return false; // still a plain i-dot, not the ball yet

      const r = d.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const rx = r.width / 2, ry = r.height / 2;
      const far = Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy));
      const cover = document.createElement("div");
      cover.className = "dot-cover";
      document.body.appendChild(cover);
      d.style.visibility = "hidden";
      const at = `at ${cx}px ${cy}px`;
      const grow = cover.animate(
        [
          { clipPath: `ellipse(${rx}px ${ry}px ${at})`, easing: "cubic-bezier(0.3, 0, 0.5, 1)" },
          { clipPath: `ellipse(${rx * 1.35}px ${ry * 0.8}px ${at})`, offset: 0.14, easing: "cubic-bezier(0.7, 0, 0.84, 0)" }, // squash before it swells
          { clipPath: `ellipse(${far + 4}px ${far + 4}px ${at})` },
        ],
        { duration: 1000, fill: "forwards" },
      );
      grow.onfinish = () => {
        document.documentElement.dataset.arrive = "dot"; // About appears in place, without its usual wipe
        router.push("/about");
        const started = performance.now();
        const reveal = () => {
          if (!document.querySelector(".page--about") && performance.now() - started < 4000) return requestAnimationFrame(reveal);
          cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: "ease-out", fill: "forwards" }).onfinish = () => cover.remove();
          setTimeout(() => delete document.documentElement.dataset.arrive, 1200);
        };
        requestAnimationFrame(reveal);
      };
      return true;
    });
    return () => setLeaveHandler(null);
  }, [router]);

  const onReach = useCallback((px: number) => {
    reach.current = px;
    measureRef.current();
  }, []);

  return (
    <div ref={hero} className={`home-hero${settled ? " is-settled" : ""}`}>
      <h1 ref={name} className="home-name" aria-label="Nikki Jiang">
        <span ref={first} className="word word--a" aria-hidden="true">
          <span ref={startA}>N</span>ikk<span ref={edgeA}>i</span>
        </span>
        <span ref={last} className="word word--b" aria-hidden="true">
          <span ref={edgeB}>J</span>
          <span ref={dotless}>ı</span>an<span ref={endB}>g</span>
          <span ref={dot} className="name-dot" />
        </span>
      </h1>
      <div ref={canvas} className="home-stage">
        <Bouquet3D className="home-bouquet" onReach={onReach} />
      </div>
      <p className={`home-hint mono${settled ? " is-on" : ""}`} aria-hidden="true">
        drag to turn the bouquet
      </p>
    </div>
  );
}
