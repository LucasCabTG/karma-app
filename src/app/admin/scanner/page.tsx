// Archivo: src/app/admin/scanner/page.tsx (Versión final funcional)

'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Definimos los posibles estados del ticket para manejar la UI
type TicketStatus = 'VALIDO' | 'USADO' | 'NO_ENCONTRADO' | 'ESCANEANDO' | 'ERROR';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('ESCANEANDO');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', // El ID del div que creamos en el HTML
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5, // Fotogramas por segundo para el escaneo
      },
      false
    );

    async function onScanSuccess(decodedText: string) {
      // Para evitar múltiples escaneos del mismo QR seguido
      if (decodedText === lastScannedId) return;

      scanner.pause(); // Pausamos el scanner mientras procesamos
      setLastScannedId(decodedText);
      setScanResult(decodedText);

      try {
        // 1. Buscamos el ticket en Firestore usando el ID del QR
        const ticketRef = doc(db, 'tickets', decodedText);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
          // 2. El ticket existe. Verificamos si ya asistió.
          const ticketData = ticketSnap.data();
          if (ticketData.asistio) {
            setTicketStatus('USADO');
          } else {
            // 3. El ticket es válido. Lo marcamos como usado.
            await updateDoc(ticketRef, { asistio: true });
            setTicketStatus('VALIDO');
          }
        } else {
          // 4. El ticket no se encontró en la base de datos.
          setTicketStatus('NO_ENCONTRADO');
        }
      } catch (err) {
        setTicketStatus('ERROR');
        console.error("Error al verificar el ticket:", err);
      }

      // Después de unos segundos, reseteamos para poder escanear de nuevo
      setTimeout(() => {
        setTicketStatus('ESCANEANDO');
        setLastScannedId(null);
        if (scanner.getState() !== 2) { // 2 is SCANNING state
          scanner.resume();
        }
      }, 3000);
    }

    function onScanFailure(error: any) {
      // No hacemos nada, simplemente ignoramos los fallos para que siga intentando
    }

    scanner.render(onScanSuccess, onScanFailure);

    // Limpieza al desmontar el componente
    return () => {
      scanner.clear().catch(error => {
        console.error("Fallo al limpiar el scanner.", error);
      });
    };
  }, [lastScannedId]);

  // Función para determinar el estilo de la tarjeta de resultado
  const getStatusStyle = () => {
    switch (ticketStatus) {
      case 'VALIDO':
        return 'bg-green-500';
      case 'USADO':
        return 'bg-yellow-500';
      case 'NO_ENCONTRADO':
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gray-900 p-4 text-white">
      <h1 className="mt-8 text-4xl font-bold">Escaner KARMA</h1>
      
      <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden"></div>

      <div className={`w-full max-w-sm rounded-lg p-6 text-center text-4xl font-black uppercase ${getStatusStyle()}`}>
        {ticketStatus.replace('_', ' ')}
      </div>
    </div>
  );
}