'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Check } from 'lucide-react';
import { CARS } from '@/data/cars';
import { useApp } from '@/lib/store';

/** Final beat: the camera drops back to a low hero shot of the car above the booking form. */
export function Outro() {
  const root = useRef<HTMLElement>(null);
  const car = useApp((s) => s.car);
  const [model, setModel] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const chosen = model ?? CARS[car].id;

  useGSAP(
    () => {
      const st = { trigger: root.current, start: 'top bottom', end: 'center center', scrub: 0.8 };
      gsap.fromTo('[data-top]', { letterSpacing: '0.6em', autoAlpha: 0 }, { letterSpacing: '0.04em', autoAlpha: 1, ease: 'none', scrollTrigger: st });
      gsap.fromTo('[data-line]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: st });
    },
    { scope: root },
  );

  const input = 'cut-sm h-12 w-full bg-white/[0.06] px-4 font-mono text-sm outline-none ring-1 ring-inset ring-line transition-shadow focus:ring-red';

  return (
    <section ref={root} id="outro" className="relative flex min-h-[130svh] flex-col justify-between overflow-clip pt-28 pb-10">
      <h2 className="sr-only">Book a test drive</h2>
      <div className="px-4 text-center">
        <p className="mono !text-red">07 · Test drive</p>
        <p data-top aria-hidden className="display mt-4 text-[clamp(1.8rem,6vw,5.5rem)] whitespace-nowrap">
          Your turn
        </p>
        <div data-line className="mx-auto mt-6 h-px w-40 origin-center bg-red shadow-[0_0_10px_var(--red)]" />
      </div>
      <div className="flex-1" />

      <div id="test-drive" className="relative mx-auto mt-8 w-full max-w-2xl scroll-mt-24 px-5">
        <div className="panel brackets p-6 md:p-8">
          {done ? (
            <div className="flex items-center gap-4" role="status">
              <span className="cut-sm grid size-12 place-items-center bg-red text-white">
                <Check className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Request received, {name.split(' ')[0]}.</p>
                <p className="text-sm text-muted">
                  A partner will call to set up your {CARS.find((c) => c.id === chosen)?.name} test drive. (Demo form, nothing was sent.)
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
            >
              <p className="display text-sm">Book a test drive</p>
              <p className="mt-1 text-sm text-muted">Pick a car, tell us where, and a partner gets back within a day.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="sr-only">Model</span>
                  <select value={chosen} onChange={(e) => setModel(e.target.value)} className={input}>
                    {CARS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Name</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={input} />
                </label>
                <label>
                  <span className="sr-only">City</span>
                  <input required placeholder="City" className={input} />
                </label>
                <label className="flex gap-2 sm:col-span-2">
                  <span className="sr-only">Email</span>
                  <input type="email" required placeholder="you@email.com" className={input} />
                  <button
                    type="submit"
                    aria-label="Request test drive"
                    className="cut-sm sweep grid size-12 shrink-0 place-items-center bg-red text-white shadow-[0_0_30px_-8px_var(--red)]"
                  >
                    <ArrowRight className="size-5" />
                  </button>
                </label>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
