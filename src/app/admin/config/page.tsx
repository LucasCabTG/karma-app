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
  preciosPorCantidad?: { [cantidad: string]: number };
}

export default function ConfigPage() {
  const [loteActivo, setLoteActivo] = useState(0);
  const [emailText, setEmailText] = useState('');
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [newLoteName, setNewLoteName] = useState('');
  const [newLotePrice, setNewLotePrice] = useState(0);
  const [newLoteLimit, setNewLoteLimit] = useState(0);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const configRef = doc(db, 'config', 'evento_actual');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setLoteActivo(data.loteActivo);
        setEmailText(data.emailText || '');
      }

      const lotesRef = collection(db, 'config', 'evento_actual', 'lotes');
      const lotesSnap = await getDocs(lotesRef);
      const lotesData = lotesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          precio: data.precio,
          limite: data.limite,
          vendidas: data.vendidas,
          preciosPorCantidad: data.preciosPorCantidad || {}
        } as Lote;
      });
      setLotes(lotesData.sort((a, b) => Number(a.id) - Number(b.id)));
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveGeneralConfig = async () => {
    setMessage('Guardando configuración...');
    const configRef = doc(db, 'config', 'evento_actual');
    try {
      await updateDoc(configRef, { 
        loteActivo: Number(loteActivo),
        emailText: emailText
      });
      setMessage('¡Configuración general guardada!');
    } catch {
      setMessage('Error al guardar configuración.');
    }
  };

  const handleLoteFieldChange = (index: number, field: keyof Lote, value: string | number) => {
    const updatedLotes = [...lotes];
    // CORRECCIÓN: Deshabilitamos la regla de 'any' solo para esta línea
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updatedLotes[index] as any)[field] = value;
    setLotes(updatedLotes);
  };

  const handleSaveLote = async (loteId: string, index: number) => {
    setMessage(`Guardando ${lotes[index].nombre}...`);
    const loteRef = doc(db, 'config', 'evento_actual', 'lotes', loteId);
    const { nombre, precio, limite, preciosPorCantidad } = lotes[index];
    try {
      await updateDoc(loteRef, {
        nombre: nombre,
        precio: Number(precio),
        limite: Number(limite),
        preciosPorCantidad: preciosPorCantidad || {}
      });
      setMessage(`¡${nombre} actualizado!`);
    } catch (err) {
      console.error(err);
      setMessage(`Error al actualizar ${nombre}.`);
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLoteId = String(lotes.length + 1);
    setMessage(`Creando Lote ${newLoteId}...`);
    
    const loteRef = doc(db, 'config', 'evento_actual', 'lotes', newLoteId);
    try {
      await setDoc(loteRef, {
        nombre: newLoteName || `Lote ${newLoteId}`,
        precio: Number(newLotePrice),
        limite: Number(newLoteLimit),
        vendidas: 0,
        preciosPorCantidad: {}
      });
      setMessage(`¡Lote ${newLoteId} creado!`);
      setNewLoteName('');
      setNewLotePrice(0);
      setNewLoteLimit(0);
      fetchConfig();
    } catch (err) {
      console.error(err);
      setMessage('Error al crear el nuevo lote.');
    }
  };

  const handleDeletePrecioEspecial = (index: number, quantityStr: string) => {
    const updatedLotes = [...lotes];
    const lote = { ...updatedLotes[index] };
    const precios = { ...lote.preciosPorCantidad };
    delete precios[quantityStr];
    lote.preciosPorCantidad = precios;
    updatedLotes[index] = lote;
    setLotes(updatedLotes);
  };

  const handleAddPrecioEspecial = (index: number, loteId: string) => {
    const qtyInput = document.getElementById(`new-qty-${loteId}`) as HTMLInputElement;
    const priceInput = document.getElementById(`new-price-${loteId}`) as HTMLInputElement;
    
    if (!qtyInput || !priceInput) return;
    
    const qty = parseInt(qtyInput.value);
    const price = parseFloat(priceInput.value);
    
    if (isNaN(qty) || qty < 2 || isNaN(price) || price <= 0) {
      alert("Por favor, ingresá una cantidad mayor o igual a 2 y un precio válido.");
      return;
    }
    
    const updatedLotes = [...lotes];
    const lote = { ...updatedLotes[index] };
    const precios = { ...(lote.preciosPorCantidad || {}) };
    precios[String(qty)] = price;
    lote.preciosPorCantidad = precios;
    updatedLotes[index] = lote;
    setLotes(updatedLotes);
    
    // Limpiar inputs
    qtyInput.value = '';
    priceInput.value = '';
  };

  if (loading) return <div className="p-8 text-white">Cargando configuración...</div>;

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Lotes (Vol. 4)</h1>
      <p className="mb-4 text-red-400">{message}</p>

      {/* --- SECCIÓN 1: CONFIGURACIÓN GENERAL --- */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Configuración General</h2>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Lote Activo para la Venta</label>
          <select 
            value={loteActivo} 
            onChange={(e) => setLoteActivo(Number(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white"
          >
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>{lote.nombre} ({lote.precio} ARS)</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Texto Personalizado para el Email (arriba del QR)</label>
          <textarea 
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Tu lugar para KARMA Vol. 4 está confirmado. Presentá los siguientes códigos QR en la entrada..."
            className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white h-32"
          />
        </div>

        <button onClick={handleSaveGeneralConfig} className="bg-blue-600 px-6 py-2 rounded-md font-bold hover:bg-blue-500 w-full transition-colors">
          Guardar Configuración General
        </button>
      </div>

      {/* --- SECCIÓN 2: EDITAR LOTES EXISTENTES --- */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Editar Lotes Existentes</h2>
        <div className="space-y-6">
          {lotes.map((lote, index) => (
            <div key={lote.id} className="bg-gray-700 p-6 rounded-lg flex flex-col gap-4 border border-gray-600">
              <div className="flex flex-wrap gap-4 items-end w-full">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    value={lote.nombre}
                    onChange={(e) => handleLoteFieldChange(index, 'nombre', e.target.value)}
                    className="w-full bg-gray-600 p-2 rounded-md text-white"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-sm text-gray-400 mb-1">Precio Base (ARS)</label>
                  <input 
                    type="number" 
                    value={lote.precio}
                    onChange={(e) => handleLoteFieldChange(index, 'precio', Number(e.target.value))}
                    className="w-full bg-gray-600 p-2 rounded-md text-white"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-sm text-gray-400 mb-1">Límite (Stock)</label>
                  <input 
                    type="number" 
                    value={lote.limite}
                    onChange={(e) => handleLoteFieldChange(index, 'limite', Number(e.target.value))}
                    className="w-full bg-gray-600 p-2 rounded-md text-white"
                  />
                </div>
                <div className="text-center px-4">
                  <span className="text-xl font-bold">{lote.vendidas}</span>
                  <p className="text-xs text-gray-400">Vendidas</p>
                </div>
                <button 
                  onClick={() => handleSaveLote(lote.id, index)} 
                  className="bg-green-600 h-10 px-4 rounded-md font-bold hover:bg-green-500 transition-colors"
                >
                  Guardar
                </button>
              </div>

              {/* Seccion de Precios Especiales por Cantidad */}
              <div className="bg-gray-800/60 p-4 rounded-md border border-gray-600/50 mt-2">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>🏷️ Precios Especiales por Cantidad (Combos / Promos)</span>
                </h4>
                
                {/* Lista de precios especiales */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(lote.preciosPorCantidad || {}).map(([qtyStr, val]) => (
                    <div key={qtyStr} className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-400">{qtyStr} entradas:</span>
                      <span className="font-bold text-green-400">${val.toLocaleString('es-AR')} ARS</span>
                      <button 
                        type="button" 
                        onClick={() => handleDeletePrecioEspecial(index, qtyStr)} 
                        className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!lote.preciosPorCantidad || Object.keys(lote.preciosPorCantidad).length === 0) && (
                    <p className="text-xs text-gray-500 italic">No hay precios especiales configurados. El precio por entrada es lineal.</p>
                  )}
                </div>

                {/* Formulario para agregar precio especial */}
                <div className="flex flex-wrap items-end gap-3 text-sm">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cantidad de entradas</label>
                    <input 
                      type="number" 
                      min="2" 
                      placeholder="Ej: 2"
                      id={`new-qty-${lote.id}`}
                      className="bg-gray-700 border border-gray-600 p-1.5 rounded-md w-24 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Precio Total (ARS)</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 10000"
                      id={`new-price-${lote.id}`}
                      className="bg-gray-700 border border-gray-600 p-1.5 rounded-md w-36 text-white placeholder-gray-500"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleAddPrecioEspecial(index, lote.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium text-xs h-[34px] transition-colors"
                  >
                    + Agregar Promo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECCIÓN 3: CREAR NUEVO LOTE --- */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Crear Nuevo Lote (Ej. Lote {lotes.length + 1})</h2>
        <form onSubmit={handleCreateLote} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400 mb-1">Nombre del Lote</label>
            <input 
              type="text" 
              value={newLoteName}
              onChange={(e) => setNewLoteName(e.target.value)}
              placeholder={`Lote ${lotes.length + 1}`}
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-sm text-gray-400 mb-1">Precio (ARS)</label>
            <input 
              type="number" 
              value={newLotePrice}
              onChange={(e) => setNewLotePrice(Number(e.target.value))}
              placeholder="18000"
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-sm text-gray-400 mb-1">Límite (Stock)</label>
            <input 
              type="number" 
              value={newLoteLimit}
              onChange={(e) => setNewLoteLimit(Number(e.target.value))}
              placeholder="200"
              className="w-full bg-gray-600 p-2 rounded-md text-white"
            />
          </div>
          <button type="submit" className="bg-purple-600 h-10 px-4 rounded-md font-bold hover:bg-purple-500 transition-colors">
            Crear Lote
          </button>
        </form>
      </div>
    </div>
  );
}