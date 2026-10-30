'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { stage } from '@/lib/stage';
import { useApp } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type Ctx = {
  getLenis: () => Lenis | null;
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number; immediate?: boolean }) => void;
};

const SmoothScrollContext = createContext<Ctx>({ getLenis: () => null, scrollTo: () => {} });

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Lenis, ScrollTrigger and every GSAP tween run on GSAP's single ticker, so scroll,
 * pinned DOM and the WebGL can never drift a frame apart.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = prefersReducedMotion();
    let lenis: Lenis | null = null;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, anchors: true, autoRaf: false });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      if (process.env.NODE_ENV === 'development') (window as unknown as { __lenis: Lenis }).__lenis = lenis;
    }

    // Scroll stays locked while the loader is up.
    let unsubIntro: (() => void) | undefined;
    if (lenis && !useApp.getState().introDone) {
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.stop();
      unsubIntro = useApp.subscribe((st) => {
        if (st.introDone) {
          lenis?.start();
          unsubIntro?.();
        }
      });
    }

    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let lastY = window.scrollY;
    const track = () => {
      const max = root.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      stage.velocity = lenis ? lenis.velocity : (y - lastY) * 0.6;
      lastY = y;
      root.style.setProperty('--scroll-progress', max > 0 ? (y / max).toFixed(4) : '0');
    };
    gsap.ticker.add(track);

    const onPointer = (e: PointerEvent) => {
      stage.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      stage.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const announce = () => window.dispatchEvent(new Event('audi:layout'));
    ScrollTrigger.addEventListener('refresh', announce);

    // Layout settles after fonts and images; refresh once more then.
    const settle = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(settle);
    window.addEventListener('load', settle);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.remove(track);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('load', settle);
      ScrollTrigger.removeEventListener('refresh', announce);
      unsubIntro?.();
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  const getLenis = useCallback(() => lenisRef.current, []);
  const scrollTo = useCallback<Ctx['scrollTo']>((target, opts) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: opts?.offset ?? 0, immediate: opts?.immediate, duration: 1.6 });
      return;
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (typeof el === 'number') window.scrollTo({ top: el });
    else el?.scrollIntoView();
  }, []);

  const value = useMemo(() => ({ getLenis, scrollTo }), [getLenis, scrollTo]);
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}
