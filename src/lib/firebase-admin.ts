// Archivo: src/lib/firebase-admin.ts (Versión Corregida)

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    // CAMBIO CLAVE: Leemos la variable correcta
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
      throw new Error('Variable FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error al inicializar Firebase Admin SDK:', error);
  }
}

const db = getFirestore();

export { db };