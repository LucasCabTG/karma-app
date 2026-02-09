// Archivo: src/components/landing/Music.tsx
'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';

// 1. Definimos los datos de los Sets de Youtube aquí
const videos = [
  {
    title: 'Eloy V B2B Cristian Aranda',
    subtitle: 'Progressive House Set – Summer Edition',
    description: 'Reviví la magia del Vol. 2. Un B2B increible capturado en nuestro ultimo evento',
    videoUrl: 'https://www.youtube.com/embed/3vrKX99y0_Q?si=YJ7KGPZkIkA2ln3e' 
  },
  // CUANDO TENGAS LOS OTROS VIDEOS, COPIA Y PEGA ESTO:
  /*
  {
    title: 'NOMBRE DEL DJ',
    subtitle: 'Summer Edition',
    description: 'Descripcion breve...',
    videoUrl: 'URL_DEL_EMBED_DE_YOUTUBE' 
  },
  */
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
        <h2 className="text-4xl font-bold">Recordá el Sonido del Verano</h2>
        <p className="mt-4 text-lg text-gray-400">
          Reviví los sets que definieron el Vol. 2. La energía de la fiesta, ahora disponible para escuchar donde quieras.
        </p>
      </div>

      {/* 4. Estructura del Carrusel */}
      <div className="embla mx-auto mt-12 max-w-4xl" ref={emblaRef}>
        <div className="embla__container">
          {videos.map((video, index) => (
            <div className="embla__slide p-4" key={index}>
              <div className="rounded-xl bg-gray-900/50 p-6 text-center border border-gray-800">
                <h3 className="text-2xl md:text-3xl font-bold text-white">{video.title}</h3>
                <h4 className="text-lg text-purple-400 font-medium mb-2">{video.subtitle}</h4>
                <p className="mb-6 text-sm text-gray-400 max-w-2xl mx-auto">{video.description}</p>
                
                {/* Contenedor responsivo para el video 16:9 */}
                <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={video.videoUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Botones de Navegación (Solo se muestran si hay más de 1 video) */}
      {videos.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button 
            className="embla__prev rounded-full bg-black p-3 text-white border border-gray-700 hover:bg-white hover:text-black transition-colors duration-200" 
            onClick={scrollPrev}
            aria-label="Video anterior"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="embla__next rounded-full bg-black p-3 text-white border border-gray-700 hover:bg-white hover:text-black transition-colors duration-200" 
            onClick={scrollNext}
            aria-label="Siguiente video"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}