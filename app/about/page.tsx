import type { Metadata } from "next";
import { offTheClock } from "@/lib/content";
import AboutBoard from "@/components/AboutBoard";
import Signature from "@/components/Signature";

export const metadata: Metadata = { title: "About" };

/*
  Hierarchy, top to bottom: one big headline (ending on the orange ball the home page's
  dot shrinks into), then numbered sections with a label on the left and the copy on the right.
*/
// Each word is its own span so it can light up on hover
function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((w, i) => (
    <span key={i}>
      <span className="hw">{w}</span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

export default function AboutPage() {
  return (
    <main id="main" className="page page--about">
      <div className="about-scroll" data-scroll>
        <div className="about-top">
          <h1 className="about-head">
            <Words text="Hey! I’m Nikki. I study Global Health and build products" />{" "}
            <span className="about-head-light">
              <Words text="that start with the user" />
            </span>
            <span className="about-dot" aria-hidden="true" />
            <span className="sr-only">.</span>
          </h1>
          <AboutBoard />
        </div>

        <section className="about-row">
          <h2 className="about-label mono">
            <span>01</span> The throughline
          </h2>
          <div className="about-body">
            <p className="about-lead">
              People often ask how Global Health leads to product management. To me it&rsquo;s the same work: understand who you&rsquo;re building for, what do they need, and how to meet them.
            </p>
            <p>
              Whether it&rsquo;s a malaria treatment adherence program in rural Tanzania or feature
              improvements for MBA applicants at GMAC, I apply the same thinking. What does the current process look like?
              What&rsquo;s in their way? The setting changes, but the user-driven empathy stays the same, serving as the north star of all of
              my work.
            </p>
          </div>
        </section>

        <section className="about-row">
          <h2 className="about-label mono">
            <span>02</span> Where it started
          </h2>
          <div className="about-body">
            <p>
              I lived in six cities across three countries before I turned twelve. Moving that often taught me to walk
              into a room, figure out who&rsquo;s there, and learn what they need.
            </p>
          </div>
        </section>

        <section className="about-row">
          <h2 className="about-label mono">
            <span>03</span> At Georgetown
          </h2>
          <div className="about-body">
            <p>
              I study Global Health, with a minor in Science, Technology, and International Affairs and a concentration
              in Business, Growth, and Development. Paul Farmer and Eric Topol shaped how I think: healthcare is a human
              right, and technology should make care more human, not less.
            </p>
          </div>
        </section>

        <section className="about-row">
          <h2 className="about-label mono">
            <span>04</span> Off the clock
          </h2>
          <ul className="about-body about-list">
            {offTheClock.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>

        <div className="about-sig">
          <Signature />
        </div>
      </div>
    </main>
  );
}
