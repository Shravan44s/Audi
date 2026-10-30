'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useSmoothScroll } from '@/components/providers/SmoothScroll';
import { HudButton } from '@/components/ui/HudButton';
import { Scramble } from '@/components/ui/Scramble';
import { CARS } from '@/data/cars';
import { useApp } from '@/lib/store';

/** Arc gauge that sweeps to its value once the intro has played. */
function Gauge({ value, max, label, unit, play }: { value: number; max: number; label: string; unit: string; play: boolean }) {
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (!play) return;
      const o = { v: 0 };
      gsap.to(o, {
        v: value,
        duration: 2.4,
        delay: 1.2,
        ease: 'expo.out',
        onUpdate: () => {
          if (num.current) num.current.textContent = Math.round(o.v).toString();
          arc.current?.setAttribute('stroke-dashoffset', String(1 - (o.v / max) * 0.75));
        },
      });
    },
    { dependencies: [play] },
  );
  return (
    <div className="relative size-28 md:size-32">
      <svg viewBox="0 0 100 100" className="absolute inset-0 rotate-[135deg]">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" pathLength={1} strokeDasharray="0.75 1" />
        <circle
          ref={arc}
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="var(--red)"
          strokeWidth="2.5"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset="1"
          style={{ filter: 'drop-shadow(0 0 6px var(--red))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl tabular-nums md:text-3xl">
          <span ref={num}>0</span>
        </span>
        <span className="mono !text-[0.55rem]">{unit}</span>
      </div>
      <span className="mono absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap !text-[0.55rem]">{label}</span>
    </div>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const introDone = useApp((s) => s.introDone);
  const car = CARS[0];
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      if (!introDone) return;
      gsap.from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 1.4 });
      gsap.from('[data-hero-line]', { scaleX: 0, duration: 1.6, ease: 'expo.inOut', delay: 0.9, stagger: 0.1 });
      // Scroll-out: the HUD lifts away as the story takes over.
      gsap.to('[data-hero-content]', {
        yPercent: -14,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom 30%', scrub: true },
      });
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <section ref={root} id="hero" className="relative h-svh min-h-[680px] overflow-clip">
      <div data-hero-content className="absolute inset-0 mx-auto max-w-[1600px] px-5 pt-24 pb-8 md:px-10 md:pt-28 md:pb-10">
        {/* Top HUD row */}
        <div data-hero-fade className="flex items-start justify-between">
          <div className="mono space-y-1.5">
            <p className="flex items-center gap-2 !text-fg">
              <span className="blink size-1.5 bg-red" /> Live · Studio 01
            </p>
            <p>Ingolstadt · 48.7651° N 11.4237° E</p>
          </div>
          <div className="mono hidden text-right md:block">
            <p>Unit · {car.name}</p>
            <p className="!text-fg">Status · Ready</p>
          </div>
        </div>

        {/* Bottom: headline left, telemetry right */}
        <div className="absolute inset-x-5 bottom-8 flex flex-col gap-10 md:inset-x-10 md:bottom-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div data-hero-line className="mb-6 h-px w-24 origin-left bg-red" />
            <h1 className="display text-[clamp(1.9rem,4.6vw,4.4rem)]">
              <Scramble as="span" className="block" text="Vorsprung" play={introDone} delay={900} />
              <Scramble as="span" className="block text-white/45" text="durch Technik" play={introDone} delay={1150} />
            </h1>
            <p data-hero-fade className="mt-6 max-w-md text-sm text-muted md:text-base">
              Four Audis in a studio of light. Scroll and the camera moves around them; open one up and see what is
              inside.
            </p>
            <div data-hero-fade className="mt-8 flex flex-wrap gap-3">
              <HudButton href="#models" onClick={(e) => (e.preventDefault(), scrollTo('#models'))}>
                Enter showroom <ArrowRight className="size-3.5" />
              </HudButton>
              <HudButton variant="ghost" href="#story" onClick={(e) => (e.preventDefault(), scrollTo('#story'))}>
                Watch the film
              </HudButton>
            </div>
          </div>

          <div data-hero-fade className="hidden gap-8 pb-6 md:flex">
            <Gauge value={680} max={750} label="Boost power" unit="kW" play={introDone} />
            <Gauge value={568} max={700} label="Range WLTP" unit="km" play={introDone} />
            <Gauge value={320} max={350} label="DC charging" unit="kW" play={introDone} />
          </div>
        </div>

        {/* Frame corners */}
        <div aria-hidden className="brackets pointer-events-none absolute inset-3 [--s:22px] md:inset-6" />
      </div>
    </section>
  );
}
