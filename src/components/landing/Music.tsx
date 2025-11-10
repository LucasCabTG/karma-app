// Archivo: src/components/landing/Music.tsx (Versión Carrusel)
'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';

// 1. Definimos los datos de nuestros DJs aquí
const djs = [
    {
    name: 'COTY M (Opening)',
    description: 'Una selección de 21 tracks curada por COTY M para KARMA. En esta playlist el DJ captura la energía del progressive con la vibra de la primavera: renacimiento, cambio, luz. Forma parte de una propuesta colaborativa donde cada DJ construye su propio universo sonoro...(proximamente)',
    spotifyUrl: 'https://open.spotify.com/embed/playlist/1EUgCGz9Kb4gwYVZ3cE1oU?utm_source=generator&theme=0' // <-- REEMPLAZAR CON URL REAL
  },
  {
    name: 'ELOY V (Warm Up)',
    description: 'Una selección de 21 tracks curada por Eloy V para KARMA. En esta playlist el DJ captura la energía del progressive con la vibra de la primavera: renacimiento, cambio, luz. Forma parte de una propuesta colaborativa donde cada DJ construye su propio universo sonoro...',
    spotifyUrl: 'https://open.spotify.com/embed/playlist/6o1d3Uj6u36E9vIIvefe74?utm_source=generator&theme=0' // <-- REEMPLAZAR CON URL REAL
  },
  {
    name: 'COLOÜ BEFU (Closing)',
    description: 'Una selección de 21 tracks curada por COLOÜ BEFU para KARMA. En esta playlist el DJ captura la energía del progressive con la vibra de la primavera: renacimiento, cambio, luz. Forma parte de una propuesta colaborativa donde cada DJ construye su propio universo sonoro...(proximamente)',
    spotifyUrl: 'https://open.spotify.com/embed/playlist/0iRO78mYTl8Kdwe7ln4Dsx?utm_source=generator' // <-- REEMPLAZAR CON URL REAL 
  },
];

export function Music() {
  // 2. Configuramos el hook del carrusel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // 3. Funciones para los botones de navegación
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section id="music" className="bg-black py-20 px-4 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold">Recordá el Sonido de la Primavera</h2>
        <p className="mt-4 text-lg text-gray-400">
          Reviví los sets que definieron nuestra primera noche mientras esperamos que llegue el Vol. 2: Verano.
        </p>
      </div>

      {/* 4. Estructura del Carrusel */}
      <div className="embla mx-auto mt-12 max-w-3xl" ref={emblaRef}>
        <div className="embla__container">
          {djs.map((dj, index) => (
            <div className="embla__slide p-4" key={index}>
              <div className="rounded-lg bg-black p-6 text-center">
                <h3 className="text-3xl font-bold">{dj.name}</h3>
                <p className="mt-4 text-gray-400">{dj.description}</p>
                <div className="mt-6">
                  <iframe
                    style={{ borderRadius: '12px' }}
                    src={dj.spotifyUrl}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Botones de Navegación */}
      <div className="mt-6 flex items-center justify-center gap-4">
  <button 
    className="embla__prev rounded-full bg-black p-3 text-white border border-gray-700 hover:bg-white hover:text-black transition-colors duration-200" 
    onClick={scrollPrev}
  >
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  <button 
    className="embla__next rounded-full bg-black p-3 text-white border border-gray-700 hover:bg-white hover:text-black transition-colors duration-200" 
    onClick={scrollNext}
  >
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>
    </section>
  );
}





