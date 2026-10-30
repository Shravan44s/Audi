'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, BatteryCharging, Landmark, Wrench } from 'lucide-react';
import { CARS } from '@/data/cars';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

/** Indicative list prices (EUR) for the calculator. */
const PRICE: Record<string, number> = { 'rs-etron-gt': 165000, r8: 205000, 'a5-sportback': 54000, 's5-coupe': 72000 };
const FOR_SALE = CARS.filter((c) => PRICE[c.id]);
/** WLTP range and 10–80 % charge time for the trip planner. */
const EV: Record<string, { range: number; stop: number }> = {
  'rs-etron-gt': { range: 568, stop: 18 },
};
const TERMS = [24, 36, 48];
const APR = 0.049;

const eur = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function Finance() {
  const carIndex = useApp((s) => s.car);
  const [id, setId] = useState(PRICE[CARS[carIndex].id] ? CARS[carIndex].id : FOR_SALE[0].id);
  const [deposit, setDeposit] = useState(20);
  const [term, setTerm] = useState(36);

  const monthly = useMemo(() => {
    const price = PRICE[id];
    const r = APR / 12;
    const financed = price * (1 - deposit / 100);
    // Guaranteed future value shrinks with the term.
    const balloon = price * (0.58 - term * 0.0045);
    return (financed - balloon / Math.pow(1 + r, term)) * (r / (1 - Math.pow(1 + r, -term)));
  }, [id, deposit, term]);

  return (
    <div data-card className="panel brackets flex flex-col p-6 md:col-span-2 md:p-9">
      <div className="flex items-center gap-3">
        <span className="cut-sm grid size-10 place-items-center bg-red text-white">
          <Landmark className="size-4" />
        </span>
        <div>
          <p className="mono">Audi Financial Services</p>
          <h3 className="text-xl font-semibold">Plan your monthly rate</h3>
        </div>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-6">
          <label className="block">
            <span className="mono">Model</span>
            <select
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="cut-sm mt-2 h-12 w-full bg-white/[0.06] px-4 font-mono text-sm outline-none ring-1 ring-inset ring-line focus:ring-red"
            >
              {FOR_SALE.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — from {eur(PRICE[c.id])}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mono flex justify-between">
              Deposit <span className="!text-fg tabular-nums">{deposit} %</span>
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="range mt-3 w-full"
            />
          </label>
          <div>
            <span className="mono">Term</span>
            <div className="mt-2 flex gap-2">
              {TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  aria-pressed={term === t}
                  className={cn(
                    'cut-sm flex-1 px-4 py-2.5 font-mono text-xs transition-colors',
                    term === t ? 'bg-fg text-bg' : 'bg-white/[0.06] hover:bg-white/[0.12]',
                  )}
                >
                  {t} mo
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="brackets bg-white/[0.03] p-6 text-right md:min-w-64">
          <p className="mono">Estimated per month</p>
          <p key={Math.round(monthly)} className="rate-pop mt-2 font-mono text-4xl tabular-nums md:text-5xl">
            {eur(monthly)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {APR * 100}% APR · balloon at end · illustrative only
          </p>
        </div>
      </div>
    </div>
  );
}

function Charging() {
  const carIndex = useApp((s) => s.car);
  const chosen = CARS[carIndex];
  const car = EV[chosen.id] ? chosen : CARS[0];
  const ev = EV[car.id];
  const [km, setKm] = useState(900);
  // Start at 100 %, arrive anywhere ≥ 10 %; each stop adds 70 % of range.
  const firstLeg = ev.range * 0.9;
  const stops = km <= firstLeg ? 0 : Math.ceil((km - firstLeg) / (ev.range * 0.7));
  const arrive = Math.max(10, Math.round(100 - ((km - stops * ev.range * 0.7) / ev.range) * 100));

  return (
    <div data-card className="cut relative flex min-h-[460px] flex-col overflow-hidden text-white">
      <Image src="/images/charging.jpg" alt="Audi charging hub with cars plugged in" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="relative mt-auto p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="cut-sm grid size-10 place-items-center bg-red text-white">
            <BatteryCharging className="size-4" />
          </span>
          <div>
            <p className="mono !text-white/70">Audi charging</p>
            <h3 className="text-xl font-semibold">Road-trip planner</h3>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">{car.name} · {ev.range} km WLTP</p>
        <label className="mt-4 block">
          <span className="mono flex justify-between !text-white/70">
            Trip <span className="!text-white tabular-nums">{km} km</span>
          </span>
          <input type="range" min={100} max={2000} step={50} value={km} onChange={(e) => setKm(Number(e.target.value))} className="range mt-3 w-full" />
        </label>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { v: stops, k: stops === 1 ? 'stop' : 'stops' },
            { v: `${stops * ev.stop}′`, k: 'charging' },
            { v: `${arrive}%`, k: 'on arrival' },
          ].map((s) => (
            <div key={s.k} className="cut-sm bg-white/10 p-3 backdrop-blur">
              <p className="font-mono text-2xl tabular-nums">{s.v}</p>
              <p className="text-[11px] text-white/60">{s.k}</p>
            </div>
          ))}
        </div>
        {/* Charge bar: animates to the arrival level */}
        <div className="mt-4 h-1 overflow-hidden bg-white/15">
          <div className="h-full bg-gradient-to-r from-[#2bf5b0] to-[#5ee6ff] shadow-[0_0_10px_#2bf5b0] transition-[width] duration-700 ease-out-expo" style={{ width: `${arrive}%` }} />
        </div>
      </div>
    </div>
  );
}

const MORE = [
  { title: 'Audi Sport driving experience', sub: 'Ice, track and off-road training with pro instructors' },
  { title: 'Service & warranty', sub: 'Genuine parts, mobile service, up to 5 years cover' },
  { title: 'Audi connect', sub: 'Remote climate, charging timers, digital key' },
  { title: 'Audi Approved :plus', sub: 'Certified pre-owned with 110-point check' },
];

function More() {
  return (
    <div data-card className="panel brackets flex flex-col p-6 md:col-span-3 md:flex-row md:items-stretch md:gap-8 md:p-9">
      <div className="cut relative mb-6 h-56 overflow-hidden md:mb-0 md:h-auto md:w-[38%] md:shrink-0">
        <Image src="/images/interior.jpg" alt="Audi e-tron GT interior" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="cut-sm grid size-10 place-items-center bg-red text-white">
            <Wrench className="size-4" />
          </span>
          <div>
            <p className="mono">Ownership</p>
            <h3 className="text-xl font-semibold">Everything after the keys</h3>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-line">
          {MORE.map((m) => (
            <li key={m.title}>
              <a href="#test-drive" className="group flex items-center justify-between gap-4 py-4">
                <span>
                  <span className="block font-medium transition-colors group-hover:text-red">{m.title}</span>
                  <span className="block text-sm text-muted">{m.sub}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Services() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('[data-card]', {
        y: 80,
        autoAlpha: 0,
        rotateX: -8,
        transformOrigin: '50% 100%',
        duration: 1.2,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-cards]', start: 'top 80%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="services" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-4 md:px-10">
        <p className="mono flex items-center gap-3 !text-red">
          <span className="h-px w-8 bg-red" /> 06 · Services
        </p>
        <h2 className="display mt-4 text-[clamp(1.5rem,3.2vw,3rem)]">
          Drive now.
          <br />
          <span className="text-white/45">Charge anywhere.</span>
        </h2>
        <div data-cards className="mt-12 grid gap-4 [perspective:1200px] md:grid-cols-3">
          <Finance />
          <Charging />
          <More />
        </div>
      </div>
    </section>
  );
}
