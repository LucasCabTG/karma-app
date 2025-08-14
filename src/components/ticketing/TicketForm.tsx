'use client';

import { useState } from 'react';

const TICKET_PRICE = 12000;

export function TicketForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

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

      if (!response.ok) throw new Error('Error al crear el pago');

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) {
      console.error("Error en el proceso de compra: ", error);
      alert("Hubo un error al iniciar el proceso de pago.");
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleBuyTicket} className="mt-8 flex flex-col gap-4">
      {/* CAMBIO DE ESTILO AQUÍ */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre y Apellido"
        className="w-full rounded-md border-2 border-gray-700 bg-transparent p-3 text-white placeholder-gray-500 transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        required
      />
      {/* CAMBIO DE ESTILO AQUÍ */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        className="w-full rounded-md border-2 border-gray-700 bg-transparent p-3 text-white placeholder-gray-500 transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        required
      />

      <div className="flex items-center justify-center gap-4 text-white">
        {/* CAMBIO DE ESTILO AQUÍ */}
        <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">-</button>
        <span className="text-2xl font-bold">{quantity}</span>
        {/* CAMBIO DE ESTILO AQUÍ */}
        <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="text-2xl font-bold rounded-md bg-gray-800 border border-gray-700 w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition-colors">+</button>
      </div>
      
      <button 
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-white px-6 py-3 font-bold text-black transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:bg-gray-500"
      >
        {isLoading ? 'Procesando...' : `Pagar ${quantity * TICKET_PRICE} ARS`}
      </button>
    </form>
  );
}