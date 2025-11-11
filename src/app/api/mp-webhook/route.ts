// Archivo: src/app/api/mp-webhook/route.ts (Versión Corregida)

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

// Esta función manejará el envío de emails
async function sendTicketEmail(orderData: any, orderId: string) {
  const { comprador, email, quantity } = orderData;
  const attachments = [];
  let qrHtmlSection = '';

  for (let i = 0; i < quantity; i++) {
    const individualTicketRef = await db.collection("individual_tickets").add({
      orderId: orderId,
      comprador, email, asistio: false,
      fechaGeneracion: FieldValue.serverTimestamp(),
      evento: 2 // Aseguramos que sea del Evento 2
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
    const cid = `qrcode_${individualTicketRef.id}`;
    
    attachments.push({
      filename: `entrada-${i + 1}.png`,
      path: qrCodeDataURL,
      cid: cid 
    });

    qrHtmlSection += `
      <div style="margin-top: 25px; text-align: center;">
        <h3 style="color: #333;">Entrada ${i + 1} de ${quantity}</h3>
        <img src="cid:${cid}" alt="Código QR de la entrada ${i + 1}" style="max-width: 200px;" />
      </div>`;
  }

  const emailHtml = `
    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
      <h1>¡Gracias por tu compra, ${comprador}!</h1>
      <p>Aquí están tus ${quantity} entrada(s) para KARMA. Presentá estos códigos en la puerta:</p>
      ${qrHtmlSection}
      <p>¡Nos vemos en la pista!</p>
    </div>`;

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

        console.log("📩 Webhook recibido de Mercado Pago:", JSON.stringify(body, null, 2));

    const { action, data } = body;

    // Solo actuamos si es una actualización de pago
    if (action === 'payment.updated') {
      const paymentId = data.id;

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
      const payment = new Payment(client);
      const paymentDetails = await payment.get({ id: paymentId });
      
      // Verificamos que el pago esté aprobado y tenga nuestra referencia
      if (paymentDetails && paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        
        const ticketId = paymentDetails.external_reference;
        
        // Usamos la sintaxis correcta del Admin SDK
        const ticketRef = db.collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        // Verificamos que el ticket exista y esté 'pendiente' (para no enviar emails duplicados)
        if (ticketDoc.exists && ticketDoc.data()!.status === 'pending') {
          
          // 1. Marcamos la orden como pagada
          await ticketRef.update({ status: 'paid', paymentDetails: paymentDetails });

          // 2. Llamamos a nuestra función para enviar el email
          await sendTicketEmail(ticketDoc.data()!, ticketId);
        }
      }
    }
    
    return new NextResponse('Webhook procesado', { status: 200 });

  } catch (error) { // <-- CORRECCIÓN AQUÍ
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error en el webhook de Mercado Pago:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}