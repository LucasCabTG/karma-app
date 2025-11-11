// Archivo: src/app/api/admin/create-courtesy/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity, loteId } = await req.json();

    if (!name || !email || !quantity || !loteId) {
      throw new Error("Faltan datos (nombre, email, cantidad o lote).");
    }

    // 1. La transacción ahora devolverá el ID
    const orderId: string = await db.runTransaction(async (transaction) => {
      const loteRef = db.collection('config').doc('evento_actual').collection('lotes').doc(loteId);
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists) throw new Error("El lote seleccionado no existe.");

      const { vendidas, limite, nombre } = loteDoc.data()!;
      if (vendidas + quantity > limite) {
        throw new Error(`¡Stock Agotado para el ${nombre}!`);
      }

      // Creamos la orden de ticket principal
      const newTicketRef = db.collection("tickets").doc();
      transaction.set(newTicketRef, {
        comprador: name,
        email: email,
        quantity: quantity,
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'paid', // La creamos como 'paid' directamente
        evento: 2,
        lote: Number(loteId),
        precio: 0 // Es de cortesía
      });

      // Actualizamos el contador del lote
      transaction.update(loteRef, { vendidas: FieldValue.increment(quantity) });
      
      // 2. Devolvemos el ID al final de la transacción
      return newTicketRef.id;
    });

    if (!orderId) throw new Error("No se pudo crear la orden.");

    // 3. Lógica para generar QRs y enviar el email
    const attachments = [];
    let qrHtmlSection = '';

    for (let i = 0; i < quantity; i++) {
      const individualTicketRef = await db.collection("individual_tickets").add({
        orderId: orderId, // Ahora 'orderId' está garantizado que existe
        comprador: name,
        email: email,
        asistio: false,
        fechaGeneracion: FieldValue.serverTimestamp(),
        evento: 2
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
          <h3 style="color: #333;">Entrada ${i + 1} de ${quantity} (Cortesía)</h3>
          <img src="cid:${cid}" alt="Código QR" style="max-width: 200px;" />
        </div>`;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h1>¡Hola, ${name}!</h1>
        <p>KARMA te invita al Vol. 2: Verano. Aquí están tus ${quantity} entrada(s) de cortesía:</p>
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
      subject: 'Tus entradas de cortesía para KARMA',
      html: emailHtml,
      attachments: attachments,
    });

    return NextResponse.json({ success: true, message: `Email de cortesía enviado a ${email}` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
    console.error('Error al crear ticket de cortesía:', errorMessage);
    return new NextResponse(errorMessage, { status: 400 });
  }
}