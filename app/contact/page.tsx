import type { Metadata } from "next";
import CopyEmail from "@/components/CopyEmail";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main id="main" className="page page--contact">
      <p className="mono">&gt; open to PM internships and new-grad roles, especially in health</p>
      <h1>Say hi.</h1>
      <CopyEmail email={site.email} />
      <ul className="socials">
        <li><a href={site.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
        <li><a href={site.links.github} target="_blank" rel="noreferrer">GitHub</a></li>
        <li><a href={site.links.pinterest} target="_blank" rel="noreferrer">Pinterest</a></li>
        {site.resume && <li><a href={site.resume}>Resume</a></li>}
      </ul>
    </main>
  );
}
