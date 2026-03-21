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

        foundTickets.sort((a, b) => {
          // Usamos localeCompare para manejar bien tildes y eñes
          return a.comprador.localeCompare(b.comprador);
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
    <div className="p-4 md:p-8 text-white max-w-4xl mx-auto"> {/* Ajustamos padding para móvil */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Buscador Manual</h1>

      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por Email o Nombre..."
          className="w-full bg-gray-700 border border-gray-600 p-4 rounded-md text-white placeholder-gray-400 text-lg" // Input más grande para dedos en móvil
        />
      </div>

      {message && <p className="text-gray-400 mb-4 bg-gray-900/50 p-2 rounded text-sm">{message}</p>}

      <div className="rounded-lg shadow-lg overflow-hidden">
        {isLoading && allTickets.length === 0 ? (
          <p className="p-4 text-center text-gray-400">Cargando tickets...</p>
        ) : (
          <>
            {/* --- VISTA PARA CELULARES (Cards) --- */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg text-white leading-tight">{ticket.comprador}</p>
                      <p className="text-gray-400 text-sm truncate max-w-[200px]">{ticket.email}</p>
                    </div>
                    {ticket.asistio ? (
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-[10px] font-bold">YA USADO</span>
                    ) : (
                      <span className="bg-green-500 text-black px-2 py-1 rounded-full text-[10px] font-bold">VÁLIDO</span>
                    )}
                  </div>
                  
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    ID: {ticket.id}
                  </div>

                  <button
                    disabled={ticket.asistio || isLoading}
                    onClick={() => handleManualValidation(ticket.id)}
                    className={`w-full py-3 rounded-md font-bold text-black transition-colors ${
                      ticket.asistio 
                        ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                        : 'bg-green-500 active:bg-green-600'
                    }`}
                  >
                    {ticket.asistio ? 'Validado' : 'Validar Entrada'}
                  </button>
                </div>
              ))}
            </div>

            {/* --- VISTA PARA DESKTOP (Tabla normal) --- */}
            <div className="hidden md:block bg-gray-800">
              <table className="w-full text-left">
                <thead className="bg-gray-700 uppercase text-xs text-gray-400">
                  <tr>
                    <th className="p-4">Comprador</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{ticket.comprador}</p>
                        <p className="text-xs text-gray-500 font-mono">{ticket.id.substring(0, 8)}...</p>
                      </td>
                      <td className="p-4 text-gray-300">{ticket.email}</td>
                      <td className="p-4">
                        {ticket.asistio ? (
                          <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">YA USADO</span>
                        ) : (
                          <span className="bg-green-500 text-black px-2 py-1 rounded-full text-xs font-bold">VÁLIDO</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={ticket.asistio || isLoading}
                          onClick={() => handleManualValidation(ticket.id)}
                          className={`px-4 py-2 rounded-md font-bold text-sm text-black ${
                            ticket.asistio 
                              ? 'bg-gray-500 cursor-not-allowed' 
                              : 'bg-green-500 hover:bg-green-400'
                          }`}
                        >
                          {ticket.asistio ? 'Check-in OK' : 'Validar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}