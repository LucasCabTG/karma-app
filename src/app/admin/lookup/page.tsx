// Archivo: src/app/admin/lookup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
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
}

export default function LookupPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [allTickets, setAllTickets] = useState<IndividualTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<IndividualTicket[]>([]);

  useEffect(() => {
    const fetchAllTickets = async () => {
      setIsLoading(true);
      try {
        const ticketsRef = collection(db, 'individual_tickets');
        const q = query(ticketsRef);
        const querySnapshot = await getDocs(q);

        const foundTickets: IndividualTicket[] = [];
        querySnapshot.forEach((doc) => {
          foundTickets.push({ id: doc.id, ...doc.data() } as IndividualTicket);
        });

        setAllTickets(foundTickets);
        setFilteredTickets(foundTickets);
        setMessage(`Mostrando ${foundTickets.length} ticket(s).`);

      } catch (err) {
        console.error(err);
        setMessage('Error al cargar la lista de tickets.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTickets();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      setFilteredTickets(allTickets);
      return;
    }

    const filtered = allTickets.filter(ticket => 
      ticket.comprador.toLowerCase().includes(term) ||
      ticket.email.toLowerCase().includes(term)
    );

    setFilteredTickets(filtered);
  }, [searchTerm, allTickets]);

  const handleManualValidation = async (ticketId: string) => {
    setIsLoading(true);
    try {
      const ticketRef = doc(db, 'individual_tickets', ticketId);
      await updateDoc(ticketRef, { asistio: true });

      const updateTicketState = (tickets: IndividualTicket[]) => {
        return tickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, asistio: true } : ticket
        );
      };

      setAllTickets(prevTickets => updateTicketState(prevTickets));
      setFilteredTickets(prevTickets => updateTicketState(prevTickets));
      
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
      <h1 className="text-3xl font-bold mb-6">Buscador Manual de Entradas</h1>

      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar por Email o Nombre..."
          className="flex-grow w-full bg-gray-700 border border-gray-600 p-3 rounded-md text-white placeholder-gray-400"
        />
      </div>

      {message && <p className="text-gray-400 mb-4">{message}</p>}

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* CORRECCIÓN AQUÍ: Usamos allTickets.length para la carga inicial */}
        {isLoading && allTickets.length === 0 ? (
          <p className="p-4 text-center text-gray-400">Cargando tickets...</p>
        ) : (
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
              {/* CORRECCIÓN AQUÍ: Mapeamos sobre filteredTickets */}
              {filteredTickets.map((ticket) => (
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
                      onClick={() => handleManualValidation(ticket.id)}
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
        )}
      </div>
    </div>
  );
}