'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Box, Layers, Move3d } from 'lucide-react';
import { useSmoothScroll } from '@/components/providers/SmoothScroll';
import { HudButton } from '@/components/ui/HudButton';
import { Scramble } from '@/components/ui/Scramble';
import { CARS, PART_COLORS, type Finish, type PartKey } from '@/data/cars';
import { stage } from '@/lib/stage';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

const LEGEND: PartKey[] = ['body', 'glass', 'cabin', 'cockpit', 'seats', 'wheels', 'drive', 'energy'];

const TABS = [
  { id: 'specs', label: 'Specs' },
  { id: 'size', label: 'Size' },
  { id: 'features', label: 'Highlights' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** Swatch shading per finish: gloss gets a hot highlight, matt stays flat, pearl shifts hue. */
const SWATCH: Record<Finish, (hex: string) => string> = {
  metallic: (hex) => `linear-gradient(135deg, #ffffff88, ${hex} 38%, #000 130%)`,
  pearl: (hex) => `linear-gradient(135deg, #fff9 0%, #b8d4ff55 18%, ${hex} 42%, #ffd6f033 80%, #000 130%)`,
  matt: (hex) => `linear-gradient(135deg, ${hex}, ${hex} 60%, #0008 140%)`,
  solid: (hex) => `linear-gradient(135deg, #ffffff44, ${hex} 30%, ${hex} 80%, #0006 130%)`,
};

/**
 * Click-and-drag surface over the WebGL car. The canvas is pointer-inert (it sits
 * behind the page), so this layer turns a drag into a camera orbit and a click
 * into the open/close toggle.
 */
function CarHitArea() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let down = false;
    let moved = 0;
    let px = 0;
    let py = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = 0;
      px = e.clientX;
      py = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) {
        stage.drag.active = true;
        stage.drag.az -= dx * 0.006;
        stage.drag.el = Math.max(-0.1, Math.min(0.9, stage.drag.el + dy * 0.004));
      }
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = () => {
      if (down && moved <= 6) {
        const s = useApp.getState();
        s.setExploded(!s.exploded);
      }
      down = false;
      stage.drag.active = false;
    };
    const enter = () => (stage.hover = true);
    const leave = () => (stage.hover = false);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      stage.hover = false;
    };
  }, []);

  return (
    <div
      ref={ref}
      data-cursor
      role="button"
      tabIndex={0}
      aria-label="Open or close the car; drag to orbit"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const s = useApp.getState();
          s.setExploded(!s.exploded);
        }
      }}
      className="absolute inset-x-0 top-[16%] bottom-[28%] cursor-grab touch-pan-y outline-none active:cursor-grabbing md:inset-x-[24%] md:top-[14%] md:bottom-[16%]"
    />
  );
}

