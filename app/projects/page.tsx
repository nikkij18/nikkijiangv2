import type { Metadata } from "next";
import ProjectBoard from "@/components/ProjectBoard";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <main id="main" className="page page--projects">
      <h1 className="sr-only">Projects and research</h1>
      <ProjectBoard />
    </main>
  );
}
