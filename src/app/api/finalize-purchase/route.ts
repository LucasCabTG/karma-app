// Archivo: src/app/api/finalize-purchase/route.ts (Versión final con adjuntos)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { preferenceId } = await req.json();
    if (!preferenceId) throw new Error('Falta el ID de la preferencia');

    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('preference_id', '==', preferenceId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error('No se encontró la orden de compra.');
    
    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    if (orderData.status === 'paid') return NextResponse.json({ success: true, message: 'El pago ya fue procesado.' });
    
    await updateDoc(doc(db, 'tickets', orderDoc.id), { status: 'paid' });
    
    const { comprador, email, quantity } = orderData;
    const attachments = []; // 1. Array para guardar nuestros adjuntos
    let emailHtml = `
      <div>
        <h1>¡Gracias por tu compra, ${comprador}!</h1>
        <p>Aquí están tus ${quantity} entrada(s) para KARMA. Presentá estos códigos en la puerta:</p>`;

    for (let i = 0; i < quantity; i++) {
      const individualTicketRef = await addDoc(collection(db, "individual_tickets"), {
        orderId: orderDoc.id,
        comprador, email, asistio: false, fechaGeneracion: serverTimestamp(),
      });
      
      const qrCodeDataURL = await QRCode.toDataURL(individualTicketRef.id);
      const cid = `qrcode${i}`; // Creamos un ID de contenido único para cada QR

      // 2. Agregamos cada QR como un adjunto
      attachments.push({
        filename: `entrada-${i + 1}.png`,
        path: qrCodeDataURL,
        cid: cid 
      });

      // 3. Modificamos el HTML para que use el 'cid' del adjunto
      emailHtml += `
        <div style="margin-top: 20px; text-align: center;">
          <h3>Entrada ${i + 1}</h3>
          <img src="cid:${cid}" alt="Código QR de la entrada ${i + 1}" />
        </div>`;
    }

    emailHtml += `<p>¡Nos vemos en la pista!</p></div>`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"KARMA" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Tus entradas para KARMA',
      html: emailHtml,
      attachments: attachments, // 4. Pasamos el array de adjuntos a Nodemailer
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: 'Email enviado' });

  } catch (error: any) {
    console.error('Error al finalizar la compra:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}