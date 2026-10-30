'use client';

import { useId, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FOUNDERS, HISTORY } from '@/data/content';
import { cn } from '@/lib/utils';

/** Ring centres in the badge (interlocked) and as four separate companies (spread). */
const JOINED = [43, 65, 87, 109];
const SPREAD = [19, 57, 95, 133];

/**
 * The badge, built from its history. Scrolling draws four separate rings over the four
 * founding companies, then slides them together into the Auto Union badge of 1932 and
 * runs a light across the chrome.
 */
function Founding() {
  const id = useId().replace(/:/g, '');
  const circles = JOINED.map((cx) => <circle key={cx} data-ring cx={cx} cy="20" r="15" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />);

  return (
    <div data-founding className="relative h-[260svh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-clip px-4">
        <div className="absolute top-24 left-4 md:top-28 md:left-10">
          <p className="mono flex items-center gap-3 !text-red">
            <span className="h-px w-8 bg-red" /> 03 · Heritage
          </p>
          <h2 className="display mt-4 text-[clamp(1.5rem,3.2vw,3rem)]">
            Four companies.
            <br />
            <span className="text-white/45">One badge.</span>
          </h2>
        </div>

        <div className="relative w-full max-w-5xl">
          <svg viewBox="0 0 152 40" className="w-full overflow-visible" fill="none" strokeWidth="2.2" aria-hidden>
            <defs>
              <linearGradient id={`${id}-chrome`} x1="0" x2="0" y1="4" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.42" stopColor="#b9bec6" />
                <stop offset="0.52" stopColor="#5d636c" />
                <stop offset="0.72" stopColor="#c9cdd3" />
                <stop offset="1" stopColor="#f4f5f7" />
              </linearGradient>
              <linearGradient id={`${id}-glint`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask id={`${id}-sweep`} maskUnits="userSpaceOnUse" x="-40" y="-20" width="232" height="80">
                <g data-glint>
                  <rect x="-30" y="-20" width="22" height="80" fill={`url(#${id}-glint)`} transform="skewX(-20)" />
                </g>
              </mask>
            </defs>
            <g data-rings stroke={`url(#${id}-chrome)`}>{circles}</g>
            <g data-rings stroke="#fff" mask={`url(#${id}-sweep)`} style={{ filter: 'drop-shadow(0 0 1.5px #fff)' }}>
              {circles}
            </g>
          </svg>

          {/* One label per company, sitting under its ring while they are apart. */}
          <ul className="mt-4 grid grid-cols-4 gap-2 text-center md:mt-8">
            {FOUNDERS.map((f) => (
              <li key={f.name} data-founder>
                <p className="display text-[clamp(0.7rem,1.6vw,1.25rem)]">{f.name}</p>
                <p className="mono mt-2 !text-[0.55rem] md:!text-[0.65rem]">
                  {f.city} · {f.since}
                </p>
                <p className="mt-1 hidden text-xs text-muted md:block">{f.made}</p>
              </li>
            ))}
          </ul>
        </div>

        <div data-union className="absolute inset-x-4 bottom-[12svh] text-center opacity-0">
          <p className="mono !text-red">29 June 1932 · Chemnitz</p>
          <p className="display mt-3 text-[clamp(1.1rem,2.6vw,2.2rem)]">Auto Union AG</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Four Saxon carmakers join forces. Each keeps its own name and its own ring; the badge keeps all four.
          </p>
        </div>
      </div>
    </div>
  );
}

const FIRST = 1899;
const SPAN = 2026 - FIRST;
const pct = (year: number) => ((year - FIRST) / SPAN) * 100;
const DECADES = Array.from({ length: 13 }, (_, i) => 1900 + i * 10);
const YEARS = HISTORY.map((e) => +e.year);

/** 127 years as a film strip: scrolling down drives the timeline sideways. */
function Timeline() {
  return (
    <div data-timeline className="relative h-[520svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-clip">
        {/* Giant year behind the strip, following whichever era is centred. */}
        <p
          data-big-year
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[clamp(8rem,30vw,28rem)] leading-none font-bold text-transparent tabular-nums select-none [-webkit-text-stroke:1px_rgb(255_255_255/0.07)]"
        >
          1899
        </p>

        {/* Header: a counter that runs up to 127, the era under the playhead, and a scroll cue. */}
        <div className="relative mb-8 flex items-end justify-between gap-6 px-4 md:mb-10 md:px-10">
          <div className="flex items-end gap-4 md:gap-6">
            <p data-years className="chrome-text font-mono text-[clamp(3.5rem,9vw,8rem)] leading-[0.8] font-bold tabular-nums">
              127
            </p>
            <div className="pb-1">
              <p data-years-sub className="mono flex items-center gap-3 !text-red">
                <span className="h-px w-8 bg-red" /> 1899 — 2026
              </p>
              <p data-years-sub className="display mt-2 text-[clamp(0.9rem,1.8vw,1.6rem)]">
                Years of
                <br />
                <span className="text-white/45">Vorsprung</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-right">
            <div data-cue className="mono hidden items-center gap-3 !text-fg/80 md:flex">
              Scroll to travel through time
              <span className="cue-arrows flex" aria-hidden>
                <span>›</span>
                <span>›</span>
                <span>›</span>
              </span>
            </div>
            <div data-now className="hidden md:block">
              <p className="mono">
                <span data-era-tag>{HISTORY[0].tag}</span> ·{' '}
                <span className="!text-fg tabular-nums">
                  <span data-era-index>01</span>
                  <span className="text-muted"> / {String(HISTORY.length).padStart(2, '0')}</span>
                </span>
              </p>
              <p data-era-title className="display mt-2 max-w-[22ch] text-sm md:text-base">
                {HISTORY[0].title}
              </p>
            </div>
            <p className="font-mono text-sm tabular-nums md:hidden">
              <span data-era-index>01</span>
              <span className="text-muted"> / {String(HISTORY.length).padStart(2, '0')}</span>
            </p>
          </div>
        </div>

        <ol data-track className="relative flex w-max items-stretch gap-5 pr-[20vw] pl-4 will-change-transform md:gap-8 md:pl-[30vw]">
          {/* The rail the eras hang from. */}
          <span aria-hidden className="absolute top-0 right-0 left-0 h-px bg-line" />
          {HISTORY.map((e, i) => (
            <li key={`${e.year}-${e.title}`} data-era className="group relative w-[78vw] shrink-0 pt-8 sm:w-[360px] md:w-[400px]">
              <span
                aria-hidden
                className="absolute top-0 left-0 size-2.5 -translate-y-1/2 rotate-45 border border-red bg-bg transition-[background,box-shadow] duration-500 group-[.is-active]:bg-red group-[.is-active]:shadow-[0_0_12px_var(--red)]"
              />
              <article className={cn('panel brackets flex h-full flex-col overflow-hidden', e.image ? '' : 'justify-between')}>
                {e.image && (
                  <div className="relative h-40 overflow-hidden md:h-48">
                    <Image data-era-img src={e.image} alt="" fill sizes="400px" className="scale-110 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgb(10_11_14)] to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-mono text-4xl text-red tabular-nums md:text-5xl">{e.year}</p>
                    <p className="mono">
                      {String(i + 1).padStart(2, '0')} · {e.tag}
                    </p>
                  </div>
                  <h3 className="display mt-4 text-base md:text-lg">{e.title}</h3>
                  <p className="mt-3 text-sm text-muted">{e.body}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>

        {/* Time ruler: decade ticks with a playhead that races through the years between eras. */}
        <div className="relative mx-4 mt-10 md:mx-10">
          <div className="relative h-px bg-line">
            <div data-era-progress className="h-full origin-left bg-red shadow-[0_0_8px_var(--red)]" style={{ transform: 'scaleX(0)' }} />
          </div>
          <div aria-hidden className="relative h-6">
            {DECADES.map((y) => (
              <span key={y} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pct(y)}%` }}>
                <span className={cn('w-px bg-line-strong', y % 50 === 0 ? 'h-3' : 'h-1.5')} />
                {y % 20 === 0 && <span className="mt-1 hidden font-mono text-[0.55rem] text-muted md:block">{y}</span>}
              </span>
            ))}
            {HISTORY.map((e) => (
              <span key={`${e.year}-${e.title}`} className="absolute -top-[3px] size-1.5 -translate-x-1/2 rotate-45 bg-white/50" style={{ left: `${pct(+e.year)}%` }} />
            ))}
            <span data-playhead className="absolute -top-7 flex -translate-x-1/2 flex-col items-center" style={{ left: '0%' }}>
              <span data-play-year className="cut-sm bg-red px-2 py-0.5 font-mono text-xs text-white tabular-nums shadow-[0_0_18px_-2px_var(--red)]">
                1899
              </span>
              <span className="h-4 w-px bg-red shadow-[0_0_8px_var(--red)]" />
              <span className="size-2 rotate-45 bg-red shadow-[0_0_10px_var(--red)]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Heritage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // ---- The founding: draw apart → slide together → catch the light ----
      const rings = gsap.utils.toArray<SVGGElement>('[data-rings]').map((g) => Array.from(g.children));
      const founders = gsap.utils.toArray<HTMLElement>('[data-founder]');
      const found = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '[data-founding]', start: 'top top', end: 'bottom bottom', scrub: 0.8 },
      });
      rings.forEach((layer) =>
        layer.forEach((c, i) => {
          found.set(c, { x: SPREAD[i] - JOINED[i] }, 0);
          found.to(c, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05 + i * 0.06);
          found.to(c, { x: 0, duration: 0.35, ease: 'power3.inOut' }, 0.55);
        }),
      );
      found.fromTo(founders, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.2 }, 0.12);
      found.to(founders, { autoAlpha: 0, y: -16, stagger: 0.03, duration: 0.15 }, 0.5);
      found.fromTo('[data-glint]', { x: 0 }, { x: 210, duration: 0.25, ease: 'power1.inOut' }, 0.88);
      found.fromTo('[data-union]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.85);
      found.set({}, {}, 1.15);

      // ---- The timeline: vertical scroll drives the strip sideways ----
      const track = root.current!.querySelector<HTMLElement>('[data-track]')!;
      const eras = gsap.utils.toArray<HTMLElement>('[data-era]');
      const bigYear = root.current!.querySelector<HTMLElement>('[data-big-year]')!;
      const indices = gsap.utils.toArray<HTMLElement>('[data-era-index]');
      const tag = root.current!.querySelector<HTMLElement>('[data-era-tag]')!;
      const title = root.current!.querySelector<HTMLElement>('[data-era-title]')!;
      const playhead = root.current!.querySelector<HTMLElement>('[data-playhead]')!;
      const playYear = root.current!.querySelector<HTMLElement>('[data-play-year]')!;
      const fill = root.current!.querySelector<HTMLElement>('[data-era-progress]')!;
      let current = -1;

      // Header: 0 → 127 as the strip arrives, then the chrome keeps catching light (CSS).
      const years = root.current!.querySelector<HTMLElement>('[data-years]')!;
      const count = { v: 0 };
      gsap
        .timeline({ scrollTrigger: { trigger: '[data-timeline]', start: 'top 75%', once: true } })
        .fromTo(years, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' })
        .fromTo(
          count,
          { v: 0 },
          { v: SPAN, duration: 2.2, ease: 'expo.out', onUpdate: () => void (years.textContent = String(Math.round(count.v))) },
          0,
        )
        .from('[data-years-sub]', { autoAlpha: 0, x: -20, stagger: 0.12, duration: 0.9, ease: 'expo.out' }, 0.3)
        .from('[data-now]', { autoAlpha: 0, x: 20, duration: 0.9, ease: 'expo.out' }, 0.4);
      const slide = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-timeline]',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // The playhead runs through the calendar between eras, not at a constant rate.
            const at = self.progress * (YEARS.length - 1);
            const k = Math.min(Math.floor(at), YEARS.length - 2);
            const year = Math.round(YEARS[k] + (YEARS[k + 1] - YEARS[k]) * (at - k));
            playhead.style.left = `${pct(year)}%`;
            fill.style.transform = `scaleX(${pct(year) / 100})`;
            playYear.textContent = String(year);
            gsap.to('[data-cue]', { autoAlpha: self.progress > 0.04 ? 0 : 1, duration: 0.4, overwrite: 'auto' });

            const i = Math.round(at);
            if (i === current) return;
            current = i;
            bigYear.textContent = HISTORY[i].year;
            indices.forEach((el) => (el.textContent = String(i + 1).padStart(2, '0')));
            tag.textContent = HISTORY[i].tag;
            title.textContent = HISTORY[i].title;
            gsap.fromTo([title, tag], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', overwrite: true });
            gsap.fromTo(bigYear, { scale: 0.94, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out', overwrite: true });
            eras.forEach((el, n) => el.classList.toggle('is-active', n === i));
          },
        },
      });

      // Each card rises in as it slides into view; photos drift against the motion.
      eras.forEach((el) => {
        gsap.fromTo(
          el.querySelector('article'),
          { y: 60, autoAlpha: 0.15, rotate: 1.5 },
          {
            y: 0,
            autoAlpha: 1,
            rotate: 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, containerAnimation: slide, start: 'left 95%', end: 'left 60%', scrub: true },
          },
        );
        const img = el.querySelector('[data-era-img]');
        if (img) {
          gsap.fromTo(
            img,
            { xPercent: -6 },
            { xPercent: 6, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } },
          );
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="heritage" aria-label="Audi heritage">
      <Founding />
      <Timeline />
    </section>
  );
}
