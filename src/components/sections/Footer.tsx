import { Logo } from '@/components/ui/Nav';
import { CARS } from '@/data/cars';
import { CREDITS } from '@/data/content';

const COLS = [
  { title: 'Models', links: CARS.map((c) => c.name.replace(' performance', '')) },
  { title: 'Group', links: ['Audi Sport', 'Lamborghini', 'Ducati', 'Bentley', 'Italdesign'] },
  { title: 'Services', links: ['Financial Services', 'Charging', 'Test drive', 'Service'] },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-bg">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            Specifications and prices are indicative and vary by market. 3D models are community CC-BY works, not manufacturer data.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mono mb-4">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors hover:text-red">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <details className="mx-auto max-w-[1600px] border-t border-line px-5 py-5 text-xs text-muted md:px-10">
        <summary className="mono cursor-pointer select-none hover:!text-fg">Credits · 3D models &amp; photography</summary>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {CARS.map((c) => (
            <li key={c.id}>
              <a href={`https://sketchfab.com/3d-models/${c.source.uid}`} target="_blank" rel="noreferrer" className="hover:text-fg">
                3D · {c.source.title} — {c.source.author}, CC BY 4.0
              </a>
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {CREDITS.map((c) => (
            <li key={c.file}>
              <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-fg">
                {c.file} — {c.author}, {c.license}
              </a>
            </li>
          ))}
        </ul>
      </details>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 border-t border-line px-5 py-6 text-xs text-muted md:flex-row md:justify-between md:px-10">
        <p>Concept site for portfolio purposes · Not affiliated with or endorsed by AUDI AG.</p>
        <p>Photography: Wikimedia Commons · 3D: Sketchfab (CC BY)</p>
      </div>
    </footer>
  );
}
