"use client";

import Image from "next/image";
import { useState } from "react";
import { projects, writing } from "@/lib/content";

type Item =
  | { type: "project"; title: string; kind: string; problem: string; made: string; href: string; image: string; alt: string }
  | { type: "paper"; title: string; kind: string; note: string; href: string };

const items: Item[] = [
  ...projects.map((p) => ({ type: "project" as const, ...p })),
  ...writing.map((w) => ({ type: "paper" as const, kind: "Research paper", ...w })),
];

export default function ProjectBoard() {
  const [i, setI] = useState(0);
  const it = items[i];

  return (
    <div className="proj">
      <div className="proj-stage" key={it.title}>
        <div className="proj-text">
          <p className="mono proj-kind">{it.kind}</p>
          <h2>{it.title}</h2>
          {it.type === "project" ? (
            <dl>
              <dt>The problem</dt>
              <dd>{it.problem}</dd>
              <dt>What I made</dt>
              <dd>{it.made}</dd>
            </dl>
          ) : (
            <p className="proj-note">{it.note}</p>
          )}
          <a className="btn" href={it.href} target="_blank" rel="noreferrer">
            {it.type === "project" ? "Open the project" : "Read the PDF"}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div className="proj-visual">
          {it.type === "project" ? (
            <div className="proj-shot">
              <Image src={it.image} alt={it.alt} width={1440} height={900} sizes="(max-width: 900px) 100vw, 55vw" priority />
            </div>
          ) : (
            <div className="proj-paper" aria-hidden="true">
              <p className="mono">{it.title.toLowerCase().replace(/\s+/g, "-")}.pdf</p>
              <p className="proj-paper-title">{it.title}</p>
              <p className="proj-paper-by">Nikki Jiang</p>
              <span className="proj-paper-lines" />
            </div>
          )}
        </div>
      </div>

      <ul className="proj-tabs" role="tablist" aria-label="Projects and papers">
        {items.map((x, k) => (
          <li key={x.title} style={{ "--tilt": `${[-3, 2, -1.5, 3, -2][k % 5]}deg` } as React.CSSProperties}>
            <button type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className="proj-tab">
              <span className="mono">{x.type === "paper" ? "pdf" : String(k + 1).padStart(2, "0")}</span>
              {x.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
