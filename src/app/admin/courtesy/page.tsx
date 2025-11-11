// Archivo: src/app/admin/courtesy/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Lote {
  id: string;
  nombre: string;
}

export default function CourtesyPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedLote, setSelectedLote] = useState('99'); // ID del lote de cortesía por defecto

  // Cargar los lotes para el dropdown
  useEffect(() => {
    const fetchLotes = async () => {
      const lotesRef = collection(db, 'config', 'evento_actual', 'lotes');
      const lotesSnap = await getDocs(lotesRef);
      const lotesData = lotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lote));
      setLotes(lotesData);
    };
    fetchLotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || quantity < 1) {
      setMessage("Por favor, completá todos los campos.");
      return;
    }

    setIsLoading(true);
    setMessage('Enviando tickets...');

    try {
      const response = await fetch('/api/admin/create-courtesy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          quantity: Number(quantity),
          loteId: selectedLote
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el servidor');
      }

      setMessage(`¡Éxito! Se enviaron ${quantity} ticket(s) a ${email}.`);
      // Limpiar formulario
      setName('');
      setEmail('');
      setQuantity(1);

    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 text-white max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Enviar Entradas de Cortesía</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nombre del Invitado</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 p-3 rounded-md text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email del Invitado</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 p-3 rounded-md text-white"
            required
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-md text-white"
              min="1"
              required
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Asignar al Lote</label>
            <select 
              value={selectedLote} 
              onChange={(e) => setSelectedLote(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-md text-white"
            >
              {lotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-600 px-6 py-3 rounded-md font-bold hover:bg-green-500 disabled:bg-gray-500"
        >
          {isLoading ? 'Enviando...' : 'Enviar Entradas'}
        </button>

        {message && (
          <p className={`mt-4 text-center ${isLoading ? 'text-gray-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}