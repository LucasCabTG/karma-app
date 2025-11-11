// Archivo: src/app/api/mp-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { TicketEmail } from '@/emails/TicketEmail';

export const runtime = 'nodejs';

// 1. Definimos la "forma" de los datos de la orden
interface OrderData {
  comprador: string;
  email: string;
  quantity: number;
  // ...pueden ir más campos si los necesitás
}

// 2. Usamos la interfaz en lugar de 'any'
async function sendTicketEmail(orderData: OrderData, orderId: string) {
  const { comprador, email, quantity } = orderData;
  const attachments = [];
  const qrCodeImages: string[] = [];

  for (let i = 0; i < quantity; i++) {
    const individualTicketRef = await db.collection("individual_tickets").add({
      orderId: orderId,
      comprador, email, asistio: false,
      fechaGeneracion: FieldValue.serverTimestamp(),
      evento: 2
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
    const cid = `qrcode_${individualTicketRef.id}`;
    
    qrCodeImages.push(qrCodeDataURL); 

    attachments.push({
      filename: `entrada-${i + 1}.png`,
      path: qrCodeDataURL,
      cid: cid
    });
  }

  const emailHtml = await render(TicketEmail({ buyerName: comprador, qrCodeImages }));

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"KARMA" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Tus entradas para KARMA',
    html: emailHtml,
    attachments: attachments, 
  });
}

// Esta es la función principal que recibe la llamada de Mercado Pago
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === 'payment.updated') {
      const paymentId = data.id;

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
      const payment = new Payment(client);
      const paymentDetails = await payment.get({ id: paymentId });
      
      if (paymentDetails && paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        
        const ticketId = paymentDetails.external_reference;
        const ticketRef = db.collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (ticketDoc.exists && ticketDoc.data()!.status === 'pending') {
          await ticketRef.update({ status: 'paid', paymentDetails: paymentDetails });

          // 3. Le decimos a TypeScript que los datos coinciden con nuestra interfaz
          await sendTicketEmail(ticketDoc.data()! as OrderData, ticketId);
        }
      }
    }
    
    return new NextResponse('Webhook procesado', { status: 200 });

  } catch (error) { // 4. Corregimos el 'any' del catch
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error en el webhook de Mercado Pago:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}