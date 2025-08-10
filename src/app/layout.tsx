// Archivo: src/app/layout.tsx (MODIFICADO)

import type { Metadata } from "next";
// 1. Cambiamos la fuente que importamos a Montserrat
import { Montserrat } from "next/font/google";
import "./globals.css";

// 2. Configuramos Montserrat con los grosores que necesitamos
const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ['300', '400', '700', '800'] // Agregamos '800' para el font-extrabold de la otra página
});

// 3. Actualizamos la metadata para que sea de KARMA
export const metadata: Metadata = {
  title: "KARMA",
  description: "Lo que vibra, vuelve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 4. Cambiamos el idioma a español
    <html lang="es">
      {/* 5. Aplicamos la clase de Montserrat al body. Borramos lo de geist. */}
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}