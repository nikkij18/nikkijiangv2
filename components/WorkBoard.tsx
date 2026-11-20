"use client";

import { useState } from "react";
import { work } from "@/lib/content";

export default function WorkBoard() {
  const [i, setI] = useState(0);
  const job = work[i];
  return (
    <div className="work">
      <ul className="work-list" role="tablist" aria-label="Organizations" aria-orientation="vertical">
        {work.map((j, k) => (
          <li key={j.org}>
            <button
              type="button"
              role="tab"
              id={`work-tab-${k}`}
              aria-selected={k === i}
              aria-controls="work-card"
              onClick={() => setI(k)}
              onMouseEnter={() => setI(k)}
              className="work-org"
            >
              <span className="work-org-name">{j.short ?? j.org}</span>
              <span className="work-org-date">{j.roles[0].dates}</span>
            </button>
          </li>
        ))}
      </ul>

      <article id="work-card" role="tabpanel" aria-labelledby={`work-tab-${i}`} className="card work-card" key={job.org}>
        <p className="card-file">{job.file}</p>
        <h2>{job.org}</h2>
        {job.kind && <p className="work-kind">{job.kind}</p>}
        <ul className="work-roles">
          {job.roles.map((r) => (
            <li key={r.title}>
              <span>{r.title}</span>
              <span className="mono">{r.dates}</span>
            </li>
          ))}
        </ul>
        <ul className="work-points">
          {job.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
