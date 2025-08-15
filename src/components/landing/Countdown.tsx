// Archivo: src/components/landing/Countdown.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

export function Countdown() {
  const targetDate = new Date('2025-09-20T22:00:00');

  const calculateTimeLeft = useCallback(() => {
    const difference = +targetDate - +new Date();
    let timeLeft: { [key: string]: number } = {};

    if (difference > 0) {
      timeLeft = {
        días: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return (
    <section id="countdown" className="bg-black py-20 px-4 text-white">
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