// Archivo: src/app/api/mp-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = body;

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const payment = new Payment(client);

    const paymentDetails = await payment.get({ id: data.id });

    // --- VERIFICACIÓN AÑADIDA AQUÍ ---
    if (paymentDetails && paymentDetails.payer && paymentDetails.payer.email) {
      // Si tenemos los datos del comprador, creamos el ticket
      await addDoc(collection(db, "tickets"), {
        comprador: paymentDetails.payer.first_name || 'Sin nombre',
        email: paymentDetails.payer.email,
        cantidad: paymentDetails.additional_info?.items?.[0]?.quantity || 1,
        fechaCompra: new Date(),
        asistio: false,
        status: 'paid',
        paymentId: data.id
      });
    } else {
      // Si no tenemos los datos, registramos un log para investigarlo
      console.warn("Webhook recibido pero sin datos completos del comprador:", data.id);
    }

    return new NextResponse('Webhook procesado', { status: 200 });

  } catch (error) {
    console.error('Error en el webhook de Mercado Pago:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}