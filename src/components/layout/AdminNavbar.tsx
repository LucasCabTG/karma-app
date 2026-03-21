// Archivo: src/components/layout/AdminNavbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/config', label: 'Lotes' }, // Acortamos etiquetas para ganar espacio
    { href: '/admin/scanner', label: 'Escaner' },
    { href: '/admin/courtesy', label: 'Cortesías' },
    { href: '/admin/lookup', label: 'Buscador' }, 
  ];

  return (
    <nav className="bg-gray-800 text-white p-3 md:p-4 sticky top-0 z-40 shadow-md w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* LOGO / TÍTULO */}
        <div className="font-bold text-lg md:text-xl flex items-center gap-2">
          KARMA <span className="font-light text-green-400 text-sm md:text-base border-l border-gray-600 pl-2">Panel Admin</span>
        </div>

        {/* CONTENEDOR DE LINKS Y BOTÓN */}
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 w-full md:w-auto">
          
          {/* LINKS: En móvil se ven más chicos y se acomodan solos */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className={`text-xs md:text-sm font-medium transition-all ${
                    isActive 
                      ? 'text-green-400 border-b-2 border-green-400 pb-1' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* BOTÓN CERRAR SESIÓN: Más compacto en móvil */}
          <button 
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1.5 md:px-4 md:py-2 rounded-md font-bold text-[10px] md:text-sm hover:bg-red-500 transition-colors uppercase md:normal-case"
          >
            Salir
          </button>
        </div>

      </div>
    </nav>
  );
}