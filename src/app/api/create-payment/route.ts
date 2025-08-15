// Archivo: src/app/api/create-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase-admin'; // Asegurate que importe desde firebase-admin
import { FieldValue } from 'firebase-admin/firestore'; // Importamos FieldValue para el incremento

const TICKET_PRICE = 12000;

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity } = await req.json();

    let ticketId: string;
    let preferenceId: string;
    let init_point: string;

    // Iniciamos una transacción segura de Firestore
    await db.runTransaction(async (transaction) => {
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

      // Creamos el ticket PENDIENTE dentro de la transacción
      const ticketRef = db.collection("tickets").doc(); // Creamos una referencia a un nuevo documento
      transaction.set(ticketRef, {
        comprador: name,
        email: email,
        quantity: quantity,
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'pending'
      });
      ticketId = ticketRef.id;

      // Actualizamos el contador de forma segura
      transaction.update(configRef, { entradasVendidas: FieldValue.increment(quantity) });
    });

    // Si la transacción fue exitosa, procedemos a crear el pago en Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: ticketId!,
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
        external_reference: ticketId!,
      },
    });

    preferenceId = preferenceResponse.id!;
    init_point = preferenceResponse.init_point!;

    // Actualizamos el ticket con el ID de la preferencia de MP
    const finalTicketRef = db.collection('tickets').doc(ticketId!);
    await finalTicketRef.update({
      preference_id: preferenceId
    });
    
    return NextResponse.json({ url: init_point });

  } catch (error: any) {
    console.error('Error al crear la preferencia de pago:', error.message);
    return new NextResponse(error.message, { status: 400 });
  }
}