// Archivo: src/components/landing/Tickets.tsx

export function Tickets() {
  return (
    <section id="tickets" className="bg-black py-20 px-4 text-white">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-4xl font-bold">Entradas</h2>
        
        {/* Mensaje de Sold Out */}
        <div className="mt-8 rounded-lg border-2 border-red-500 bg-gray-900 py-8 px-4">
          <h3 className="text-5xl font-bold uppercase tracking-wider text-red-500">
            SOLD OUT
          </h3>
          <p className="mt-4 text-lg text-gray-300">
            ¡Gracias por la increíble respuesta!
            <br />
            Nos vemos en la pista.
          </p>
        </div>

      </div>
    </section>
  );
}