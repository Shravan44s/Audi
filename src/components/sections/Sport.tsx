'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CountUp } from '@/components/ui/CountUp';
import { SPORT } from '@/data/content';

const STATS = [
  { to: 13, label: 'Le Mans overall wins' },
  { to: 1980, label: 'quattro unveiled' },
  { to: 2026, label: 'Formula 1 debut' },
  { to: 2024, label: 'Dakar victory' },
];

/**
 * Audi Sport as a pinned split screen. Scroll steps through the series list on the
 * left; on the right each photo wipes in over the last behind a glowing scan edge
 * while it slowly pushes in, like a broadcast graphic.
 */
export function Sport() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-item]');
      const shots = gsap.utils.toArray<HTMLElement>('[data-shot]');
      const n = SPORT.length;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '#sport',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          onUpdate: (self) => {
            const i = Math.min(n - 1, Math.floor(self.progress * n * 0.999));
            items.forEach((el, k) => el.classList.toggle('is-active', k === i));
          },
        },
      });
      shots.forEach((el, i) => {
        const img = el.querySelector('[data-img]');
        tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1 }, i);
        if (i === 0) return;
        tl.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.45, ease: 'power2.inOut' }, i - 0.3);
      });
      tl.fromTo('[data-progress]', { scaleY: 0 }, { scaleY: 1, duration: n }, 0);

      gsap.from('[data-stat]', {
        y: 40,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-stats-grid]', start: 'top 85%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <section id="sport" className="relative h-[420svh]" aria-label="Audi Sport">
        <div className="sticky top-0 grid h-svh grid-rows-[auto_1fr] gap-6 overflow-clip px-4 pt-24 pb-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:gap-10 md:px-10 md:pt-28 md:pb-10">
          {/* Left: index */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="mono flex items-center gap-3 !text-red">
                <span className="h-px w-8 bg-red" /> 04 · Audi Sport
              </p>
              <h2 className="display mt-4 text-[clamp(1.5rem,3.2vw,3rem)]">
                From Le Mans
                <br />
                <span className="text-white/45">to Formula 1</span>
              </h2>
            </div>
            <div className="relative mt-6 hidden pl-6 md:block">
              <div className="absolute top-0 left-0 h-full w-px bg-line">
                <div data-progress className="h-full origin-top bg-red shadow-[0_0_8px_var(--red)]" />
              </div>
              <ol>
                {SPORT.map((s, i) => (
                  <li
                    key={s.id}
                    data-item
                    className="group border-b border-line py-4 opacity-35 transition-opacity duration-500 [&.is-active]:opacity-100"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="mono">
                        0{i + 1} · {s.series}
                      </p>
                      <p className="font-mono text-xl text-red tabular-nums">{s.stat.value}</p>
                    </div>
                    <p className="display mt-2 text-lg">{s.title}</p>
                    <p className="grid grid-rows-[0fr] text-sm text-muted transition-[grid-template-rows] duration-700 ease-out-expo group-[.is-active]:grid-rows-[1fr]">
                      <span className="overflow-hidden">
                        <span className="block pt-2">{s.body}</span>
                      </span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: broadcast frame */}
          <div className="cut relative min-h-0 overflow-hidden">
            {SPORT.map((s, i) => (
              <figure key={s.id} data-shot className="absolute inset-0" style={i ? { clipPath: 'inset(100% 0 0 0)' } : undefined}>
                <div data-img className="absolute inset-0">
                  <Image src={s.image} alt={`${s.series}: ${s.title}`} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" priority={i === 0} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                {/* scan edge riding the wipe */}
                <div className="absolute inset-x-0 top-0 h-px bg-[var(--red)] shadow-[0_0_16px_4px_var(--red)]" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-8">
                  <div>
                    <p className="mono !text-white/70">{s.series}</p>
                    <p className="display mt-2 text-xl md:text-3xl">{s.title}</p>
                    <p className="mt-2 max-w-md text-sm text-white/70 md:hidden">{s.body}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl text-red md:text-5xl">{s.stat.value}</p>
                    <p className="mono !text-white/60">{s.stat.label}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
            <div aria-hidden className="brackets pointer-events-none absolute inset-3 [--b:rgb(255_255_255/0.6)]" />
            <p className="mono absolute top-5 right-6 flex items-center gap-2 !text-white/80">
              <span className="blink size-1.5 bg-red" /> Rec
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 pb-24 md:px-10 md:pb-32">
        <dl data-stats-grid className="grid grid-cols-2 border-t border-l border-line md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} data-stat className="border-r border-b border-line p-6 md:p-10">
              <dd className="font-mono text-[clamp(2rem,4.4vw,4rem)] tabular-nums">
                <CountUp to={s.to} group={s.to < 1000} />
              </dd>
              <dt className="mono mt-2">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
