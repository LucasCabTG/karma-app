// Archivo: src/app/api/admin/create-courtesy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Asegurate que esta ruta sea correcta
import { FieldValue } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, quantity, loteId } = await req.json();

    if (!name || !email || !quantity || !loteId) {
      return new NextResponse("Faltan datos obligatorios", { status: 400 });
    }

    // 1. Transacción para crear la orden y actualizar stock
    const orderId = await db.runTransaction(async (transaction) => {
      const loteRef = db.collection('config').doc('evento_actual').collection('lotes').doc(loteId.toString());
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists) throw new Error("El lote seleccionado no existe.");

      const { vendidas, limite, nombre } = loteDoc.data()!;
      if (vendidas + Number(quantity) > limite) {
        throw new Error(`¡Stock Agotado para el ${nombre}!`);
      }

      const newTicketRef = db.collection("tickets").doc();
      transaction.set(newTicketRef, {
        comprador: name,
        email: email,
        quantity: Number(quantity),
        fechaCompra: FieldValue.serverTimestamp(),
        status: 'paid',
        evento: 2,
        lote: Number(loteId),
        precio: 0
      });

      transaction.update(loteRef, { vendidas: FieldValue.increment(Number(quantity)) });
      return newTicketRef.id;
    });

    // 2. Generar tickets individuales y QRs
    const attachments = [];
    let qrHtmlSection = '';

    for (let i = 0; i < quantity; i++) {
      const individualTicketRef = await db.collection("individual_tickets").add({
        orderId: orderId,
        comprador: name,
        email: email,
        asistio: false,
        fechaGeneracion: FieldValue.serverTimestamp(),
        evento: 2
      });
      
      const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
      const cid = `qrcode_${individualTicketRef.id}`;
      
      attachments.push({
        filename: `entrada-${i + 1}.png`,
        content: base64Data,
        encoding: 'base64',
        cid: cid 
      });

      qrHtmlSection += `
        <div style="margin-top: 20px; text-align: center; border: 1px solid #333; padding: 10px; border-radius: 10px;">
          <h3 style="color: #000;">Entrada ${i + 1} de ${quantity}</h3>
          <img src="cid:${cid}" alt="QR" width="200" />
        </div>`;
    }

    // 3. Enviar el Mail
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
      subject: '✨ Tus entradas de cortesía para KARMA Vol. 3',
      html: `
        <div style="font-family: sans-serif; text-align: center; background-color: #f4f4f4; padding: 20px;">
          <h1>¡Hola, ${name}!</h1>
          <p>Te enviamos tus entradas de cortesía para esta noche.</p>
          ${qrHtmlSection}
          <p>Presentá estos QRs en la puerta. ¡Nos vemos!</p>
        </div>`,
      attachments: attachments,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error:', error.message);
    return new NextResponse(error.message, { status: 500 });
  }
}