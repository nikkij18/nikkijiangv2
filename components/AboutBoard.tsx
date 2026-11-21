"use client";

import Image from "next/image";
import { useState } from "react";

/*
  A pinboard of things that shaped me, each tied to my head by a thin orange thread.
  Threads draw themselves in one by one; hovering (or tapping) an image lights up its thread and
  shows what it means. Positions are percentages of the board, so the layout scales as one piece.
*/

const BOARD_RATIO = 0.5; // height / width: a wide board that spans the page under the headline

// The main photo: me as a kid, cut out (no background). `head` is where the threads meet, as a
// fraction of the cut-out.
const MAIN = { src: "/images/about/main-baby.png", w: 412, h: 865, head: [0.55, 0.02] };

// Where the main photo sits: bottom, right of center, as tall as fits (64% of the board) without
// getting wider than 26%. Box and head point are in % of the board.
const FIGURE = (() => {
  const w = Math.min(26, 64 * BOARD_RATIO * (MAIN.w / MAIN.h));
  const h = (w * (MAIN.h / MAIN.w)) / BOARD_RATIO;
  const x = 75 - w / 2, y = 100 - h; // bottom right, leaving the bottom left for the headline
  return { src: MAIN.src, box: { x, y, w, h }, head: { x: x + MAIN.head[0] * w, y: y + MAIN.head[1] * h } };
})();

type Item = {
  src: string;
  w: number; // natural size, for the aspect ratio
  h: number;
  x: number; // left, % of board width
  y: number; // top, % of board height
  size: number; // width, % of board width
  tilt: number; // degrees
  label: string;
  note: string;
};

// Labels and notes are placeholders until Nikki writes them
const ITEMS: Item[] = [
  { src: "/images/about/highland-cow.png", w: 1072, h: 1452, x: 15, y: 24, size: 6.5, tilt: 1.5, label: "scottish-highlands", note: "Much of my inspiration comes from solo trips I've taken. From the Scottish Highlands to Taiwan to Qatar, I approach all of my design work with adventure and curiosity." },
  { src: "/images/about/gusa-poster.png", w: 1258, h: 1566, x: 3, y: 5, size: 8, tilt: -2.5, label: "gusa-senate", note: "I ran a fantastic social media campaign for student Senate with a recognizable brand and won re-election purely on social media without putting up a single flyer, check it out @nikki4gusa on instagram." },
  { src: "/images/about/flowers-walk.png", w: 336, h: 456, x: 32, y: 17, size: 6.5, tilt: 3, label: "fresh-flowers", note: "Nature is a huge influence on my work, and flowers are just one example. I love creating elegant arrangements from Trader Joe's flowers and I even made my own prom bouquet!" },
  { src: "/images/about/beach-volleyball.png", w: 882, h: 1442, x: 61, y: 5, size: 5.5, tilt: -2.5, label: "beach-volleyball", note: "I have played volleyball for most of my life (indoor and beach) and my favorite part is the game is designed around teamwork." },
  { src: "/images/about/hammerhead.png", w: 856, h: 786, x: 23, y: 2, size: 9, tilt: 2, label: "hammerhead", note: "Sharks are my favorite animal, I am fascinated by their sleek movement through the water. Water has always been a source of inspiration for me as my last name means river in Chinese. " },
  { src: "/images/about/georgetown-books.png", w: 1158, h: 1514, x: 53, y: 25, size: 6.5, tilt: 2, label: "Hoya-Saxa", note: "Georgetown has been my dream school since 6th grade. Although not known to be a tech school, the liberal arts education has shaped my perspecitve in ways a technically stronger school could not." },
  { src: "/images/about/meditation-poster.png", w: 1262, h: 1258, x: 46, y: 1, size: 9, tilt: -1.5, label: "meditation", note: "Raised in a Buddhist household and now marketing chair of the Buddhist Student Association, Buddhism has been a significant influence in my work and life." },
  { src: "/images/about/mahjong.png", w: 1156, h: 1432, x: 73, y: 12, size: 7, tilt: 1.5, label: "mahjong", note: "My cat HuiHui, freely roams around the neighborhood and constantly picks the most inconvenient spots to laydown. Her lack of interest in the convenient norm inspires my creative process." },
  { src: "/images/about/empty-room.png", w: 707, h: 1000, x: 89, y: 35, size: 8, tilt: 2.5, label: "empty-room", note: "My taste and eye for design was developed through a strong interest in interior design. The idea of filling an empty space excites me greatly." },
  { src: "/images/about/rooftop-dinner.png", w: 852, h: 1358, x: 86, y: 3, size: 6.5, tilt: -1.5, label: "balcony-dinners", note: "Hosting dinners on my balcony" },
  { src: "/images/about/concert.png", w: 1156, h: 1334, x: 40, y: 31, size: 7, tilt: -1, label: "concerts", note: "Off the clock: concerts, like the Chromakopia tour" },
  { src: "/images/about/little-me.png", w: 1844, h: 1498, x: 2, y: 31, size: 8.5, tilt: -2, label: "little-me", note: "Me, reading My Book About Me" },
];


