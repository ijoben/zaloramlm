import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { resolvedFirebaseConfig } from './firebaseConfig';

let app: any = null;
let auth: any = null;
let db: any = null;

try {
  if (resolvedFirebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);
    auth = getAuth(app);
    const dbId = resolvedFirebaseConfig.firestoreDatabaseId;
    const isCustomDb = dbId && dbId.trim() !== '' && dbId !== "(default)" && dbId !== "default";

    db = isCustomDb
      ? getFirestore(app, dbId)
      : getFirestore(app);
  } else {
    console.warn("⚠️ Firebase API key missing from configuration");
  }
} catch (e) {
  console.error("⚠️ Error initializing Firebase in firebase.ts:", e);
}

export { app, auth, db };

