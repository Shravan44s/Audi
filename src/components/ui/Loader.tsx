'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Rings } from '@/components/ui/Nav';
import { useApp } from '@/lib/store';
import { stage, welcomeLights } from '@/lib/stage';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * "System boot" preloader. Counts toward 90% on its own, finishes when the WebGL scene has
 * rendered (or after a safety timeout), then wipes away while the car is printed into the studio.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const reduced = prefersReducedMotion();
    const progress = { v: 0 };
    const render = () => {
      const v = Math.round(progress.v);
      if (label.current) label.current.textContent = String(v).padStart(2, '0');
      if (fill.current) fill.current.style.transform = `scaleX(${progress.v / 100})`;
    };

    const crawl = gsap.to(progress, { v: 90, duration: reduced ? 0.2 : 2.4, ease: 'power2.out', onUpdate: render });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      crawl.kill();
      const tl = gsap.timeline({
        onComplete: () => setGone(true),
      });
      tl.to(progress, { v: 100, duration: reduced ? 0.1 : 0.5, ease: 'power2.inOut', onUpdate: render })
        .to(root.current, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: reduced ? 0.2 : 1.1,
          ease: 'expo.inOut',
        })
        .add(() => useApp.getState().setIntroDone(), '-=0.55')
        // In the dark the car rolls onto its mark, blinks its welcome lights,
        // then the studio tubes strike on one after another.
        .to(stage, { intro: 1, duration: reduced ? 0.01 : 3.2, ease: 'power3.out' }, '-=0.7')
        .add(() => {
          const lt = gsap.timeline();
          welcomeLights(lt, 0);
        }, '-=1.4')
        .to(stage, { studio: 1, duration: reduced ? 0.01 : 2.6, ease: 'power1.inOut' }, '-=0.6');
    };

    const minTime = new Promise((r) => setTimeout(r, reduced ? 0 : 1400));
    const ready = new Promise<void>((r) => {
      // Wait for the canvas *and* the first real car, so the reveal is never the stand-in.
      if (useApp.getState().sceneReady && useApp.getState().modelReady) return r();
      const unsub = useApp.subscribe((s) => {
        if (s.sceneReady && s.modelReady) {
          unsub();
          r();
        }
      });
    });
    const timeout = new Promise((r) => setTimeout(r, 9000));
    Promise.all([minTime, Promise.race([ready, timeout])]).then(finish);

    return () => {
      crawl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-10 bg-[#040405] text-white"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-label="Loading"
    >
      <div className="mono absolute top-6 left-6 flex items-center gap-2 !text-white/50 md:top-10 md:left-10">
        <span className="blink size-1.5 bg-red" /> System boot
      </div>
      <div className="mono absolute top-6 right-6 !text-white/50 md:top-10 md:right-10">48.7651° N · 11.4237° E</div>

      {/* Rings draw themselves in apart, interlock, then catch the light; a hairline below fills with progress. */}
      <Rings className="loader-rings h-12 w-auto md:h-16" strokeWidth={2} />
      <div className="w-60 md:w-80">
        <div className="h-px w-full overflow-hidden bg-white/15">
          <div ref={fill} style={{ transform: 'scaleX(0)' }} className="h-full origin-left bg-red shadow-[0_0_12px_#f50537]" />
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="mono !text-white/50">Initialising showroom</span>
          <span className="font-mono text-sm tabular-nums">
            <span ref={label}>00</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
