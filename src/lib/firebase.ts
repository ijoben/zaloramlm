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
    db = resolvedFirebaseConfig.firestoreDatabaseId
      ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } else {
    console.warn("⚠️ Firebase API key missing from configuration");
  }
} catch (e) {
  console.error("⚠️ Error initializing Firebase in firebase.ts:", e);
}

export { app, auth, db };

