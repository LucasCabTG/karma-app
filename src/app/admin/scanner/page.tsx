'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ScannerPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [message, setMessage] = useState('Listo para escanear');
  const isProcessing = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    );

    async function onScanSuccess(decodedText: string) {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setStatus('processing');
      setMessage('Validando...');

      try {
        const ticketRef = doc(db, 'individual_tickets', decodedText);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
          setStatus('error');
          setMessage('❌ TICKET NO ENCONTRADO');
        } else {
          const data = ticketSnap.data();
          if (data.asistio) {
            setStatus('error');
            setMessage(`⚠️ YA USADO por ${data.comprador}`);
          } else {
            await updateDoc(ticketRef, { asistio: true });
            setStatus('success');
            setMessage(`✅ BIENVENIDO/A ${data.comprador}`);
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage('❌ ERROR DE CONEXIÓN');
      }

      setTimeout(() => {
        isProcessing.current = false;
        setStatus('idle');
        setMessage('Listo para el siguiente');
      }, 3000);
    }

    scanner.render(onScanSuccess, () => {});
    return () => { scanner.clear().catch(e => console.error(e)); };
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4">Escáner Karma Vol. 3</h1>
      
      <div id="reader" className="w-full max-w-sm border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-950 p-2 text-center html5-qrcode-overrides"></div>

      <div className={`mt-6 w-full max-w-sm p-8 rounded-xl text-center border-2 transition-all ${
        status === 'success' ? 'bg-green-600 border-green-400' :
        status === 'error' ? 'bg-red-600 border-red-400' : 'bg-gray-800 border-gray-700'
      }`}>
        <p className="text-2xl font-black uppercase">{status === 'success' ? 'Válido' : status === 'error' ? 'Denegado' : 'Esperando'}</p>
        <p className="mt-2 font-medium">{message}</p>
      </div>

      <style jsx global>{`
        .html5-qrcode-overrides button {
          background-color: #4ade80 !important;
          color: #111827 !important;
          font-weight: 800;
          text-transform: uppercase;
          padding: 16px 24px;
          border-radius: 12px;
          width: 90%;
          margin: 10px auto;
          display: block;
          border: none;
          cursor: pointer;
        }
        .html5-qrcode-overrides select {
          background: #374151; color: white; padding: 10px; border-radius: 8px; width: 90%;
        }
      `}</style>
    </div>
  );
}