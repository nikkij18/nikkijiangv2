import type { Metadata } from "next";
import WorkBoard from "@/components/WorkBoard";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <main id="main" className="page page--work">
      <h1 className="page-title">Where I&rsquo;ve worked</h1>
      <WorkBoard />
    </main>
  );
}
