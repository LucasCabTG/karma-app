const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json'); // El archivo que bajaste recién

// Inicializamos la conexión con tu "llave maestra"
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function recuperarTickets() {
  console.log("⏳ Iniciando recuperación de tickets individuales...");

  try {
    // 1. Buscamos las órdenes pagadas del Evento 4
    const ordersSnapshot = await db.collection('tickets')
      .where('evento', '==', 4)
      .where('status', '==', 'paid')
      .get();

    if (ordersSnapshot.empty) {
      console.log("❌ No se encontraron órdenes pagadas.");
      return;
    }

    let contador = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      const data = orderDoc.data();
      const orderId = orderDoc.id;

      // 2. Lógica de 2x1 (Lote 6) o normal
      const multiplier = (data.lote === 6) ? 2 : 1;
      const totalTicketsAGenerar = data.quantity * multiplier;

      console.log(`Fabricando ${totalTicketsAGenerar} tickets para: ${data.comprador}`);

      for (let i = 0; i < totalTicketsAGenerar; i++) {
        await db.collection('individual_tickets').add({
          orderId: orderId,
          comprador: data.comprador,
          email: data.email,
          asistio: false,
          fechaGeneracion: data.fechaCompra || new Date(),
          evento: 4
        });
        contador++;
      }
    }

    console.log(`✅ ¡Éxito! Se regeneraron ${contador} tickets individuales.`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

recuperarTickets();