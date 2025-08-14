// Archivo: src/app/page.tsx

import { Hero } from "@/components/landing/Hero";
import { Concept } from "@/components/landing/Concept";
import { Tickets } from "@/components/landing/Tickets";
import { Navbar } from "@/components/layout/Navbar";
import { FadeIn } from "@/components/animations/FadeIn";
import { Countdown } from "@/components/landing/Countdown";
import { Music } from "@/components/landing/Music"; // 1. Importar

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FadeIn>
        <Concept />
      </FadeIn>
      <FadeIn>
        <Countdown />
      </FadeIn>
      <FadeIn>
        <Music /> {/* 2. Añadir la música aquí */}
      </FadeIn>
      <FadeIn>
        <Tickets />
      </FadeIn>
    </main>
  );
}