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

// CONFIGURACIÓN DE CORREO
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'karmaseason21@gmail.com',
    pass: 'PONER_AQUI_TU_CLAVE_DE_APLICACION' // La de 16 letras de Google
  }
});

async function reenviarTodo() {
  console.log("🚀 Iniciando reenvío masivo de QRs para KARMA Vol. 3...");

  try {
    // Traemos los tickets del Evento 2 (Otoño)
    const snapshot = await db.collection('individual_tickets')
      .where('evento', '==', 2)
      .get();

    if (snapshot.empty) {
      console.log("No hay tickets para enviar.");
      return;
    }

    console.log(`Encontrados ${snapshot.size} tickets. Enviando...`);

    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const ticketId = doc.id;
      
      // Generamos el link del QR dinámicamente con el ID nuevo
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;

      const mailOptions = {
        from: '"KARMA SEASON" <karmaseason21@gmail.com>',
        to: ticket.email,
        subject: '🚨 IMPORTANTE: Nuevo QR para KARMA Vol. 3',
        html: `
          <div style="background-color: #0a0a0a; color: #fff; font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #f3f4f6;">¡Hola, ${ticket.comprador}!</h1>
            <p style="color: #d1d5db; font-size: 16px;">
              Debido a una actualización en nuestro sistema, <b>tu QR anterior ya no es válido.</b>
            </p>
            <p style="color: #4ade80; font-size: 18px; font-weight: bold;">
              PRESENTÁ ESTE NUEVO CÓDIGO EN LA PUERTA:
            </p>
            <div style="background-color: #fff; display: inline-block; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <img src="${qrUrl}" width="200" height="200" alt="QR" />
            </div>
            <p style="color: #9ca3af; font-size: 12px;">ID: ${ticketId}</p>
            <p style="margin-top: 30px;">¡Nos vemos en la pista! 🌀</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Enviado a: ${ticket.email}`);

      // Esperamos 1 segundo entre cada mail para evitar SPAM
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✨ ¡PROCESO TERMINADO! Todos los QRs nuevos fueron enviados.");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

reenviarTodo();