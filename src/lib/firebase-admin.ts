// Archivo: src/lib/firebase-admin.ts (Versión Corregida)

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    // Soporte para cargar la clave codificada en Base64 como fallback
    if (!serviceAccountJson && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    }

    if (!serviceAccountJson) {
      throw new Error('Ni FIREBASE_SERVICE_ACCOUNT_KEY ni FIREBASE_SERVICE_ACCOUNT_BASE64 están definidas.');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error al inicializar Firebase Admin SDK:', error);
  }
}

let db: admin.firestore.Firestore;
try {
  db = getFirestore();
} catch (error) {
  console.warn('Advertencia: No se pudo obtener la base de datos de Firestore. Usando mock durante la compilación.');
  db = {} as admin.firestore.Firestore;
}

export { db };