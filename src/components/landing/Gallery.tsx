// Archivo: src/components/landing/Gallery.tsx

export function Gallery() {
  return (
    <section id="galeria" className="bg-black py-20 px-4 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold">Galería</h2>
        <div className="mt-8 flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-700">
          <p className="text-xl text-gray-500">
            Próximamente...
          </p>
        </div>
      </div>
    </section>
  );
}