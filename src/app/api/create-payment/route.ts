// Archivo: src/app/api/create-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const TICKET_PRICE = 12000;

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity } = await req.json();

    // 1. La transacción ahora devolverá el ID del ticket.
    const ticketId = await db.runTransaction(async (transaction) => {
      const configRef = db.collection('config').doc('evento_actual');
      const configDoc = await transaction.get(configRef);

      if (!configDoc.exists) {
        throw new Error("La configuración del evento no fue encontrada.");
      }

      const { entradasVendidas, limiteEntradas } = configDoc.data()!;

      if (entradasVendidas + quantity > limiteEntradas) {
        const entradasDisponibles = limiteEntradas - entradasVendidas;
        throw new Error(`¡Sold Out! Solo quedan ${entradasDisponibles} entradas.`);
      }

      const newTicketRef = db.collection("tickets").doc();
      transaction.set(newTicketRef, {
        comprador: name,
        email: email,
        quantity: quantity,
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'pending'
      });

      transaction.update(configRef, { entradasVendidas: FieldValue.increment(quantity) });
      
      // 2. Devolvemos el ID al final de la transacción exitosa.
      return newTicketRef.id;
    });

    if (!ticketId) {
      throw new Error("La creación del ticket falló después de la transacción.");
    }
    
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: ticketId,
            title: `x${quantity} Entrada(s) KARMA Vol. 1`,
            quantity: quantity,
            unit_price: TICKET_PRICE,
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

    const preferenceId = preferenceResponse.id!;
    const init_point = preferenceResponse.init_point!;

    const finalTicketRef = db.collection('tickets').doc(ticketId);
    await finalTicketRef.update({
      preference_id: preferenceId
    });
    
    return NextResponse.json({ url: init_point });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error al crear la preferencia de pago:', errorMessage);
    return new NextResponse(errorMessage, { status: 400 });
  }
}