import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function GET() {
  // 1. Configuración de transporte (usando las variables que YA están en Vercel)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const ticketsRef = collection(db, 'individual_tickets');
    const q = query(ticketsRef, where('evento', '==', 4));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ message: "No se encontraron tickets." });
    }

    const results = [];

    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const ticketId = doc.id;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;

      const mailOptions = {
        from: '"KARMA SEASON" <karmaseason21@gmail.com>',
        to: ticket.email,
        subject: '✨ ¡ESTA NOCHE! Tu acceso para KARMA Vol. 4 - Dia del amigo',
        html: `
          <div style="background-color: #0a0a0a; color: #fff; font-family: sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; padding: 20px; border-radius: 16px;">
              <h1 style="color: #f3f4f6; font-size: 28px;">¡LLEGÓ EL DÍA, ${ticket.comprador.toUpperCase()}!</h1>
              <p>Te esperamos esta noche <b>00:00 hs</b> en <b>Somos Música</b>.</p>
              <div style="background-color: #fff; display: inline-block; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <img src="${qrUrl}" width="220" height="220" alt="QR" />
              </div>
              <p style="color: #9ca3af; font-size: 12px;">ID: ${ticketId}</p>
              <p>🌀 LO QUE VIBRA, VUELVE</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      results.push(`Enviado a ${ticket.email}`);
      
      // Delay mínimo para evitar bloqueos
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ 
      success: true, 
      count: snapshot.size, 
      details: results 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}