/** Showroom: a full-screen configurator that holds while the camera circles the car. */
export function Showroom() {
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const index = useApp((s) => s.car);
  const setCar = useApp((s) => s.setCar);
  const exploded = useApp((s) => s.exploded);
  const setExploded = useApp((s) => s.setExploded);
  const paint = useApp((s) => s.paint);
  const setPaint = useApp((s) => s.setPaint);
  const glb = useApp((s) => s.glb);
  const car = CARS[index];
  const { scrollTo } = useSmoothScroll();
  const [tab, setTab] = useState<Tab>('specs');
  const chosen = car.paints.find((p) => p.hex === paint[car.id]) ?? car.paints[0];
  const rows = tab === 'size' ? car.details.dimensions : car.details.performance;

  // The accent colour flows through CSS so every UI element can pick it up.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', car.glow);
  }, [car.glow]);

  useGSAP(
    () => {
      // A model swap waits for the drive-in; a tab switch answers straight away.
      const delay = panel.current?.dataset.car === String(index) ? 0 : 1.2;
      if (panel.current) panel.current.dataset.car = String(index);
      gsap.fromTo('[data-spec]', { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.04, ease: 'expo.out', delay });
      gsap.fromTo('[data-meter]', { scaleX: 0 }, { scaleX: 1, duration: 1.4, stagger: 0.05, ease: 'expo.out', delay: delay + 0.1 });
    },
    { scope: panel, dependencies: [index, tab] },
  );

  useGSAP(
    () => {
      gsap.from('[data-side]', {
        autoAlpha: 0,
        y: 30,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: 'top 40%', once: true },
      });
      // Leaving the showroom closes the car and forgets any drag.
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top 60%',
        end: 'bottom 40%',
        onLeave: reset,
        onLeaveBack: reset,
      });
      function reset() {
        useApp.getState().setExploded(false);
        gsap.to(stage.drag, { az: 0, el: 0, duration: 1.4, ease: 'power3.inOut' });
      }
    },
    { scope: root },
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setCar((index + 1) % CARS.length);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setCar((index - 1 + CARS.length) % CARS.length);
  };

  return (
    <section ref={root} id="models" className="relative h-[180svh]">
      <div className="sticky top-0 h-svh overflow-clip">
        <CarHitArea />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-[1600px] flex-col justify-between px-4 pt-20 pb-5 md:px-10 md:pt-24 md:pb-8">
          {/* Header */}
          <div data-side className="flex items-start justify-between">
            <div>
              <p className="mono flex items-center gap-3 !text-red">
                <span className="h-px w-8 bg-red" /> 02 · Showroom
              </p>
              <Scramble key={car.id} as="h2" text={car.name} className="display mt-3 block max-w-[16ch] text-[clamp(1.2rem,2.6vw,2.4rem)]" />
              <p className="mono mt-2" style={{ color: car.glow }}>
                {car.line}
              </p>
              <p key={`intro-${car.id}`} className="rate-pop mt-3 hidden max-w-sm text-sm text-muted md:block">
                <span className="text-fg">{car.tagline}</span> {car.details.intro}
              </p>
            </div>
            <div className="mono hidden text-right md:block">
              <p className="flex items-center justify-end gap-2">
                <Move3d className="size-3.5" /> Drag to orbit
              </p>
              <p>Click car to {exploded ? 'close' : 'open'}</p>
              <p className="mt-2 !text-fg/70">{glb[car.id] ? 'Model · photoreal' : 'Model · holo preview'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Model index */}
            <div
              data-side
              role="radiogroup"
              aria-label="Choose a model"
              onKeyDown={onKey}
              className="no-scrollbar pointer-events-auto -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:w-72 md:flex-col md:gap-0 md:overflow-visible md:px-0"
              data-lenis-prevent-touch
            >
              {CARS.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={i === index}
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => setCar(i)}
                  className={cn(
                    'group relative flex shrink-0 items-center gap-4 border-line py-3 pr-4 pl-4 text-left transition-colors md:border-t md:pl-5',
                    i === index ? 'bg-white/[0.06] md:bg-transparent' : 'hover:bg-white/[0.04]',
                  )}
                >
                  <span
                    className="absolute top-0 left-0 h-full w-0.5 origin-top transition-transform duration-500"
                    style={{ background: c.glow, transform: i === index ? 'scaleY(1)' : 'scaleY(0)', boxShadow: `0 0 10px ${c.glow}` }}
                  />
                  <span className={cn('font-mono text-xs', i === index ? 'text-red' : 'text-muted')}>0{i + 1}</span>
                  <span className="whitespace-nowrap">
                    <span className={cn('block text-sm font-medium transition-colors', i === index ? 'text-fg' : 'text-muted group-hover:text-fg')}>
                      {c.name.replace(' performance', '')}
                    </span>
                    <span className="mono hidden !text-[0.58rem] md:block">{c.line}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Legend while open */}
            <ul
              className={cn(
                'hidden max-w-md flex-wrap justify-center gap-x-5 gap-y-2 transition-opacity duration-700 lg:flex',
                exploded ? 'opacity-100' : 'opacity-0',
              )}
            >
              {LEGEND.map((k) => (
                <li key={k} className="flex items-center gap-2 font-mono text-[0.65rem] tracking-wider text-fg/80 uppercase">
                  <span className="size-1.5 rotate-45" style={{ background: PART_COLORS[k], boxShadow: `0 0 8px ${PART_COLORS[k]}` }} />
                  {car.parts[k].title}
                </li>
              ))}
            </ul>

            {/* Telemetry + configurator */}
            <div ref={panel} data-side className="panel brackets pointer-events-auto w-full p-5 md:w-[340px] md:p-6">
              <div role="tablist" aria-label="Car details" className="-mt-1 mb-4 flex gap-1 border-b border-line">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'mono relative -mb-px px-2 pb-2.5 transition-colors hover:!text-fg',
                      tab === t.id && '!text-fg',
                    )}
                  >
                    {t.label}
                    <span
                      className="absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-500 ease-out-expo"
                      style={{ background: car.glow, boxShadow: `0 0 8px ${car.glow}`, transform: tab === t.id ? 'scaleX(1)' : 'scaleX(0)' }}
                    />
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="no-scrollbar max-h-[30svh] overflow-y-auto md:max-h-[34svh]" data-lenis-prevent>
                {tab === 'features' ? (
                  <ul className="space-y-3">
                    {car.details.highlights.map((h) => (
                      <li key={h.title} data-spec className="flex gap-3">
                        <span className="mt-1.5 size-1.5 shrink-0 rotate-45" style={{ background: car.glow, boxShadow: `0 0 8px ${car.glow}` }} />
                        <span>
                          <span className="block text-sm font-medium">{h.title}</span>
                          <span className="block text-xs text-muted">{h.body}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <dl className="grid grid-cols-1 gap-y-2.5">
                    {rows.map((s, i) => (
                      <div key={s.k} data-spec>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="mono !text-[0.6rem]">{s.k}</dt>
                          <dd className="text-right font-mono text-xs tabular-nums md:text-sm">{s.v}</dd>
                        </div>
                        <div className="mt-1 h-px bg-line">
                          <div
                            data-meter
                            className="h-full origin-left"
                            style={{ width: `${Math.max(18, 94 - i * 10)}%`, background: car.glow, boxShadow: `0 0 8px ${car.glow}` }}
                          />
                        </div>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <p className="mono mb-3 flex justify-between">
                  Paint
                  <span className="!text-fg">
                    {chosen.name} <span className="text-muted">· {chosen.finish}</span>
                  </span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {car.paints.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      aria-label={`${p.name}, ${p.finish}`}
                      title={`${p.name} · ${p.finish}`}
                      aria-pressed={paint[car.id] === p.hex}
                      onClick={() => setPaint(car.id, p.hex)}
                      className={cn(
                        'size-6 rotate-45 transition-transform duration-300 hover:scale-125',
                        paint[car.id] === p.hex ? 'scale-125 ring-1 ring-fg ring-offset-2 ring-offset-bg' : '',
                      )}
                      style={{ background: SWATCH[p.finish](p.hex) }}
                    />
                  ))}
                </div>
                {!glb[car.id] && <p className="mt-2 font-mono text-[0.6rem] text-muted">Paint applies to the photoreal model.</p>}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <HudButton onClick={() => setExploded(!exploded)} className="flex-1">
                  {exploded ? <Box className="size-3.5" /> : <Layers className="size-3.5" />}
                  {exploded ? 'Close up' : 'Look inside'}
                </HudButton>
                <HudButton variant="ghost" href="#test-drive" onClick={(e) => (e.preventDefault(), scrollTo('#test-drive'))}>
                  Drive <ArrowRight className="size-3.5" />
                </HudButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
