// Archivo: src/app/admin/lookup/page.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

interface IndividualTicket {
  id: string;
  orderId: string;
  comprador: string;
  email: string;
  asistio: boolean;
  fechaGeneracion: Timestamp;
  evento: number;
}

export default function LookupPage() {
  // 1. Cambiamos el nombre del estado a uno más genérico
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<IndividualTicket[]>([]);

  // 2. FUNCIÓN DE BÚSQUEDA ACTUALIZADA
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setResults([]);

    const term = searchTerm.trim();
    if (!term) {
      setIsLoading(false);
      return;
    }
    const emailTerm = term.toLowerCase(); // Los emails siempre los buscamos en minúscula

    try {
      const ticketsRef = collection(db, 'individual_tickets');
      
      // Query 1: Buscar por Email (exacto)
      const qEmail = query(
        ticketsRef,
        where('email', '==', emailTerm),
        where('evento', '==', 2)
      );

      // Query 2: Buscar por Nombre (exacto, sensible a mayúsculas)
      const qName = query(
        ticketsRef,
        where('comprador', '==', term),
        where('evento', '==', 2)
      );

      // Ejecutamos ambas búsquedas al mismo tiempo
      const [emailSnapshot, nameSnapshot] = await Promise.all([
        getDocs(qEmail),
        getDocs(qName)
      ]);

      // Usamos un Map para unir resultados y eliminar duplicados automáticamente
      const foundTicketsMap = new Map<string, IndividualTicket>();

      emailSnapshot.forEach((doc) => {
        foundTicketsMap.set(doc.id, { id: doc.id, ...doc.data() } as IndividualTicket);
      });

      nameSnapshot.forEach((doc) => {
        foundTicketsMap.set(doc.id, { id: doc.id, ...doc.data() } as IndividualTicket);
      });

      const foundTickets = Array.from(foundTicketsMap.values());

      if (foundTickets.length === 0) {
        setMessage(`No se encontraron tickets (Evento 2) para: "${term}"`);
      } else {
        setResults(foundTickets);
        setMessage(`Mostrando ${foundTickets.length} ticket(s).`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al realizar la búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualValidation = async (ticketId: string, index: number) => {
    setIsLoading(true);
    try {
      const ticketRef = doc(db, 'individual_tickets', ticketId);
      await updateDoc(ticketRef, { asistio: true });

      const updatedResults = [...results];
      updatedResults[index].asistio = true;
      setResults(updatedResults);
      
      setMessage(`¡Ticket ${ticketId.substring(0, 5)}... validado con éxito!`);
    } catch (err) {
      console.error(err);
      setMessage('Error al validar el ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Buscador Manual de Entradas (Vol. 2)</h1>

      {/* --- Formulario de Búsqueda --- */}
      <form onSubmit={handleSearch} className="flex gap-4 mb-6">
        {/* 3. Actualizamos el input */}
        <input
          type="text" // Cambiado de 'email' a 'text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por Email o Nombre exacto..." // Placeholder actualizado
          className="flex-grow bg-gray-700 border border-gray-600 p-3 rounded-md text-white placeholder-gray-400"
          required
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 px-6 py-3 rounded-md font-bold hover:bg-blue-500 disabled:bg-gray-500"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* --- Mensaje de Estado --- */}
      {message && <p className="text-gray-400 mb-4">{message}</p>}

      {/* --- Tabla de Resultados --- */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700 uppercase text-sm text-gray-400">
            <tr>
              <th className="p-4">Comprador</th>
              <th className="p-4">Email</th>
              <th className="p-4">ID de Ticket</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {results.map((ticket, index) => (
              <tr key={ticket.id} className="border-b border-gray-700">
                <td className="p-4">{ticket.comprador}</td>
                <td className="p-4">{ticket.email}</td>
                <td className="p-4 font-mono text-xs">{ticket.id}</td>
                <td className="p-4">
                  {ticket.asistio ? (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">YA USADO</span>
                  ) : (
                    <span className="bg-green-500 text-black px-2 py-1 rounded-full text-xs font-bold">VÁLIDO</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    disabled={ticket.asistio || isLoading}
                    onClick={() => handleManualValidation(ticket.id, index)}
                    className={`px-4 py-2 rounded-md font-bold text-sm text-black ${
                      ticket.asistio 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-400'
                    }`}
                  >
                    {ticket.asistio ? 'Validado' : 'Validar Manualmente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}