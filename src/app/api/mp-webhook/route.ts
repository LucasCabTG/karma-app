import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Verificar si es un pago
    if (data.type === 'payment') {
      const paymentId = data.data.id;
      const payment = await new Payment(client).get({ id: paymentId.toString() });

      if (payment.status === 'approved') {
        // Guardar en Firestore
        await addDoc(collection(db, "tickets"), {
          comprador: payment.payer.first_name || 'Sin nombre',
          email: payment.payer.email,
          cantidad: payment.additional_info?.items?.[0]?.quantity || 1,
          fechaCompra: new Date(),
          asistio: false,
          mp_payment_id: paymentId
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Error en webhook:", error);
    return new NextResponse('Error en webhook', { status: 500 });
  }
}
