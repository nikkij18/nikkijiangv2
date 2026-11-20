import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Cutive_Mono, Geist } from "next/font/google";
import Hud from "@/components/Hud";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", axes: ["opsz", "wdth"] });
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });
const simple = Geist({ subsets: ["latin"], weight: "500", variable: "--font-simple" });
const mono = Cutive_Mono({ weight: "400", subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://nikkijiang.com"),
  title: { default: "Nikki Jiang", template: "%s · Nikki Jiang" },
  description:
    "Nikki Jiang is a Georgetown Global Health student heading into product management, building healthcare tools for the people safety-net systems serve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable} ${simple.variable}`}>
      <body suppressHydrationWarning>
        <a className="skip" href="#main">Skip to content</a>
        <Hud />
        {children}
      </body>
    </html>
  );
}
