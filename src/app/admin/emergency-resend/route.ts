// Archivo: src/app/api/admin/emergency-resend/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Usamos el admin para bypass de reglas
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function GET() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    // 1. Buscamos los tickets del Evento 2 (Karma Vol. 3)
    const snapshot = await db.collection('individual_tickets')
      .where('evento', '==', 2)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No hay tickets para reenviar." });
    }

    console.log(`Iniciando reenvío de ${snapshot.size} tickets...`);

    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const ticketId = doc.id;
      
      // Generamos el QR link
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;

      const mailOptions = {
        from: '"KARMA SEASON" <karmaseason21@gmail.com>',
        to: ticket.email,
        subject: '✨ ¡ESTA NOCHE! Tu acceso para KARMA Vol. 3 - Otoño',
        html: `
          <div style="background-color: #0a0a0a; color: #fff; font-family: sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; padding: 20px; border-radius: 16px;">
              <h1 style="color: #f3f4f6; font-size: 28px;">¡LLEGÓ EL DÍA, ${ticket.comprador.toUpperCase()}!</h1>
              <p style="color: #d1d5db; font-size: 16px;">Te esperamos esta noche a partir de las <b>00:00 hs</b> en <b>Somos Música</b>.</p>
              <div style="background-color: #fff; display: inline-block; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <img src="${qrUrl}" width="220" height="220" alt="QR Access" />
              </div>
              <p style="color: #4ade80; font-weight: bold;">Presentá este código en puerta</p>
              <p style="color: #6b7280; font-size: 10px;">ID: ${ticketId}</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      // Delay de 300ms para no saturar
      await new Promise(r => setTimeout(r, 300));
    }

    return NextResponse.json({ success: true, total: snapshot.size });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}