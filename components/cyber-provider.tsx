"use client";

import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { usePathname } from "next/navigation";

export interface CyberState {
  mouse: { x: number; y: number };
  smoothMouse: { x: number; y: number };
  scroll: number;
  hoveredElement: string;
  activeRoute: string;
  mouseVelocity: { x: number; y: number };
}

const defaultState: CyberState = {
  mouse: { x: 0.5, y: 0.5 },
  smoothMouse: { x: 0.5, y: 0.5 },
  scroll: 0,
  hoveredElement: "",
  activeRoute: "/",
  mouseVelocity: { x: 0, y: 0 },
};

// Shared mutable store — avoids React state re-renders on every frame
export const cyberStore = {
  mouse: { x: 0.5, y: 0.5 },
  smoothMouse: { x: 0.5, y: 0.5 },
  scroll: 0,
  hoveredElement: "",
  activeRoute: "/",
  mouseVelocity: { x: 0, y: 0 },
};

const CyberContext = createContext<CyberState>(defaultState);

export function useCyber() {
  return useContext(CyberContext);
}

export function CyberProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, forceUpdate] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    cyberStore.activeRoute = pathname;
    forceUpdate((n) => n + 1);
  }, [pathname]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      cyberStore.mouse.x = x;
      cyberStore.mouse.y = y;

      const target = e.target as HTMLElement;
      const cyberEl = target?.closest?.("[data-cyber]");
      cyberStore.hoveredElement = cyberEl
        ? (cyberEl as HTMLElement).getAttribute("data-cyber") || ""
        : "";
    };

    const onScroll = () => {
      cyberStore.scroll = window.scrollY || 0;
    };

    const animate = () => {
      cyberStore.mouseVelocity.x = cyberStore.mouse.x - cyberStore.smoothMouse.x;
      cyberStore.mouseVelocity.y = cyberStore.mouse.y - cyberStore.smoothMouse.y;

      cyberStore.smoothMouse.x += (cyberStore.mouse.x - cyberStore.smoothMouse.x) * 0.05;
      cyberStore.smoothMouse.y += (cyberStore.mouse.y - cyberStore.smoothMouse.y) * 0.05;

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <CyberContext.Provider value={cyberStore}>{children}</CyberContext.Provider>
  );
}
