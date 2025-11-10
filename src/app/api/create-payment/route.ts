// Archivo: src/app/api/create-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity } = await req.json();

    // 1. La transacción ahora devolverá los valores que necesitamos.
    const { ticketId, precioLote, loteActualNombre } = await db.runTransaction(async (transaction) => {
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

      const { vendidas, limite, precio, nombre } = loteDoc.data()!;
      
      if (vendidas + quantity > limite) {
        const entradasDisponibles = limite - vendidas;
        throw new Error(`¡Stock Agotado para ${nombre}! Solo quedan ${entradasDisponibles} entradas.`);
      }

      const newTicketRef = db.collection("tickets").doc();
      transaction.set(newTicketRef, {
        comprador: name,
        email: email,
        quantity: quantity,
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'pending',
        evento: 2,
        lote: loteActivoNum
      });

      transaction.update(loteRef, { vendidas: FieldValue.increment(quantity) });
      
      // 2. Devolvemos un objeto con los datos que necesitamos fuera de la transacción.
      return { 
        ticketId: newTicketRef.id, 
        precioLote: precio, 
        loteActualNombre: nombre 
      };
    });

    // 3. Si llegamos aquí, ticketId, precioLote y loteActualNombre SÍ existen.
    
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: ticketId,
            title: `x${quantity} Entrada(s) KARMA Vol. 2 (${loteActualNombre})`,
            quantity: quantity,
            unit_price: precioLote, // Usamos el precio dinámico del lote
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