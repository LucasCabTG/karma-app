// Archivo: src/app/admin/config/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';

interface Lote {
  id: string;
  nombre: string;
  precio: number;
  limite: number;
  vendidas: number;
}

export default function ConfigPage() {
  const [loteActivo, setLoteActivo] = useState(0);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Estados para el nuevo formulario de creación
  const [newLoteName, setNewLoteName] = useState('');
  const [newLotePrice, setNewLotePrice] = useState(0);
  const [newLoteLimit, setNewLoteLimit] = useState(0);

  // Cargar todos los datos al iniciar
  const fetchConfig = async () => {
    setLoading(true);
    const configRef = doc(db, 'config', 'evento_actual');
    const configSnap = await getDoc(configRef);
    if (configSnap.exists()) {
      setLoteActivo(configSnap.data().loteActivo);
    }

    const lotesRef = collection(db, 'config', 'evento_actual', 'lotes');
    const lotesSnap = await getDocs(lotesRef);
    const lotesData = lotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lote));
    setLotes(lotesData.sort((a, b) => Number(a.id) - Number(b.id)));
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Función para guardar el lote activo (ya la tenías)
  const handleSetLoteActivo = async () => {
    setMessage('Guardando...');
    const configRef = doc(db, 'config', 'evento_actual');
    try {
      await updateDoc(configRef, { loteActivo: Number(loteActivo) });
      setMessage('¡Lote activo guardado!');
    } catch (err) {
      setMessage('Error al guardar.');
    }
  };

  // --- NUEVAS FUNCIONES DE EDICIÓN ---

  // 1. Función para manejar cambios en los inputs de los lotes existentes
  const handleLoteFieldChange = (index: number, field: keyof Lote, value: string | number) => {
    const updatedLotes = [...lotes];
    // TypeScript necesita esta conversión
    (updatedLotes[index] as any)[field] = value;
    setLotes(updatedLotes);
  };

  // 2. Función para guardar los cambios de un lote específico en Firestore
  const handleSaveLote = async (loteId: string, index: number) => {
    setMessage(`Guardando ${lotes[index].nombre}...`);
    const loteRef = doc(db, 'config', 'evento_actual', 'lotes', loteId);
    const { nombre, precio, limite } = lotes[index];
    try {
      await updateDoc(loteRef, {
        nombre: nombre,
        precio: Number(precio),
        limite: Number(limite)
      });
      setMessage(`¡${nombre} actualizado!`);
    } catch (err) {
      console.error(err);
      setMessage(`Error al actualizar ${nombre}.`);
    }
  };

  // 3. Función para crear un nuevo lote
  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLoteId = String(lotes.length + 1); // Asigna el ID siguiente (ej. "3")
    setMessage(`Creando Lote ${newLoteId}...`);
    
    const loteRef = doc(db, 'config', 'evento_actual', 'lotes', newLoteId);
    try {
      await setDoc(loteRef, {
        nombre: newLoteName || `Lote ${newLoteId}`,
        precio: Number(newLotePrice),
        limite: Number(newLoteLimit),
        vendidas: 0
      });
      setMessage(`¡Lote ${newLoteId} creado!`);
      // Limpiamos el formulario y recargamos la lista
      setNewLoteName('');
      setNewLotePrice(0);
      setNewLoteLimit(0);
      fetchConfig();
    } catch (err) {
      console.error(err);
      setMessage('Error al crear el nuevo lote.');
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando configuración...</div>;

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Lotes (Vol. 2)</h1>
      <p className="mb-4 text-red-400">{message}</p>

      {/* --- SECCIÓN 1: ACTIVAR LOTE --- */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Seleccionar Lote Activo</h2>
        <div className="flex gap-4">
          <select 
            value={loteActivo} 
            onChange={(e) => setLoteActivo(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white"
          >
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>{lote.nombre} ({lote.precio} ARS)</option>
            ))}
          </select>
          <button onClick={handleSetLoteActivo} className="bg-blue-600 px-4 py-2 rounded-md font-bold hover:bg-blue-500">
            Activar Lote
          </button>
        </div>
      </div>

      {/* --- SECCIÓN 2: EDITAR LOTES EXISTENTES --- */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Editar Lotes Existentes</h2>
        <div className="space-y-4">
          {lotes.map((lote, index) => (
            <div key={lote.id} className="bg-gray-700 p-4 rounded-md flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm text-gray-400">Nombre</label>
                <input 
                  type="text" 
                  value={lote.nombre}
                  onChange={(e) => handleLoteFieldChange(index, 'nombre', e.target.value)}
                  className="w-full bg-gray-600 p-2 rounded-md text-white"
                />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-sm text-gray-400">Precio (ARS)</label>
                <input 
                  type="number" 
                  value={lote.precio}
                  onChange={(e) => handleLoteFieldChange(index, 'precio', Number(e.target.value))}
                  className="w-full bg-gray-600 p-2 rounded-md text-white"
                />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-sm text-gray-400">Límite (Stock)</label>
                <input 
                  type="number" 
                  value={lote.limite}
                  onChange={(e) => handleLoteFieldChange(index, 'limite', Number(e.target.value))}
                  className="w-full bg-gray-600 p-2 rounded-md text-white"
                />
              </div>
              <div className="text-center">
                <span className="text-xl font-bold">{lote.vendidas}</span>
                <p className="text-sm text-gray-400">Vendidas</p>
              </div>
              <button onClick={() => handleSaveLote(lote.id, index)} className="bg-green-600 h-10 px-4 rounded-md font-bold hover:bg-green-500">
                Guardar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECCIÓN 3: CREAR NUEVO LOTE --- */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Crear Nuevo Lote (Ej. Lote {lotes.length + 1})</h2>
        <form onSubmit={handleCreateLote} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400">Nombre del Lote</label>
            <input 
              type="text" 
              value={newLoteName}
              onChange={(e) => setNewLoteName(e.target.value)}
              placeholder={`Lote ${lotes.length + 1}`}
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-sm text-gray-400">Precio (ARS)</label>
            <input 
              type="number" 
              value={newLotePrice}
              onChange={(e) => setNewLotePrice(Number(e.target.value))}
              placeholder="18000"
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-sm text-gray-400">Límite (Stock)</label>
            <input 
              type="number" 
              value={newLoteLimit}
              onChange={(e) => setNewLoteLimit(Number(e.target.value))}
              placeholder="200"
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <button type="submit" className="bg-purple-600 h-10 px-4 rounded-md font-bold hover:bg-purple-500">
            Crear Lote
          </button>
        </form>
      </div>
    </div>
  );
}