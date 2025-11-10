'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
// CORRECCIÓN: 'collection' eliminado de esta lista
import { doc, getDoc } from 'firebase/firestore'; 

export function TicketForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [lotePrice, setLotePrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveLotePrice() {
      try {
        setPriceError(null);
        const configRef = doc(db, 'config', 'evento_actual');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
          throw new Error("No se pudo cargar la configuración del evento.");
        }
        
        const loteActivoNum = configSnap.data().loteActivo;
        const loteRef = doc(db, 'config', 'evento_actual', 'lotes', String(loteActivoNum));
        const loteSnap = await getDoc(loteRef);

        if (!loteSnap.exists()) {
          throw new Error("No se pudo encontrar el lote de entradas activo.");
        }

        setLotePrice(loteSnap.data().precio);
        
      } catch (err) { // CORRECCIÓN: Quitamos el 'any'
        console.error("Error al cargar el precio:", err);
        setPriceError("No se pudo cargar el precio. Por favor, recargá la página.");
      } finally {
        setPriceLoading(false);
      }
    }

    fetchActiveLotePrice();
  }, []);

  const handleBuyTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!name || !email) {
      alert('Por favor, completa tu nombre y email.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, quantity }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al crear el pago');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) { // CORRECCIÓN: Quitamos el 'any' y verificamos el tipo
      console.error("Error en el proceso de compra: ", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Hubo un error al iniciar el proceso de pago.");
      }
      setIsLoading(false);
    }
  };
  
  const getButtonText = () => {
    if (priceLoading) return 'Cargando...';
    if (isLoading) return 'Procesando...';
    if (!lotePrice) return 'Entradas no disponibles';
    return `Pagar ${quantity * lotePrice} ARS`;
  };

  return (
    <form onSubmit={handleBuyTicket} className="mt-8 flex flex-col gap-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre y Apellido"
        className="w-full rounded-md border-2 border-gray-700 bg-transparent p-3 text-white placeholder-gray-500 transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        className="w-full rounded-md border-2 border-gray-700 bg-transparent p-3 text-white placeholder-gray-500 transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        required
      />

      <div className="flex items-center justify-center gap-4 text-white">
        <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">-</button>
        <span className="text-2xl font-bold">{quantity}</span>
        <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">+</button>
      </div>

      {priceError && (
        <p className="text-red-500 text-sm">{priceError}</p>
      )}
      
      <button 
        type="submit"
        disabled={isLoading || priceLoading || !lotePrice}
        className="rounded-lg bg-white px-6 py-3 font-bold text-black transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:bg-gray-500"
      >
        {getButtonText()}
      </button>

      <p className="mt-4 text-lg text-gray-400">
        Una vez finalizada la compra volver a la pagina para recibir tu ticket
      </p>
    </form>
  );
}