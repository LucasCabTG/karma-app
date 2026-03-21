'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CourtesyPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lotes, setLotes] = useState<{id: string, nombre: string}[]>([]);
  const [selectedLote, setSelectedLote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Cargar lotes al inicio
  useEffect(() => {
    async function fetchLotes() {
      const snap = await getDocs(collection(db, 'config', 'evento_actual', 'lotes'));
      const data = snap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
      setLotes(data);
      if (data.length > 0) setSelectedLote(data[0].id);
    }
    fetchLotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/create-courtesy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, quantity, loteId: selectedLote }),
      });
      if (res.ok) {
        setMessage('✅ Cortesía enviada con éxito');
        setName(''); setEmail('');
      } else {
        setMessage('❌ Error al enviar');
      }
    } catch (err) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl">
        <h1 className="text-2xl font-bold text-green-400 mb-6">Generar Cortesía</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del invitado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-green-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-green-500"
            required
          />
          <div className="flex gap-4">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-1/2 bg-gray-900 p-3 rounded-lg border border-gray-700"
            />
            <select
              value={selectedLote}
              onChange={(e) => setSelectedLote(e.target.value)}
              className="w-1/2 bg-gray-900 p-3 rounded-lg border border-gray-700"
            >
              {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Enviando...' : 'Generar y Enviar QR'}
          </button>
        </form>
        {message && <p className="mt-4 text-center font-bold">{message}</p>}
      </div>
    </div>
  );
}