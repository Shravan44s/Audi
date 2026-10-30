import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Michroma } from 'next/font/google';
import './globals.css';

const michroma = Michroma({ variable: '--font-michroma', weight: '400', subsets: ['latin'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Audi — Vorsprung durch Technik',
  description:
    'A cinematic 3D showroom: materialise the cars, open them up, meet Audi Sport, the group brands and services. Concept site, not affiliated with AUDI AG.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#040405',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${michroma.variable} ${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