// A thread from the top of my head to the bottom edge of an image (or its top edge, for the few that
// sit lower than my head). Every thread leaves the head heading straight up, then bends off toward its
// image, so they fan out from one point like the reference.
function thread(it: Item, head: { x: number; y: number }) {
  const hx = head.x, hy = head.y * BOARD_RATIO;
  const w = it.size, h = (it.size * it.h) / it.w;
  const top = it.y * BOARD_RATIO, bottom = top + h;
  const tx = it.x + w / 2;
  const above = bottom < hy;
  const ty = above ? bottom : top;
  const rise = Math.max(4, (hy - ty) * 0.55); // how far each thread climbs before bending away
  return `M ${hx} ${hy} C ${hx} ${hy - rise}, ${tx} ${ty + (above ? 8 : -8)}, ${tx} ${ty}`;
}

export default function AboutBoard() {
  const [active, setActive] = useState<number | null>(null);
  const shown = active === null ? null : ITEMS[active];

  return (
    <figure className="board" onPointerLeave={() => setActive(null)}>
      <div className={`board-art${active !== null ? " has-active" : ""}`} style={{ aspectRatio: `1 / ${BOARD_RATIO}` }}>
        <svg className="board-threads" viewBox={`0 0 100 ${100 * BOARD_RATIO}`} preserveAspectRatio="none" aria-hidden="true">
          {ITEMS.map((it, i) => (
            <path
              key={it.src}
              d={thread(it, FIGURE.head)}
              pathLength={1}
              className={active === i ? "is-on" : undefined}
              style={{ animationDelay: `${0.25 + i * 0.18}s` }}
            />
          ))}
        </svg>

        {ITEMS.map((it, i) => (
          <button
            key={it.src}
            type="button"
            className={`board-item${active === i ? " is-on" : ""}`}
            style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.size}%`, rotate: `${it.tilt}deg`, animationDelay: `${0.1 + i * 0.18}s` }}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(active === i ? null : i)}
            aria-label={`${it.label}: ${it.note}`}
          >
            <Image src={it.src} alt="" width={it.w} height={it.h} sizes="(max-width: 860px) 40vw, 16vw" />
          </button>
        ))}

        <div
          className="board-figure"
          style={{ left: `${FIGURE.box.x}%`, top: `${FIGURE.box.y}%`, width: `${FIGURE.box.w}%`, height: `${FIGURE.box.h}%` }}
        >
          <Image src={FIGURE.src} alt="Nikki as a kid, arms crossed in a leopard-print coat and sunglasses" fill sizes="(max-width: 860px) 45vw, 20vw" style={{ objectFit: "contain" }} />
        </div>
      </div>

      <figcaption className="board-cap mono" aria-live="polite">
        {shown ? (
          <>
            <span>
              {String((active ?? 0) + 1).padStart(2, "0")} {shown.label}
            </span>{" "}
            {shown.note}
          </>
        ) : (
          <span className="board-hint" />
        )}
      </figcaption>
    </figure>
  );
}
