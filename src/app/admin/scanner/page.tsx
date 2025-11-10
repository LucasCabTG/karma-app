// Archivo: src/app/admin/scanner/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// No necesitamos 'signOut' ni 'auth' aquí

type TicketStatus = 'VALIDO' | 'USADO' | 'NO_ENCONTRADO' | 'VENCIDO' | 'ESCANEANDO' | 'ERROR' | 'DETENIDO';

export default function ScannerPage() {
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>();
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('DETENIDO');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        if (!selectedCameraId) {
          setSelectedCameraId(devices[0].id);
        }
      }
    }).catch(err => {
      console.error("Error al obtener cámaras:", err);
    });
  }, [selectedCameraId]);
  
  const onScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const ticketRef = doc(db, 'individual_tickets', decodedText);
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        const ticketData = ticketSnap.data();
        
        if (ticketData.evento !== 2) {
          setTicketStatus('VENCIDO');
        } else if (ticketData.asistio) {
          setTicketStatus('USADO');
        } else {
          await updateDoc(ticketRef, { asistio: true });
          setTicketStatus('VALIDO');
        }
      } else {
        setTicketStatus('NO_ENCONTRADO');
      }
    } catch (err) {
      setTicketStatus('ERROR');
      console.error("Error al verificar el ticket:", err);
    }
    
    setTimeout(() => {
      setTicketStatus('ESCANEANDO');
      setIsProcessing(false);
    }, 3000);
  };

  const startScanner = () => {
    if (selectedCameraId && (!scanner || !scanner.isScanning)) {
      const qrScanner = new Html5Qrcode('qr-reader-container', false);
      setScanner(qrScanner);
      setTicketStatus('ESCANEANDO');
      qrScanner.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {} // <-- CORRECCIÓN: Función vacía sin parámetro 'errorMessage'
      ).catch(err => {
        console.error("Error al iniciar el scanner:", err);
        setTicketStatus('ERROR');
      });
    }
  };

  const stopScanner = () => {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => {
        setTicketStatus('DETENIDO');
        setIsProcessing(false);
      }).catch(err => console.error("Error al detener el scanner:", err));
    }
  };
  
  // La función handleLogout ya no está aquí, vive en la Navbar
  
  const getStatusStyle = () => {
    switch (ticketStatus) {
      case 'VALIDO': return 'bg-green-500';
      case 'USADO': return 'bg-yellow-500';
      case 'VENCIDO': return 'bg-orange-500'; 
      case 'NO_ENCONTRADO':
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gray-900 p-4 text-white">
      {/* Ya no hay botón de Logout aquí */}
      <h1 className="mt-8 text-4xl font-bold">Escaner KARMA</h1>
      
      <div 
        id="qr-reader-container" 
        className="w-full max-w-sm rounded-lg overflow-hidden bg-black aspect-square border-4 border-dashed border-gray-600 flex items-center justify-center"
      ></div>
      
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white p-2 rounded-md"
        >
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>{camera.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={startScanner} className="bg-green-600 p-3 rounded-md w-full font-bold">Iniciar Cámara</button>
          <button onClick={stopScanner} className="bg-red-600 p-3 rounded-md w-full font-bold">Detener</button>
        </div>
      </div>
      
      <div className={`w-full max-w-sm rounded-lg p-6 text-center text-4xl font-black uppercase ${getStatusStyle()}`}>
        {ticketStatus.replace('_', ' ')}
      </div>
    </div>
  );
}