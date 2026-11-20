"use client";

import { useState } from "react";
import { skills, credentials, offTheClock } from "@/lib/content";

export default function AboutTabs() {
  const [tab, setTab] = useState<"story" | "toolkit">("story");
  return (
    <div className="about-tabs">
      <div role="tablist" aria-label="About" className="seg">
        <button type="button" role="tab" aria-selected={tab === "story"} onClick={() => setTab("story")}>The story</button>
        <button type="button" role="tab" aria-selected={tab === "toolkit"} onClick={() => setTab("toolkit")}>The toolkit</button>
      </div>

      {tab === "story" ? (
        <div role="tabpanel" className="about-panel" key="story">
          <p>
            I lived in six cities across three countries before I turned twelve. Moving that often taught me to walk into
            a room, figure out who&rsquo;s there, and learn what they need.
          </p>
          <p>
            I study Global Health, with a minor in Science, Technology, and International Affairs and a concentration in
            Business, Growth, and Development. Paul Farmer and Eric Topol shaped how I think: healthcare is a human right,
            and technology should make care more human, not less.
          </p>
          <h3>Off the clock</h3>
          <ul className="tags">
            {offTheClock.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div role="tabpanel" className="about-panel toolkit" key="toolkit">
          {skills.map((s) => (
            <div key={s.group}>
              <h3>{s.group}</h3>
              <ul className="tags">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3>Recognition</h3>
            <ul className="creds">
              {credentials.map((c) => (
                <li key={c.name}>
                  {c.name} <span className="mono">{c.from}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
