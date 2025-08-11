// Archivo: src/app/page.tsx (Versión con QR)

'use client';

import { useState } from 'react';
import { collection, addDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase";
import { Monoton } from 'next/font/google';
// 1. Importamos el componente para generar el QR
import QRCode from "react-qr-code";

const monoton = Monoton({
  subsets: ['latin'],
  weight: '400'
});

export default function HomePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 2. Nuevo estado para guardar el ID del ticket y mostrar el QR
  const [qrCodeValue, setQrCodeValue] = useState('');

  const handleBuyTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!name || !email) {
      alert('Por favor, completa tu nombre y email.');
      setIsLoading(false);
      return;
    }

    try {
      const newTicket = {
        comprador: name,
        email: email,
        fechaCompra: new Date(),
        asistio: false
      };
      
      const docRef = await addDoc(collection(db, "tickets"), newTicket);
      
      alert(`¡Ticket comprado con éxito! ID: ${docRef.id}`);
      // 3. Guardamos el ID del documento en nuestro nuevo estado
      setQrCodeValue(docRef.id);
      
      setName('');
      setEmail('');

    } catch (error) {
      console.error("Error al comprar ticket: ", error);
      alert("Hubo un error al procesar tu compra.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      
      <div className="w-full max-w-md text-center">
        
        <h1 className={`${monoton.className} animate-pulse text-6xl font-extrabold uppercase tracking-widest text-gray-100 md:text-8xl`}>
          KARMA
        </h1>
        
        <p className="mt-4 text-lg text-gray-400">
          LO QUE VIBRA, VUELVE.
        </p>

        {/* 4. Lógica condicional: Si tenemos un QR, lo mostramos. Si no, mostramos el formulario. */}
        {qrCodeValue ? (
          // Vista del Ticket con QR
          <div className="mt-8 flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6">
            <h2 className="text-2xl font-bold text-white">¡Compra exitosa!</h2>
            <p className="text-gray-300">Presentá este código en la entrada.</p>
            <div className="mt-4 rounded-lg bg-white p-4">
              <QRCode value={qrCodeValue} size={180} />
            </div>
            <p className="mt-2 text-xs text-gray-500">ID: {qrCodeValue}</p>
            <button
              onClick={() => setQrCodeValue('')}
              className="mt-4 w-full rounded-lg bg-white px-6 py-3 font-bold text-black transition-colors hover:bg-gray-300"
            >
              Comprar otro ticket
            </button>
          </div>
        ) : (
          // Formulario de Compra
          <form onSubmit={handleBuyTicket} className="mt-8 flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y Apellido"
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
              required
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-white px-6 py-3 font-bold text-black transition-colors hover:bg-gray-300 disabled:bg-gray-500"
            >
              {isLoading ? 'Procesando...' : 'Comprar Ticket'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}