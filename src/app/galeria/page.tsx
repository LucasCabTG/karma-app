// Archivo: src/app/galeria/page.tsx

import { Gallery } from "@/components/landing/Gallery";
import { Navbar } from "@/components/layout/Navbar";

export default function GalleryPage() {
  return (
    <main>
      <Navbar />
      {/* Añadimos un padding superior para que el contenido no quede oculto bajo la Navbar fija */}
      <div className="pt-24"> 
        <Gallery />
      </div>
    </main>
  );
}