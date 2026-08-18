import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  return getFirestore();
}

async function check() {
  const db = initFirebase();
  const siteDoc = await db.collection('settings').doc('site').get();
  console.log('site/settings:', siteDoc.data());
  const aboutDoc = await db.collection('about').doc('content').get();
  console.log('about/content:', aboutDoc.data());
}
check();
