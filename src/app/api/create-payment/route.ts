import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'; // Importamos doc y updateDoc

const TICKET_PRICE = 12000;

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity } = await req.json();

    const ticketRef = await addDoc(collection(db, "tickets"), {
      comprador: name,
      email: email,
      quantity: quantity, // <-- Guardamos la cantidad
      fechaCompra: new Date(),
      asistio: false,
      status: 'pending'
    });


    const ticketId = ticketRef.id;

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const preference = new Preference(client);
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: ticketId, // 3. USAMOS nuestro ID de ticket aquí
            title: `x${quantity} Entrada(s) KARMA Vol. 1`,
            quantity: quantity,
            unit_price: TICKET_PRICE,
            currency_id: 'ARS',
          },
        ],
        payer: { name, email },
        // CAMBIO AQUÍ: Escribimos la URL directamente para la prueba
        back_urls: {
            success: `${BASE_URL}/success`,
            failure: `${BASE_URL}/failure`,
            pending: `${BASE_URL}/pending`
        },
        external_reference: ticketId,
      },
    });

    const preferenceId = preferenceResponse.id;
    await updateDoc(ticketRef, {
      preference_id: preferenceId
    });
    return NextResponse.json({ url: preferenceResponse.init_point });

  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    return new NextResponse('Error al crear la preferencia de pago', { status: 500 });
  }
}