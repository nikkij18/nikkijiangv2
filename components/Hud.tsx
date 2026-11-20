"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PAGES } from "@/lib/pages";

export default function Hud() {
  const path = usePathname();
  const router = useRouter();
  const index = Math.max(0, PAGES.findIndex((p) => p.href === path));
  const tone = PAGES[index].tone;
  const lock = useRef(0);
  const acc = useRef(0);

  useEffect(() => {
    PAGES.forEach((p) => router.prefetch(p.href));
  }, [router]);

  useEffect(() => {
    const go = (dir: 1 | -1) => {
      const next = PAGES[index + dir];
      if (!next) return;
      lock.current = Date.now() + 1100;
      acc.current = 0;
      router.push(next.href);
    };

    const scrollable = (el: EventTarget | null) => {
      let n = el as HTMLElement | null;
      while (n && n !== document.body) {
        if (n.scrollHeight > n.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) return true;
        n = n.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      // On small screens the page scrolls normally; only flip pages when the screen fits.
      if (document.documentElement.scrollHeight > window.innerHeight + 2) return;
      if (scrollable(e.target)) return;
      if (Date.now() < lock.current) return;
      acc.current += e.deltaY;
      if (Math.abs(acc.current) > 60) go(acc.current > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [index, router]);

  const next = PAGES[index + 1];

  return (
    <>
      <header className={`hud hud--${tone}`}>
        <nav aria-label="Pages" className="hud-nav">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="hud-chip" aria-current={p.href === path ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className={`pager pager--${tone}`}>
        <span className="pager-count">
          {String(index + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
        </span>
        {next && (
          <Link href={next.href} className="pager-next">
            Next: {next.label}
          </Link>
        )}
      </div>
    </>
  );
}
