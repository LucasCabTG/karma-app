// Archivo: src/app/page.tsx (Archivo modificado)

import { Monoton } from 'next/font/google';

// Configuramos la fuente Monoton
const monoton = Monoton({
  subsets: ['latin'],
  weight: '400' // Monoton solo tiene un grosor de letra
});

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">

      <div className="text-center">

        {/* Título principal con la tipografía y animación */}
        {/* Fíjate cómo combinamos la clase de la fuente con las clases de Tailwind */}
        <h1 className={`${monoton.className} text-6xl font-extrabold uppercase tracking-widest text-gray-100 md:text-8xl animate-pulse`}>
          KARMA
        </h1>

        {/* El Slogan de la fiesta (este usará Montserrat por defecto) */}
        <p className="mt-4 text-lg text-gray-400">
          LO QUE VIBRA, VUELVE.
        </p>

        {/* La fecha del primer evento (este también usará Montserrat) */}
        <p className="mt-8 text-xl font-light text-gray-300">
          Vol. 1: Primavera | 21.09.2025
        </p>
        {/* proximamente */}
        <p className="mt-8 text-xl font-light text-gray-300">
          Proximamente
        </p>

      </div>

    </main>
  );
}