// Archivo: src/app/layout.tsx

import type { Metadata } from "next";
import { Montserrat } from "next/font/google"; // Asumo que seguimos con Montserrat
import "./globals.css";
import { Footer } from "@/components/layout/Footer"; // 1. Importar el Footer


const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KARMA | Ciclo de Música Electrónica en Rosario",
  description: "KARMA es un ciclo de música electrónica que sigue el ciclo de la naturaleza. Un evento por cada estación del año. Conseguí tus entradas para la próxima edición.",
  keywords: ["fiesta electrónica rosario", "música electrónica", "progressive house", "techno", "entradas", "evento", "Karma"],
  openGraph: {
    title: "KARMA | Lo que vibra, vuelve.",
    description: "Un ciclo de música que celebra la conexión entre los sentidos y el arte en cada estación del año.",
    url: "https://KarmaSeason.com", 
    siteName: "KARMA Season",

    locale: 'es_AR',
    type: 'website',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      {/* Añadimos el fondo negro aquí */}
      <body className={`${montserrat.className} bg-black text-white`}>
        {children}
        <Footer /> {/* 2. Agregar el Footer aquí */}

      </body>
    </html>
  );
}