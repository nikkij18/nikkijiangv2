"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PAGES } from "@/lib/pages";
import { tryLeave } from "@/lib/transition";

// Plain clicks on a link let the current page run its exit animation, if it has one.
function interceptLeave(e: React.MouseEvent, href: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (tryLeave(href)) e.preventDefault();
}

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
      acc.current = 0;
      if (tryLeave(next.href)) {
        lock.current = Date.now() + 2200; // the page is running its own exit
        return;
      }
      lock.current = Date.now() + 1100;
      router.push(next.href);
    };

    // Is there something under `el` that can still scroll in this direction? Then let it scroll.
    let lastScroll = 0;
    const scrollable = (el: EventTarget | null, dir: number) => {
      let n = el as HTMLElement | null;
      while (n && n !== document.body) {
        if (n.scrollHeight > n.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) {
          const room = dir > 0 ? n.scrollHeight - n.clientHeight - n.scrollTop : n.scrollTop;
          if (room > 2) return true;
        }
        n = n.parentElement;
      }
      return false;
    };
    const page = () => document.querySelector<HTMLElement>("[data-scroll]") ?? document.getElementById("main"); // a long page marks its scroller

    const onWheel = (e: WheelEvent) => {
      // On small screens the page scrolls normally; only flip pages when the screen fits.
      if (document.documentElement.scrollHeight > window.innerHeight + 2) return;
      if (scrollable(e.target, e.deltaY)) {
        lastScroll = Date.now();
        acc.current = 0;
        return;
      }
      // A page that scrolls turns over only once you've reached its end, and not on the same flick
      if (Date.now() - lastScroll < 500) {
        lastScroll = Date.now();
        return;
      }
      if (Date.now() < lock.current) return;
      acc.current += e.deltaY;
      if (Math.abs(acc.current) > 60) go(acc.current > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      const dir = e.key === "ArrowDown" || e.key === "PageDown" ? 1 : e.key === "ArrowUp" || e.key === "PageUp" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const p = page();
      if (p && scrollable(p, dir)) {
        // A long page scrolls with the keys first
        p.scrollBy({ top: dir * (e.key.startsWith("Page") ? p.clientHeight * 0.85 : 90), behavior: "smooth" });
        return;
      }
      go(dir);
    };

    // Touch: on a screen that doesn't scroll (like Home on a phone), swipe up/down to change pages.
    // Swipes that start on the bouquet turn it instead.
    let touch: { x: number; y: number; ok: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const fits = document.documentElement.scrollHeight <= window.innerHeight + 2;
      const onCanvas = (e.target as HTMLElement | null)?.closest?.("canvas, input, textarea, select");
      touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, ok: fits && !onCanvas } : null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch?.ok || Date.now() < lock.current) return;
      const t = e.changedTouches[0];
      const dy = touch.y - t.clientY, dx = touch.x - t.clientX;
      touch = null;
      if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) go(dy > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [index, router]);

  const next = PAGES[index + 1];

  return (
    <>
      <header className={`hud hud--${tone}`}>
        <nav aria-label="Pages" className="hud-nav">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="hud-chip"
              aria-current={p.href === path ? "page" : undefined}
              onClick={(e) => interceptLeave(e, p.href)}
            >
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
          <Link href={next.href} className="pager-next" onClick={(e) => interceptLeave(e, next.href)}>
            Next: {next.label}
          </Link>
        )}
      </div>
    </>
  );
}
