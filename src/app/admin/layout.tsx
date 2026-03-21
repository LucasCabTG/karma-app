// Archivo: src/app/admin/scanner/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ScannerPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [message, setMessage] = useState('Listo para escanear');
  
  // EL CANDADO: useRef cambia al instante, bloqueando frames duplicados
  const isProcessing = useRef(false);

  useEffect(() => {
    // 1. Configuramos el escáner (mantenemos 10 FPS y tamaño de caja)
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      },
      false
    );

    // 2. Definimos la lógica de éxito (la que ya funciona perfecto con useRef)
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

      // 3. Esperamos 3 segundos antes de abrir el candado de nuevo
      setTimeout(() => {
        isProcessing.current = false;
        setStatus('idle');
        setMessage('Listo para el siguiente');
      }, 3000);
    }

    // 4. Renderizamos el escáner
    scanner.render(onScanSuccess, (err) => {});

    // 5. Limpiamos al desmontar
    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-[90vh] text-white">
      <h1 className="text-xl font-bold mb-4">Escáner Karma</h1>
      
      {/* 6. CONTENEDOR DEL LECTOR: Aquí aplicamos el CSS global 
        para estilizar el botón de 'Start Scanning' 
      */}
      <div id="reader" className="w-full max-w-sm border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-950 p-2 text-center text-sm html5-qrcode-overrides">
        {/* Aquí la librería inserta su HTML automáticamente */}
      </div>

      <div className={`mt-6 w-full max-w-sm p-8 rounded-xl text-center border-2 transition-all ${
        status === 'success' ? 'bg-green-600 border-green-400' :
        status === 'error' ? 'bg-red-600 border-red-400' :
        'bg-gray-800 border-gray-700'
      }`}>
        <p className="text-2xl font-black uppercase tracking-tighter">
          {status === 'success' ? 'Válido' : status === 'error' ? 'Denegado' : 'Esperando'}
        </p>
        <p className="mt-2 font-medium">{message}</p>
        
        {/* Barra de progreso visual para saber cuándo se desbloquea */}
        {status !== 'idle' && status !== 'processing' && (
          <div className="mt-4 h-1 w-full bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-[progress_3s_linear]"></div>
          </div>
        )}
      </div>

      {/* 7. ESTILOS GLOBALES: Aquí definimos cómo se verá el botón
        para que parezca una app nativa en móvil.
      */}
      <style jsx global>{`
        /* Sobreescrituras de CSS para html5-qrcode en móvil */
        .html5-qrcode-overrides {
          color: white;
          font-family: sans-serif;
        }
        
        /* Botón de Start/Stop Scanning: Gigante y Verde */
        .html5-qrcode-overrides button {
          background-color: #4ade80; /* text-green-400 */
          color: #111827; /* gray-900 */
          font-weight: 800;
          font-size: 16px; /* text-base */
          text-transform: uppercase;
          border: none;
          padding: 16px 24px; /* p-4 p-6 */
          border-radius: 12px; /* rounded-xl */
          cursor: pointer;
          transition: background-color 0.2s;
          margin: 10px auto; /* Centrado y espaciado */
          display: block;
          width: 90%; /* Ancho completo en móvil */
          -webkit-appearance: none; /* Evita estilos nativos de iOS */
        }
        
        .html5-qrcode-overrides button:hover {
          background-color: #22c55e; /* green-500 */
        }
        
        .html5-qrcode-overrides button:active {
          transform: scale(0.98); /* Feedback visual al tocar */
        }

        /* Estilos para el texto de instrucciones y cámara */
        .html5-qrcode-overrides select {
          background-color: #374151; /* gray-700 */
          color: white;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #4b5563;
          margin-bottom: 10px;
          width: 90%;
        }
        
        #html5-qrcode-anchor-scan-type-change {
          color: #a1a1aa; /* gray-400 */
          font-size: 12px;
          text-decoration: underline;
          margin-top: 5px;
          display: inline-block;
        }
      `}</style>

      {/* Barra de progreso visual que ya funcionaba */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}