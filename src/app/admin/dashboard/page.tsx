// Archivo: src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase'; // SDK de cliente
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

interface Lote {
  id: string;
  nombre: string;
  precio: number;
  limite: number;
  vendidas: number;
}

interface StatsCardProps {
  titulo: string;
  valor: string | number;
  claseColor: string;
}

// Un componente visual para las tarjetas de estadísticas
function StatCard({ titulo, valor, claseColor }: StatsCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-400 uppercase">{titulo}</h3>
      <p className={`text-4xl font-bold mt-2 ${claseColor}`}>{valor}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteActivoId, setLoteActivoId] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Nos suscribimos en tiempo real al documento de config
    const configRef = doc(db, 'config', 'evento_actual');
    const unsubConfig = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        setLoteActivoId(String(doc.data().loteActivo));
      }
    });

    // 2. Nos suscribimos en tiempo real a la colección de lotes
    const lotesRef = collection(db, 'config', 'evento_actual', 'lotes');
    const q = query(lotesRef, orderBy('__name__')); // Ordenar por ID ('1', '2', etc.)
    
    const unsubLotes = onSnapshot(q, (snapshot) => {
      const lotesData: Lote[] = [];
      snapshot.forEach(doc => {
        lotesData.push({ id: doc.id, ...doc.data() } as Lote);
      });
      setLotes(lotesData);
      setIsLoading(false);
    });

    // 3. Limpiamos las suscripciones al salir de la página
    return () => {
      unsubConfig();
      unsubLotes();
    };
  }, []); // El array vacío asegura que esto solo se ejecute una vez

  // 4. Calculamos los totales a partir de los datos en tiempo real
  const totalVendidas = lotes.reduce((sum, lote) => sum + lote.vendidas, 0);
  const totalCapacidad = lotes.reduce((sum, lote) => sum + lote.limite, 0);
  const cuposRestantes = totalCapacidad - totalVendidas;

  if (isLoading) {
    return <div className="p-8 text-white">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-8 text-white max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Ventas (Tiempo Real)</h1>
      
      {/* --- Estadísticas Principales --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard titulo="Entradas Vendidas" valor={totalVendidas} claseColor="text-green-400" />
        <StatCard titulo="Cupos Restantes" valor={cuposRestantes} claseColor="text-yellow-400" />
        <StatCard titulo="Capacidad Total" valor={totalCapacidad} claseColor="text-blue-400" />
      </div>

      {/* --- Estado de Lotes --- */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Estado de Lotes</h2>
        <div className="space-y-4">
          {lotes.map(lote => {
            const porcentaje = lote.limite > 0 ? (lote.vendidas / lote.limite) * 100 : 0;
            const isActivo = lote.id === loteActivoId;

            return (
              <div key={lote.id} className={`bg-gray-700 p-4 rounded-lg border-l-4 ${isActivo ? 'border-green-400' : 'border-gray-600'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-lg font-bold ${isActivo ? 'text-green-400' : ''}`}>
                    {lote.nombre} {isActivo ? '(ACTIVO)' : ''}
                  </span>
                  <span className="text-xl font-bold">{lote.vendidas} / {lote.limite}</span>
                </div>
                {/* Barra de Progreso */}
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div 
                    className="bg-green-400 h-2.5 rounded-full" 
                    style={{ width: `${porcentaje}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}