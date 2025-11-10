// Archivo: src/components/landing/Tickets.tsx

import { TicketForm } from "@/components/ticketing/TicketForm";

export function Tickets() {
  return (
    <section id="tickets" className="bg-black py-20 px-4 text-white">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-4xl font-bold">Entradas Vol. 2: Verano</h2>
        <p className="mt-4 text-lg text-gray-400">
          Asegurá tu lugar para la próxima edición. La capacidad es limitada.
        </p>
        
        {/* Reactivamos el formulario de compra */}
        <TicketForm />
        
      </div>
    </section>
  );
}