// Archivo: src/components/layout/AdminNavbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname(); // Hook para saber qué página está activa

  // Lógica para desloguearse
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login'); // Redirigimos al login después de cerrar sesión
  };

  // Links de tu panel de admin
  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/config', label: 'Gestión de Lotes' },
    { href: '/admin/scanner', label: 'Escaner' },
    { href: '/admin/lookup', label: 'Buscador Manual' }, 
  ];

  return (
    <nav className="bg-gray-800 text-white p-4 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">
          KARMA <span className="font-light text-green-400">| Panel Admin</span>
        </div>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.label} 
                href={link.href}
                className={`font-medium ${
                  isActive 
                    ? 'text-white border-b-2 border-green-400' 
                    : 'text-gray-400 hover:text-white'
                } transition-colors`}
              >
                {link.label}
              </Link>
            );
          })}
          <button 
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-md font-bold text-sm hover:bg-red-500 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}