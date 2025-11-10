// Archivo: src/app/admin/layout.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminNavbar } from '@/components/layout/AdminNavbar'; // 1. Importar la nueva Navbar

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  }

  // 2. Si el usuario está logueado, mostrar la Navbar y la página
  if (user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AdminNavbar /> 
        <main>
          {children}
        </main>
      </div>
    );
  }

  return null; // O un spinner, mientras redirige
}