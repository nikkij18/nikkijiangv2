import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Hud from "@/components/Hud";
import "./globals.css";

// One family across the whole site: Geist for everything, Geist Mono for small labels
const sans = Geist({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], variable: "--font-sans" }); // latin-ext: dotless ı in the home name
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://nikkijiang.com"),
  title: { default: "Nikki Jiang", template: "%s · Nikki Jiang" },
  description:
    "Nikki Jiang is a Georgetown Global Health student heading into product management, building healthcare tools for the people safety-net systems serve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        <a className="skip" href="#main">Skip to content</a>
        <Hud />
        {children}
      </body>
    </html>
  );
}
