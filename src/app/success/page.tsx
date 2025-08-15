// Archivo: src/app/success/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const preferenceId = searchParams.get('preference_id');
  const status = searchParams.get('status');
  
  const [message, setMessage] = useState('Procesando tu compra...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (status === 'approved' && preferenceId) {
      fetch('/api/finalize-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferenceId }),
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(text || 'Error en el servidor') });
        }
        return res.json();
      })
      .then(data => {
        if(data.success) {
          setMessage('¡Compra exitosa! Revisa tu email para ver tus entradas.');
        } else {
          throw new Error(data.message || 'Error al procesar el pago.');
        }
      })
      .catch(err => {
        setIsError(true);
        setMessage(err.message);
      });
    } else {
      setIsError(true);
      setMessage('El pago no fue aprobado o faltan datos en la URL de retorno.');
    }
  }, [preferenceId, status]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-8 text-center">
      <h2 className={`text-3xl font-bold ${isError ? 'text-red-500' : 'text-green-400'}`}>
        {isError ? 'Hubo un Problema' : '¡Gracias por tu compra!'}
      </h2>
      <p className="text-gray-300">{message}</p>
      <Link href="/" className="mt-4 rounded-lg bg-white px-6 py-3 font-bold text-black">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
        <Suspense fallback={<div>Cargando...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}