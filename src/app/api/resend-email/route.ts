// Archivo: src/app/api/resend-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Usamos el Admin SDK
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error('Falta el ID de la orden');

    // Sintaxis correcta del Admin SDK: db.collection(...).doc(...)
    const orderRef = db.collection('tickets').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data()!.status !== 'paid') {
      throw new Error('No se encontró una orden pagada con ese ID.');
    }

    const { comprador, email, quantity } = orderDoc.data()!;

    // Sintaxis correcta para queries en el Admin SDK
    const individualTicketsRef = db.collection('individual_tickets');
    const q = individualTicketsRef.where('orderId', '==', orderId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      throw new Error('No se encontraron tickets individuales para esta orden.');
    }

    const attachments = [];
    let qrHtmlSection = '';

    for (const [index, doc] of querySnapshot.docs.entries()) {
      const qrCodeDataURL = await QRCode.toDataURL(doc.id);
      const cid = `qrcode_${doc.id}`;
      
      attachments.push({
        filename: `entrada-${index + 1}.png`,
        path: qrCodeDataURL,
        cid: cid
      });

      qrHtmlSection += `
        <div style="margin-top: 25px; text-align: center;">
          <h3 style="color: #333;">Entrada ${index + 1} de ${quantity}</h3>
          <img src="cid:${cid}" alt="Código QR de la entrada ${index + 1}" style="max-width: 200px;" />
        </div>`;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; text-align: center;">
        <h1>Reenvío de tus entradas para KARMA</h1>
        <p>Hola ${comprador}, aquí están de nuevo tus entradas:</p>
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
      subject: 'Reenvío de tus entradas para KARMA',
      html: emailHtml,
      attachments: attachments,
    });
    
    return NextResponse.json({ success: true, message: `Email reenviado a ${email}` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error al reenviar el email:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}