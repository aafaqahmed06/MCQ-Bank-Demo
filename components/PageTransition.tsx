"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Wraps the page content with a quick fade-out / fade-in on internal
 * navigation. Link clicks are intercepted (capture phase) so the current
 * screen fades to the page background before `router.push` fires, then the
 * new screen fades in. Browser back/forward still get the fade-in via the
 * `key={pathname}` remount.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [overlay, setOverlay] = useState<"none" | "out" | "in">("none");
  const pendingHref = useRef<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      pendingHref.current = url.pathname + url.search + url.hash;
      setOverlay("out");
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (overlay !== "out" || !pendingHref.current) return;
    const href = pendingHref.current;
    pendingHref.current = null;
    const t = setTimeout(() => {
      setOverlay("in");
      router.push(href);
    }, 155);
    return () => clearTimeout(t);
  }, [overlay, router]);

  useEffect(() => {
    if (overlay !== "in") return;
    const t = setTimeout(() => setOverlay("none"), 250);
    return () => clearTimeout(t);
  }, [overlay]);

  const overlayEl =
    overlay === "none" ? null : (
      <div
        aria-hidden
        className={`page-transition-overlay ${
          overlay === "out" ? "page-transition-overlay-out" : "page-transition-overlay-in"
        }`}
      />
    );

  return (
    <>
      {overlayEl}
      <div key={pathname} className="page-transition-fade-in">
        {children}
      </div>
    </>
  );
}
