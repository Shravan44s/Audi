'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSmoothScroll } from '@/components/providers/SmoothScroll';
import { STORY } from '@/data/content';
import { stage } from '@/lib/stage';
import { cn } from '@/lib/utils';

/** Chapter centres, matched to the camera shots in lib/stage.ts. */
const CENTRES = [0.16, 0.4, 0.64, 0.86];

/** Where each chapter's panel sits, opposite the car. */
const PLACEMENT = [
  'md:left-auto md:right-[5vw]',
  'md:right-auto md:left-[5vw]',
  'md:left-auto md:right-[5vw]',
  'md:right-auto md:left-[5vw]',
];

/**
 * The film. A tall section with a sticky viewport: the camera flies its shots against
 * the same scroll range, this component only cross-fades the HUD panels and runs the
 * timeline rail and the live speed readout for the rolling-road shot.
 */
export function Story() {
  const root = useRef<HTMLElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      const chapters = gsap.utils.toArray<HTMLElement>('[data-chapter]');
      const counter = root.current!.querySelector<HTMLElement>('[data-counter]')!;
      const ticks = gsap.utils.toArray<HTMLElement>('[data-tick]');
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            const i = Math.max(0, CENTRES.findLastIndex((c) => self.progress >= c - 0.12));
            counter.textContent = String(i + 1).padStart(2, '0');
            ticks.forEach((t, k) => t.classList.toggle('is-on', k <= i));
          },
        },
      });

      chapters.forEach((el, i) => {
        const c = CENTRES[i];
        const parts = el.querySelectorAll('[data-part]');
        tl.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.06, ease: 'power3.out' }, c - 0.12);
        tl.fromTo(parts, { autoAlpha: 0, x: i % 2 ? -30 : 30 }, { autoAlpha: 1, x: 0, stagger: 0.01, duration: 0.06 }, c - 0.1);
        if (i < chapters.length - 1) {
          tl.to(el, { clipPath: 'inset(100% 0 0% 0)', duration: 0.05, ease: 'power2.in' }, c + 0.09);
        }
      });
      tl.fromTo('[data-rail]', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 1 }, 0);
      tl.set({}, {}, 1);

      // Live speed: follows the rolling road the car is "driving" on.
      const tick = () => {
        if (speed.current) speed.current.textContent = String(Math.round(stage.roll * 108)).padStart(3, '0');
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="story" className="relative h-[560svh]" aria-label="The technology film">
      <div className="sticky top-0 h-svh overflow-clip">
        {STORY.map((ch, i) => (
          <article
            key={ch.id}
            data-chapter
            className={cn(
              'panel brackets absolute inset-x-4 bottom-[6svh] flex flex-col gap-4 p-6 md:top-1/2 md:bottom-auto md:w-[min(34vw,500px)] md:-translate-y-1/2 md:p-8',
              PLACEMENT[i],
            )}
            style={{ clipPath: 'inset(0 0 100% 0)' }}
          >
            <p data-part className="mono flex items-center gap-3 !text-red">
              <span className="h-px w-8 bg-red" />
              {ch.kicker}
            </p>
            <h2 data-part className="display text-[clamp(1.5rem,2.8vw,2.6rem)]">
              {ch.title[0]}
              <br />
              <span className="text-white/45">{ch.title[1]}</span>
            </h2>
            <p data-part className="text-sm text-muted md:text-base">
              {ch.body}
            </p>

            {ch.id === 'quattro' && (
              <div data-part className="mt-2 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <p className="mono">Road speed</p>
                  <p className="font-mono text-3xl tabular-nums">
                    <span ref={speed}>000</span>
                    <span className="mono ml-1">km/h</span>
                  </p>
                </div>
                <div>
                  <p className="mono">Torque split F / R</p>
                  <div className="mt-3 flex h-1.5 gap-0.5">
                    <span className="w-[40%] bg-white/70" />
                    <span className="w-[60%] bg-red shadow-[0_0_10px_var(--red)]" />
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-muted">40 : 60 · variable</p>
                </div>
              </div>
            )}

            {'list' in ch && (
              <ul data-part className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-4">
                {ch.list.map((item) => (
                  <li key={item.name} className="flex items-center gap-2 font-mono text-xs">
                    <span className="size-1.5" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                    {item.name}
                  </li>
                ))}
              </ul>
            )}

            {ch.id === 'progress' && (
              <div data-part className="mt-2 border-t border-line pt-4">
                <p className="mono mb-2">DC charge curve · 10 → 80 %</p>
                <svg viewBox="0 0 200 50" className="h-12 w-full overflow-visible">
                  <path d="M0 48 L18 6 L95 6 L130 20 L170 34 L200 40" fill="none" stroke="var(--red)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px var(--red))' }} />
                  <path d="M0 48 H200" stroke="rgb(255 255 255 / 0.15)" />
                  <text x="20" y="4" fill="currentColor" className="font-mono text-[7px]">320 kW</text>
                  <text x="172" y="50" fill="currentColor" className="font-mono text-[7px] opacity-50">18 min</text>
                </svg>
              </div>
            )}
          </article>
        ))}

        {/* Timeline rail */}
        <div className="absolute top-1/2 left-4 hidden -translate-y-1/2 flex-col items-center gap-4 md:left-8 md:flex">
          <span className="font-mono text-sm tabular-nums">
            <span data-counter>01</span>
            <span className="text-muted"> / 04</span>
          </span>
          <div className="relative h-48 w-px bg-line">
            <div data-rail className="absolute inset-0 origin-top bg-red shadow-[0_0_8px_var(--red)]" />
            {CENTRES.map((c, i) => (
              <span
                key={c}
                data-tick
                className="absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border border-line-strong bg-bg transition-colors duration-300 [&.is-on]:border-red [&.is-on]:bg-red"
                style={{ top: `${c * 100}%` }}
                aria-hidden
              >
                <span className="sr-only">{i + 1}</span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollTo('#models')}
          className="mono absolute right-5 bottom-6 hidden transition-colors hover:!text-fg md:right-10 md:block"
        >
          Skip film →
        </button>
      </div>
    </section>
  );
}
