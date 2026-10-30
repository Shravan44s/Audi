import { StageMount } from '@/components/canvas/StageMount';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Brands } from '@/components/sections/Brands';
import { Footer } from '@/components/sections/Footer';
import { Heritage } from '@/components/sections/Heritage';
import { Hero } from '@/components/sections/Hero';
import { Outro } from '@/components/sections/Outro';
import { SceneOccluder } from '@/components/sections/SceneOccluder';
import { Services } from '@/components/sections/Services';
import { Showroom } from '@/components/sections/Showroom';
import { Sport } from '@/components/sections/Sport';
import { Story } from '@/components/sections/Story';
import { Cursor } from '@/components/ui/Cursor';
import { Loader } from '@/components/ui/Loader';
import { Nav } from '@/components/ui/Nav';

export default function Home() {
  return (
    <SmoothScroll>
      <StageMount />
      <Loader />
      <Cursor />
      <Nav />

      <main className="relative z-10">
        <Hero />
        <Story />
        <Showroom />
        <SceneOccluder>
          <Heritage />
          <Sport />
          <Brands />
          <Services />
        </SceneOccluder>
        <Outro />
      </main>

      <Footer />
    </SmoothScroll>
  );
}
