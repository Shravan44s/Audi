'use client';

import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit';
  'aria-label'?: string;
};

const base =
  'sweep cut inline-flex items-center justify-center gap-2.5 px-6 py-3.5 font-mono text-[0.7rem] font-semibold tracking-[0.2em] uppercase transition-[background,color,transform] duration-300 active:scale-[0.98]';

const styles = {
  solid: 'bg-red text-white hover:bg-[#ff2457] shadow-[0_0_40px_-10px_var(--red)]',
  ghost: 'bg-white/[0.06] text-fg hover:bg-white/[0.14] ring-1 ring-inset ring-line-strong',
};

/** Cut-corner HUD control with a light sweep on hover. Renders an <a> when given href. */
export function HudButton({ children, variant = 'solid', className, href, onClick, type = 'button', ...aria }: Props) {
  const cls = cn(base, styles[variant], className);
  if (href) {
    return (
      <a className={cls} href={href} onClick={onClick} {...aria}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} {...aria}>
      {children}
    </button>
  );
}
