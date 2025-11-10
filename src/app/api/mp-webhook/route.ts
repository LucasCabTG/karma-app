// Archivo: src/app/api/mp-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { TicketEmail } from '@/emails/TicketEmail';

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
          await ticketRef.update({ status: 'paid' });

          const { comprador, email, quantity } = ticketDoc.data()!;
          const qrCodeImages: string[] = [];

          for (let i = 0; i < quantity; i++) {
            const individualTicketRef = await db.collection("individual_tickets").add({
              orderId: ticketId,
              comprador, email, asistio: false,
              fechaGeneracion: FieldValue.serverTimestamp(),
              evento: 2,
            });

            const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
            qrCodeImages.push(qrCodeDataURL);
          }

          // --- CORRECCIÓN AQUÍ ---
          const emailHtml = await render(TicketEmail({ buyerName: comprador, qrCodeImages: qrCodeImages }));

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
          });
        }
      }
    }

    return new NextResponse('Webhook procesado', { status: 200 });

  } catch (error) {
    console.error('Error en el webhook de Mercado Pago:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}