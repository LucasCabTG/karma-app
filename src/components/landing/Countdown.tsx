// Archivo: src/components/landing/Countdown.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

export function Countdown() {
  // La fecha objetivo de nuestra fiesta
  const targetDate = new Date('2025-09-20T22:00:00');

  // Función para calcular el tiempo restante
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        días: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  // Estado para guardar y actualizar el tiempo restante
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Creamos un temporizador que actualiza el estado cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Limpiamos el temporizador cuando el componente se desmonta para evitar problemas de memoria
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return (
    <section className="bg-black py-20 px-4 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold">Vol. 1 PRIMAVERA</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="flex flex-col rounded-lg bg-gray-900 p-4">
              <span className="text-5xl font-bold">
                {String(value).padStart(2, '0')}
              </span>
              <span className="mt-2 text-lg uppercase text-gray-400">{unit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}