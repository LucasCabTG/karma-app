'use client';

// 1. Importamos los hooks 'useEffect' y las funciones de Firebase
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // Importamos el SDK de cliente
import { doc, getDoc, collection } from 'firebase/firestore'; 

export function TicketForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 2. Nuevos estados para manejar el precio y la carga
  const [lotePrice, setLotePrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  // 3. useEffect para buscar el precio del lote activo al cargar
  useEffect(() => {
    async function fetchActiveLotePrice() {
      try {
        setPriceError(null);
        // Primero, vemos cuál es el lote activo
        const configRef = doc(db, 'config', 'evento_actual');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
          throw new Error("No se pudo cargar la configuración del evento.");
        }
        
        const loteActivoNum = configSnap.data().loteActivo;

        // Segundo, buscamos el precio de ese lote
        const loteRef = doc(db, 'config', 'evento_actual', 'lotes', String(loteActivoNum));
        const loteSnap = await getDoc(loteRef);

        if (!loteSnap.exists()) {
          throw new Error("No se pudo encontrar el lote de entradas activo.");
        }

        // Guardamos el precio en el estado
        setLotePrice(loteSnap.data().precio);
        
      } catch (err: any) {
        console.error("Error al cargar el precio:", err);
        setPriceError("No se pudo cargar el precio. Por favor, recargá la página.");
      } finally {
        setPriceLoading(false);
      }
    }

    fetchActiveLotePrice();
  }, []); // El array vacío asegura que esto solo se ejecute una vez

  // Lógica de compra (no cambia)
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
        // Leemos el mensaje de error del backend (ej: "Sold Out!")
        const errorText = await response.text();
        throw new Error(errorText || 'Error al crear el pago');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error: any) {
      console.error("Error en el proceso de compra: ", error);
      alert(error.message); // Mostramos el error específico (ej: "Sold Out!")
      setIsLoading(false);
    }
  };
  
  // 4. Función para decidir qué texto muestra el botón
  const getButtonText = () => {
    if (priceLoading) return 'Cargando...';
    if (isLoading) return 'Procesando...';
    if (!lotePrice) return 'Entradas no disponibles';
    return `Pagar ${quantity * lotePrice} ARS`;
  };

  return (
    <form onSubmit={handleBuyTicket} className="mt-8 flex flex-col gap-4">
      {/* Inputs (sin cambios) */}
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

      {/* Selector de cantidad (sin cambios) */}
      <div className="flex items-center justify-center gap-4 text-white">
        <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">-</button>
        <span className="text-2xl font-bold">{quantity}</span>
        <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">+</button>
      </div>

      {/* 5. Mostramos el error si falla la carga del precio */}
      {priceError && (
        <p className="text-red-500 text-sm">{priceError}</p>
      )}
      
      {/* 6. Botón de pago actualizado */}
      <button 
        type="submit"
        disabled={isLoading || priceLoading || !lotePrice}
        className="rounded-lg bg-white px-6 py-3 font-bold text-black transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:bg-gray-500"
      >
        {getButtonText()}
      </button>

      {/* Texto de aviso (lo mantuve, podés sacarlo si querés) */}
      <p className="mt-4 text-lg text-gray-400">
        Una vez finalizada la compra volver a la pagina para recibir tu ticket
      </p>
    </form>
  );
}