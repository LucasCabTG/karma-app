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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [allTickets, setAllTickets] = useState<IndividualTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<IndividualTicket[]>([]);

  const formatFecha = (timestamp?: Timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

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
    let filtered = allTickets;

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(ticket => 
        ticket.comprador.toLowerCase().includes(term) ||
        ticket.email.toLowerCase().includes(term)
      );
    }

    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      filtered = filtered.filter(ticket => {
        if (!ticket.fechaGeneracion) return false;
        const ticketDate = ticket.fechaGeneracion.toDate();
        return ticketDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(ticket => {
        if (!ticket.fechaGeneracion) return false;
        const ticketDate = ticket.fechaGeneracion.toDate();
        return ticketDate <= end;
      });
    }

    setFilteredTickets(filtered);
  }, [searchTerm, startDate, endDate, allTickets]);

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
    <div className="p-4 md:p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Buscador Manual</h1>

      {/* --- PANEL DE FILTROS --- */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700 shadow-lg mb-6 flex flex-col gap-4">
        {/* Búsqueda por Texto */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Email o Nombre..."
            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-lg text-white placeholder-gray-400 text-base md:text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Filtros por Fecha y Reset */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Fecha Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Fecha Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer"
            />
          </div>

          {(searchTerm || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98] h-[46px] flex items-center justify-center whitespace-nowrap md:mt-5"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
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
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-1">
                    <span>ID: {ticket.id.substring(0, 8)}...</span>
                    <span>{formatFecha(ticket.fechaGeneracion)}</span>
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
                    <th className="p-4">Fecha Compra</th>
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
                      <td className="p-4 text-gray-300 text-sm">
                        {formatFecha(ticket.fechaGeneracion)}
                      </td>
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