'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight } from 'lucide-react';
import { BRANDS } from '@/data/content';
import { cn } from '@/lib/utils';

/**
 * The group's other houses as a big index. On fine pointers a preview frame follows
 * the cursor with lag and tilts with its velocity; hovering a row swaps the photo
 * behind a wipe. On touch, each row carries its photo inline.
 */
export function Brands() {
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useGSAP(
    () => {
      gsap.from('[data-row]', {
        autoAlpha: 0,
        y: 40,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-rows]', start: 'top 80%', once: true },
      });
      gsap.from('[data-row-line]', {
        scaleX: 0,
        duration: 1.4,
        stagger: 0.08,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '[data-rows]', start: 'top 80%', once: true },
      });

      const el = preview.current;
      if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      const r = gsap.quickTo(el, 'rotation', { duration: 0.5, ease: 'power3.out' });
      let last = 0;
      const move = (e: PointerEvent) => {
        x(e.clientX);
        y(e.clientY);
        r(Math.max(-8, Math.min(8, (e.clientX - last) * 0.4)));
        last = e.clientX;
      };
      window.addEventListener('pointermove', move, { passive: true });
      return () => window.removeEventListener('pointermove', move);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="brands" className="relative py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-4 md:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mono flex items-center gap-3 !text-red">
              <span className="h-px w-8 bg-red" /> 05 · The brand group
            </p>
            <h2 className="display mt-4 text-[clamp(1.5rem,3.2vw,3rem)]">
              Four more ways
              <br />
              <span className="text-white/45">to be fast</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Supercars, superbikes, grand tourers and the studio behind a hundred icons. All steered from Ingolstadt.
          </p>
        </div>

        <ul data-rows className="mt-14" onPointerLeave={() => setActive(null)}>
          {BRANDS.map((b, i) => (
            <li key={b.id} data-row className="relative">
              <div data-row-line className="h-px origin-left bg-line" />
              <a
                href="#brands"
                onClick={(e) => e.preventDefault()}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 py-7 md:grid-cols-[4rem_1fr_16rem_14rem_auto] md:gap-8 md:py-10"
              >
                {/* accent wash */}
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${b.accent}1f, transparent 70%)` }}
                />
                <span className="relative font-mono text-xs text-red">0{i + 1}</span>
                <span className="display relative text-[clamp(1.4rem,4.6vw,4rem)] transition-transform duration-700 ease-out-expo group-hover:translate-x-3">
                  {b.name}
                </span>
                <span className="mono relative hidden md:block">{b.home}</span>
                <span className="relative hidden font-mono text-xs md:block" style={{ color: b.accent }}>
                  {b.fact}
                </span>
                <ArrowUpRight className="relative size-6 text-muted transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fg" />
              </a>
              {/* Touch: inline photo + copy */}
              <div className="pb-6 md:hidden">
                <div className="cut relative aspect-[16/9] overflow-hidden">
                  <Image src={b.image} alt={b.name} fill sizes="100vw" className="object-cover" />
                </div>
                <p className="mt-3 text-sm text-muted">
                  {b.tagline} <span style={{ color: b.accent }}>{b.fact}</span>
                </p>
              </div>
            </li>
          ))}
          <li className="h-px bg-line" />
        </ul>
      </div>

      {/* Cursor-following preview (fine pointers only) */}
      <div
        ref={preview}
        aria-hidden
        className={cn(
          'pointer-events-none fixed top-0 left-0 z-30 hidden h-[260px] w-[400px] -translate-x-1/2 -translate-y-1/2 transition-[opacity,scale] duration-500 [@media(hover:hover)_and_(pointer:fine)]:block',
          active === null ? 'scale-90 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        <div className="cut relative h-full w-full overflow-hidden bg-bg-2">
          {BRANDS.map((b, i) => (
            <div
              key={b.id}
              className="absolute inset-0 transition-[clip-path] duration-700 ease-out-expo"
              style={{ clipPath: active === i ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)' }}
            >
              <Image src={b.image} alt="" fill sizes="400px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="mono absolute bottom-3 left-4 !text-white/80">{b.since}</p>
            </div>
          ))}
          <div className="brackets absolute inset-2 [--b:rgb(255_255_255/0.7)]" />
        </div>
      </div>
    </section>
  );
}
