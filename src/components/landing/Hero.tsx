// Archivo: src/components/landing/Hero.tsx
import { Monoton } from 'next/font/google';

const monoton = Monoton({
  subsets: ['latin'],
  weight: '400'
});

export function Hero() {
  return (
    <section id="inicio" className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className={`${monoton.className} animate-pulse text-5xl sm:text-7xl md:text-9xl font-extrabold uppercase tracking-widest text-gray-100`}>
          KARMA
        </h1>
        <p className="mt-4 text-xl text-gray-400 md:text-2xl">
          LO QUE VIBRA, VUELVE.
        </p>
      </div>
    </section>
  );    
}