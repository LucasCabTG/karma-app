require('dotenv').config(); // Carga las variables del .env
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const serviceAccount = require('./serviceAccount.json');

// Inicializamos Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// CONFIGURACIÓN DE CORREO USANDO TU .ENV
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function reenviarTodo() {
  console.log("🚀 Iniciando envío de recordatorio - KARMA Vol. 3...");
  
  // Verificación rápida de variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("❌ Error: Faltan credenciales en el archivo .env");
    return;
  }

  try {
    const snapshot = await db.collection('individual_tickets')
      .where('evento', '==', 2)
      .get();

    if (snapshot.empty) {
      console.log("No hay tickets para enviar.");
      return;
    }

    console.log(`Enviando ${snapshot.size} recordatorios...`);

    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const ticketId = doc.id;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;

      const mailOptions = {
        from: `"KARMA SEASON" <${process.env.GMAIL_USER}>`,
        to: ticket.email,
        subject: '✨ ¡ESTA NOCHE! Tu acceso para KARMA Vol. 3 - Otoño',
        html: `
          <div style="background-color: #0a0a0a; color: #fff; font-family: -apple-system, sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; padding: 20px; border-radius: 16px;">
              <h1 style="color: #f3f4f6; font-size: 28px; letter-spacing: -1px;">¡LLEGÓ EL DÍA, ${ticket.comprador.toUpperCase()}!</h1>
              
              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Te esperamos esta noche a partir de las <b>00:00 hs</b> en <b>Somos Música</b> para vivir una edición inolvidable de <b>KARMA VOL. 3 OTOÑO</b>.
              </p>

              <div style="margin: 30px 0;">
                <p style="color: #4ade80; font-weight: bold; text-transform: uppercase; font-size: 14px;">Tu código de acceso:</p>
                <div style="background-color: #fff; display: inline-block; padding: 15px; border-radius: 12px; margin-top: 10px;">
                  <img src="${qrUrl}" width="220" height="220" alt="QR Access" />
                </div>
                <p style="color: #6b7280; font-size: 11px; margin-top: 10px; font-family: monospace;">ID: ${ticketId}</p>
              </div>

              <p style="color: #9ca3af; font-size: 14px; font-style: italic;">
                Recomendamos tener el QR descargado o captura de pantalla para agilizar el ingreso en puerta.
              </p>

              <div style="margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 20px;">
                <p style="font-weight: bold; letter-spacing: 2px; color: #f3f4f6;">🌀 LO QUE VIBRA, VUELVE</p>
                <p style="font-size: 12px; color: #4b5563;">San Martín 1372, Santa Fe</p>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Recordatorio enviado: ${ticket.email}`);

      // Delay de 1 segundo para evitar bloqueos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✨ ¡PROCESO COMPLETADO! QRs reenviados.");
  } catch (err) {
    console.error("❌ Error en el envío:", err);
  }
}

reenviarTodo();