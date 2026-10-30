'use client';

import { useId, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Menu, X } from 'lucide-react';
import { useSmoothScroll } from '@/components/providers/SmoothScroll';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { HudButton } from './HudButton';

const LINKS = [
  { href: '#story', label: 'Technology' },
  { href: '#models', label: 'Models' },
  { href: '#heritage', label: 'Heritage' },
  { href: '#sport', label: 'Audi Sport' },
  { href: '#brands', label: 'Brands' },
  { href: '#services', label: 'Services' },
];

const CX = [18, 40, 62, 84];

/**
 * Four interlocking rings in brushed chrome. A light catches them every few seconds;
 * inside a `.logo` they pull apart on hover and snap back together.
 */
export function Rings({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  const id = useId().replace(/:/g, '');
  const circles = CX.map((cx) => <circle key={cx} className="ring" cx={cx} cy="18" r="15" pathLength={1} strokeDasharray="1" />);
  return (
    <svg viewBox="0 0 104 36" className={cn('rings', className)} fill="none" strokeWidth={strokeWidth} aria-hidden>
      <defs>
        {/* Chrome: bright top edge, dark horizon, a lift at the bottom. */}
        <linearGradient id={`${id}-chrome`} x1="0" x2="0" y1="0" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.42" stopColor="#b9bec6" />
          <stop offset="0.52" stopColor="#6b717a" />
          <stop offset="0.7" stopColor="#c9cdd3" />
          <stop offset="1" stopColor="#f4f5f7" />
        </linearGradient>
        <linearGradient id={`${id}-glint`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-sweep`} maskUnits="userSpaceOnUse" x="-20" y="-10" width="144" height="56">
          <rect className="rings-glint" x="-40" y="-10" width="26" height="56" fill={`url(#${id}-glint)`} transform="skewX(-20)" />
        </mask>
      </defs>
      <g stroke={`url(#${id}-chrome)`}>{circles}</g>
      <g stroke="#fff" mask={`url(#${id}-sweep)`} style={{ filter: 'drop-shadow(0 0 2px #fff)' }}>
        {circles}
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('logo flex items-center gap-3', className)}>
      <Rings className="h-5 w-auto" />
      <span className="logo-word display text-[0.8rem] tracking-[0.35em]">Audi</span>
    </span>
  );
}

export function Nav() {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const introDone = useApp((s) => s.introDone);
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      if (!introDone) return;
      gsap.fromTo(bar.current, { yPercent: -120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', delay: 0.6 });
      // The rings draw themselves in one after another as the bar lands.
      gsap.fromTo(
        bar.current!.querySelectorAll('.rings .ring'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.3, ease: 'expo.inOut', delay: 0.9, stagger: { each: 0.12, grid: [2, 4], axis: 'x' } },
      );
      // Hide on scroll down, show on scroll up.
      ScrollTrigger.create({
        start: 'top -80',
        end: 'max',
        onUpdate: (self) => {
          bar.current?.classList.toggle('is-condensed', self.scroll() > 80);
          gsap.to(bar.current, { yPercent: self.direction === 1 && self.scroll() > 600 ? -120 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        },
      });
    },
    { dependencies: [introDone] },
  );

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <header ref={bar} className="group/nav fixed inset-x-0 top-0 z-50" style={{ transform: 'translateY(-120%)' }}>
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 transition-[background] duration-500 group-[.is-condensed]/nav:panel md:px-10">
          <a href="#hero" onClick={go('#hero')} aria-label="Audi, back to top">
            <Logo />
          </a>
          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <a href={l.href} onClick={go(l.href)} className="mono group flex items-baseline gap-2 transition-colors hover:!text-fg">
                  <span className="text-red">0{i + 1}</span>
                  <span className="relative">
                    {l.label}
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-red transition-transform duration-500 group-hover:scale-x-100" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <HudButton href="#test-drive" onClick={go('#test-drive')} className="hidden px-5 py-2.5 sm:inline-flex">
              Test drive
            </HudButton>
            <button
              type="button"
              className="cut-sm grid size-10 place-items-center bg-white/10 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>
        <div className="h-px bg-line">
          <div className="h-full origin-left bg-red" style={{ transform: 'scaleX(var(--scroll-progress, 0))' }} />
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={cn(
          'panel fixed inset-0 z-40 flex flex-col justify-center gap-3 px-8 transition-[opacity,visibility] duration-500 lg:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        {LINKS.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={go(l.href)}
            className={cn(
              'display flex items-baseline gap-4 text-2xl transition-[transform,opacity] duration-700 ease-out-expo sm:text-4xl',
              open ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0',
            )}
            style={{ transitionDelay: open ? `${80 + i * 60}ms` : '0ms' }}
          >
            <span className="mono !text-red">0{i + 1}</span>
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}
