// Archivo: src/components/layout/Navbar.tsx

'use client';

import { useState } from 'react';
// 1. Importamos la fuente Monoton
import { Monoton } from 'next/font/google';

// 2. Configuramos la fuente
const monoton = Monoton({
  subsets: ['latin'],
  weight: '400'
});

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/#inicio', label: 'Inicio' },
    { href: '/#concepto', label: 'Concepto' },
    { href: '/#tickets', label: 'Tickets' },
    { href: '/galeria', label: 'Galería' },
  ];

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-black/50 px-4 py-4 backdrop-blur-sm md:px-8">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        {/* 3. Aplicamos la clase de la fuente al link del logo */}
        <a href="#inicio" className={`${monoton.className} text-2xl font-bold text-white`}>
          KARMA
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-lg text-gray-300 transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="mt-4 md:hidden">
          <ul className="flex flex-col items-center gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setIsOpen(false)} className="text-lg text-gray-300 transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}