// Archivo: src/app/admin/scanner/page.tsx (Versión final con Logout)

'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // 1. Importamos 'auth'
import { signOut } from 'firebase/auth'; // 2. Importamos la función 'signOut'

type TicketStatus = 'VALIDO' | 'USADO' | 'NO_ENCONTRADO' | 'ESCANEANDO' | 'ERROR';

export default function ScannerPage() {
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('ESCANEANDO');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { qrbox: { width: 250, height: 250 }, fps: 5 },
      false
    );

    async function onScanSuccess(decodedText: string) {
      if (decodedText === lastScannedId) return;
      scanner.pause();
      setLastScannedId(decodedText);

      try {
        const ticketRef = doc(db, 'individual_tickets', decodedText);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
          ticketSnap.data().asistio ? setTicketStatus('USADO') : (await updateDoc(ticketRef, { asistio: true }), setTicketStatus('VALIDO'));
        } else {
          setTicketStatus('NO_ENCONTRADO');
        }
      } catch (err) {
        setTicketStatus('ERROR');
        console.error("Error al verificar el ticket:", err);
      }

      setTimeout(() => {
        setTicketStatus('ESCANEANDO');
        setLastScannedId(null);
        if (scanner.getState() !== 2) scanner.resume();
      }, 3000);
    }

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(error => console.error("Fallo al limpiar.", error));
    };
  }, [lastScannedId]);
  
  // 3. Creamos la función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // ¡No necesitamos redirigir! El layout se encargará de eso.
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un error al cerrar la sesión.");
    }
  };
  
  const getStatusStyle = () => {
    switch (ticketStatus) {
      case 'VALIDO': return 'bg-green-500';
      case 'USADO': return 'bg-yellow-500';
      case 'NO_ENCONTRADO':
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gray-900 p-4 text-white">
      {/* 4. Añadimos el botón de logout en una esquina */}
      <button 
        onClick={handleLogout}
        className="absolute top-4 right-4 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        Cerrar Sesión
      </button>

      <h1 className="mt-8 text-4xl font-bold">Escaner KARMA</h1>
      
      <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden"></div>

      <div className={`w-full max-w-sm rounded-lg p-6 text-center text-4xl font-black uppercase ${getStatusStyle()}`}>
        {ticketStatus.replace('_', ' ')}
      </div>
    </div>
  );
}