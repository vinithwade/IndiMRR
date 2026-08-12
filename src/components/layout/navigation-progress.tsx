"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Instant top progress bar on internal link clicks so navigation feels responsive
 * while the RSC payload loads (especially noticeable in dev without prefetch).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  // Complete bar when the route actually changes
  useEffect(() => {
    if (!visible) return;
    setWidth(100);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 180);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const clearPulse = () => {
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      const next = new URL(href, window.location.origin);
      if (
        next.pathname === window.location.pathname &&
        next.search === window.location.search
      ) {
        return;
      }

      setVisible(true);
      setWidth(12);
      clearPulse();
      timer.current = window.setInterval(() => {
        setWidth((w) => (w >= 84 ? w : w + Math.max(1, (84 - w) * 0.08)));
      }, 120);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearPulse();
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(200,240,112,0.65)] transition-[width] duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
