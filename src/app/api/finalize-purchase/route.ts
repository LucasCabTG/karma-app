// Archivo: src/app/api/finalize-purchase/route.ts (Versión Final y Correcta)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { preferenceId } = await req.json();
    if (!preferenceId) throw new Error('Falta el ID de la preferencia');

    // Usamos la sintaxis del Admin SDK para buscar la orden
    const ticketsRef = db.collection('tickets');
    const q = ticketsRef.where('preference_id', '==', preferenceId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      throw new Error('No se encontró la orden de compra.');
    }
    
    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // Verificamos si ya fue procesado para no enviar emails duplicados
    if (orderData.status === 'paid') {
      return NextResponse.json({ success: true, message: 'El pago ya fue procesado.' });
    }
    
    // Actualizamos la orden a "pagado"
    await orderDoc.ref.update({ status: 'paid' });
    
    const { comprador, email, quantity } = orderData;
    
    // --- LÓGICA CORRECTA PARA ADJUNTAR IMÁGENES ---
    const attachments = [];
    let qrHtmlSection = '';

    for (let i = 0; i < quantity; i++) {
      // Creamos el ticket individual en la base de datos
      const individualTicketRef = await db.collection("individual_tickets").add({
        orderId: orderDoc.id,
        comprador, email, asistio: false, 
        fechaGeneracion: FieldValue.serverTimestamp(),
      });
      
      // Generamos la imagen del QR
      const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
      // Creamos un ID de contenido único para adjuntar
      const cid = `qrcode_${individualTicketRef.id}`;
      
      // Agregamos el QR como un adjunto para el email
      attachments.push({
        filename: `entrada-${i + 1}.png`,
        path: qrCodeDataURL,
        cid: cid 
      });

      // Creamos el HTML que mostrará la imagen adjunta usando su 'cid'
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

    // Configuramos Nodemailer para enviar el correo
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
      attachments: attachments, // Adjuntamos los QR
    });
    
    return NextResponse.json({ success: true, message: 'Email enviado' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    console.error('Error al finalizar la compra:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}