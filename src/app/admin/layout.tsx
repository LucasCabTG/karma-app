// Archivo: src/app/admin/layout.tsx (Actualizado)
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtenemos el nuevo estado 'isLoading'
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 2. Solo actuamos si NO estamos cargando
    if (!isLoading) {
      // Si no estamos cargando Y no hay usuario, entonces redirigimos
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // 3. Si todavía estamos verificando, mostramos "Cargando..."
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  }

  // 4. Si NO estamos cargando Y hay un usuario, mostramos la página
  if (user) {
    return <>{children}</>;
  }

  // Si no se cumple ninguna de las condiciones anteriores, no se muestra nada (o se redirige).
  return null;
}