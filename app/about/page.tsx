import type { Metadata } from "next";
import Image from "next/image";
import AboutTabs from "@/components/AboutTabs";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main id="main" className="page page--about">
      <figure className="polaroid">
        <Image
          src="/images/headshot.png"
          alt="Nikki Jiang in a black blazer, looking down, in front of dark wooden doors."
          width={1143}
          height={796}
          sizes="(max-width: 900px) 90vw, 36vw"
          priority
        />
        <figcaption>that&rsquo;s me</figcaption>
      </figure>
      <div className="about-copy">
        <h1 className="page-title">A bit about me</h1>
        <AboutTabs />
      </div>
    </main>
  );
}
