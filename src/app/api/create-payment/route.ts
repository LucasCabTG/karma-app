// Archivo: src/app/api/create-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { calcularPrecioTotal } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity } = await req.json();

    // 1. La transacción ahora devolverá los valores que necesitamos.
    const { ticketId, precioTotal, loteActualNombre } = await db.runTransaction(async (transaction) => {
      const configRef = db.collection('config').doc('evento_actual');
      const configDoc = await transaction.get(configRef);

      if (!configDoc.exists) {
        throw new Error("La configuración del evento no fue encontrada.");
      }

      const loteActivoNum = configDoc.data()!.loteActivo;
      const loteRef = db.collection('config').doc('evento_actual').collection('lotes').doc(String(loteActivoNum));
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists) {
        throw new Error(`Configuración para el Lote ${loteActivoNum} no encontrada.`);
      }

      const { vendidas, limite, precio, nombre, preciosPorCantidad } = loteDoc.data()!;
      
      if (vendidas + quantity > limite) {
        const entradasDisponibles = limite - vendidas;
        throw new Error(`¡Stock Agotado para ${nombre}! Solo quedan ${entradasDisponibles} entradas.`);
      }

      const calculatedTotalPrice = calcularPrecioTotal(quantity, precio, preciosPorCantidad);

      const newTicketRef = db.collection("tickets").doc();
      transaction.set(newTicketRef, {
        comprador: name,
        email: email,
        quantity: quantity,
        precioTotal: calculatedTotalPrice,
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'pending',
        evento: 4,
        lote: loteActivoNum
      });

      transaction.update(loteRef, { vendidas: FieldValue.increment(quantity) });
      
      // 2. Devolvemos un objeto con los datos que necesitamos fuera de la transacción.
      return { 
        ticketId: newTicketRef.id, 
        precioTotal: calculatedTotalPrice, 
        loteActualNombre: nombre 
      };
    });

    // 3. Si llegamos aquí, ticketId, precioTotal y loteActualNombre SÍ existen.
    
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: ticketId,
            title: `x${quantity} Entrada(s) KARMA Vol. 4 (${loteActualNombre})`,
            quantity: 1, // Usamos 1 como cantidad para enviar el precio total exacto
            unit_price: precioTotal, // Usamos el precio dinámico calculado
            currency_id: 'ARS',
          },
        ],
        payer: { name, email },
        back_urls: {
          success: `${process.env.BASE_URL}/success`,
          failure: `${process.env.BASE_URL}/failure`,
          pending: `${process.env.BASE_URL}/pending`
        },
        external_reference: ticketId,
      },
    });

    // 4. Declaramos estas variables como 'const' aquí, donde se les asigna valor.
    const preferenceId = preferenceResponse.id!;
    const init_point = preferenceResponse.init_point!;

    const finalTicketRef = db.collection('tickets').doc(ticketId);
    await finalTicketRef.update({ preference_id: preferenceId });
    
    return NextResponse.json({ url: init_point });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
    console.error('Error al crear la preferencia de pago:', errorMessage);
    return new NextResponse(errorMessage, { status: 400 });
  }
}