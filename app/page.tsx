import HomeHero from "@/components/HomeHero";
import Starfield from "@/components/Starfield";

export default function Home() {
  return (
    <main id="main" className="page page--home">
      <Starfield className="home-stars" />
      <HomeHero />
    </main>
  );
}
