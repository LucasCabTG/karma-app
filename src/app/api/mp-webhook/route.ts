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

export async function POST(req: NextRequest) {
  try {
    let paymentId: string | null = null;
    let isPaymentEvent = false;

    // Intentamos leer del JSON body (Webhooks V2)
    try {
      const body = await req.json();
      const { action, data } = body;
      
      if (action === 'payment.created' || action === 'payment.updated') {
        isPaymentEvent = true;
        if (data && data.id) {
          paymentId = String(data.id);
        }
      } else if (body.type === 'payment' && body.data && body.data.id) {
        isPaymentEvent = true;
        paymentId = String(body.data.id);
      }
    } catch (e) {
      // Ignoramos si no hay JSON parseable
    }

    // Buscamos en los query params (IPN legacy)
    if (!paymentId) {
      const searchParams = req.nextUrl.searchParams;
      const topic = searchParams.get('topic');
      const id = searchParams.get('id');
      if (topic === 'payment' && id) {
        isPaymentEvent = true;
        paymentId = id;
      }
    }

    // Si no es un evento de pago, respondemos 200 de forma segura
    if (!isPaymentEvent || !paymentId) {
      console.log('[mp-webhook] Webhook ignorado (no es un evento de pago o falta ID)');
      return new NextResponse('Webhook recibido', { status: 200 });
    }

    console.log(`[mp-webhook] Obteniendo detalles de pago para ID: ${paymentId}`);
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const payment = new Payment(client);
    const paymentDetails = await payment.get({ id: paymentId });
    
    if (!paymentDetails || paymentDetails.status !== 'approved' || !paymentDetails.external_reference) {
      console.log(`[mp-webhook] Pago ID ${paymentId} no procesable. Status: ${paymentDetails?.status}`);
      return new NextResponse('Pago no aprobado o sin referencia externa', { status: 200 });
    }

    const ticketId = paymentDetails.external_reference;
    const ticketRef = db.collection('tickets').doc(ticketId);

    // Ejecutamos una transacción de Firestore para asegurar consistencia atómica
    const result = await db.runTransaction(async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);
      if (!ticketDoc.exists) {
        throw new Error(`El ticket principal con ID ${ticketId} no existe.`);
      }

      const ticketData = ticketDoc.data()!;
      if (ticketData.status === 'paid') {
        return { alreadyProcessed: true };
      }

      // Marcamos como pagado
      transaction.update(ticketRef, { status: 'paid', paymentDetails: paymentDetails });

      const { comprador, email, quantity, lote } = ticketData;
      const multiplier = (lote === 6) ? 2 : 1;
      const totalTickets = quantity * multiplier;

      const generatedTickets = [];
      for (let i = 0; i < totalTickets; i++) {
        const indTicketRef = db.collection("individual_tickets").doc();
        transaction.set(indTicketRef, {
          orderId: ticketId,
          comprador, 
          email, 
          asistio: false,
          fechaGeneracion: FieldValue.serverTimestamp(),
          evento: 4
        });

        generatedTickets.push({
          id: indTicketRef.id,
          index: i
        });
      }

      return {
        alreadyProcessed: false,
        comprador,
        email,
        totalTickets,
        generatedTickets
      };
    });

    if (result.alreadyProcessed || !result.generatedTickets) {
      console.log(`[mp-webhook] El pago del ticket ${ticketId} ya estaba marcado como paid.`);
      return new NextResponse('Webhook procesado (ya pagado)', { status: 200 });
    }

    const { comprador, email, totalTickets, generatedTickets } = result;

    const configDoc = await db.collection('config').doc('evento_actual').get();
    const customText = configDoc.exists ? configDoc.data()?.emailText : undefined;

    const attachments = [];
    const qrCodeImages: string[] = [];

    for (const t of generatedTickets) {
      const qrCodeDataURL = await QRCode.toDataURL(t.id);
      const cid = `qrcode_${t.id}`;
      
      qrCodeImages.push(qrCodeDataURL); 

      const base64Data = qrCodeDataURL.split(';base64,').pop()!;
      attachments.push({
        filename: `entrada-${t.index + 1}.png`,
        content: Buffer.from(base64Data, 'base64'),
        cid: cid
      });
    }

    console.log(`[mp-webhook] Renderizando email para ${email}...`);
    const emailHtml = await render(TicketEmail({ buyerName: comprador, qrCodeImages, customText }));

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log(`[mp-webhook] Enviando email de confirmación a ${email} con ${totalTickets} entradas.`);
    await transporter.sendMail({
      from: `"KARMA" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Tus entradas para KARMA',
      html: emailHtml,
      attachments: attachments, 
    });
    
    return new NextResponse('Webhook procesado con éxito', { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error en el webhook de Mercado Pago:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}