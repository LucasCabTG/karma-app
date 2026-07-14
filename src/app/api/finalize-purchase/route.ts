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
    const orderRef = orderDoc.ref;

    // Ejecutamos una transacción de Firestore para asegurar consistencia atómica.
    const result = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(orderRef);
      if (!docSnap.exists) {
        throw new Error('La orden no existe.');
      }
      
      const orderData = docSnap.data()!;
      if (orderData.status === 'paid') {
        return { alreadyProcessed: true };
      }
      
      // Actualizamos la orden a "paid"
      transaction.update(orderRef, { status: 'paid' });
      
      const { comprador, email, quantity, lote } = orderData;
      const multiplier = (lote === 6) ? 2 : 1; 
      const totalTickets = quantity * multiplier;   
      
      const generatedTickets = [];
      for (let i = 0; i < totalTickets; i++) {
        const indTicketRef = db.collection("individual_tickets").doc();
        transaction.set(indTicketRef, {
          orderId: orderDoc.id,
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
      console.log(`[finalize-purchase] El pago de preferencia ${preferenceId} ya fue procesado previamente.`);
      return NextResponse.json({ success: true, message: 'El pago ya fue procesado.' });
    }

    const { comprador, email, totalTickets, generatedTickets } = result;
     
    // Obtenemos la configuración para el texto del email
    const configDocRef = await db.collection('config').doc('evento_actual').get();
    const emailText = configDocRef.exists ? configDocRef.data()?.emailText : `Aquí están tus ${totalTickets} entrada(s) para KARMA. Presentá estos códigos en la puerta:`;

    // --- LÓGICA CORRECTA PARA ADJUNTAR IMÁGENES ---
    const attachments = [];
    let qrHtmlSection = '';

    for (const t of generatedTickets) {
      // Generamos la imagen del QR
      const qrCodeDataURL = await QRCode.toDataURL(t.id);
      // Creamos un ID de contenido único para adjuntar
      const cid = `qrcode_${t.id}`;
      
      // Extraemos la cadena base64 limpia y la pasamos como Buffer en content
      const base64Data = qrCodeDataURL.split(';base64,').pop()!;
      attachments.push({
        filename: `entrada-${t.index + 1}.png`,
        content: Buffer.from(base64Data, 'base64'),
        cid: cid 
      });

      // Creamos el HTML que mostrará la imagen adjunta usando su 'cid'
      qrHtmlSection += `
        <div style="margin-top: 25px; text-align: center;">
          <h3 style="color: #333;">Entrada ${t.index + 1} de ${totalTickets}</h3>
          <img src="cid:${cid}" alt="Código QR de la entrada ${t.index + 1}" style="max-width: 200px;" />
        </div>`;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h1>¡Gracias por tu compra, ${comprador}!</h1>
        <p>${emailText}</p>
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

    console.log(`[finalize-purchase] Enviando email de confirmación a ${email} con ${totalTickets} entradas.`);
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