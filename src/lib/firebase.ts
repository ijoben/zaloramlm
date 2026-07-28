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

    console.log("🔥 [Firebase Client] Successfully initialized Firebase!", {
      projectId: resolvedFirebaseConfig.projectId,
      customDbId: isCustomDb ? dbId : "(default)",
      dbConnected: !!db
    });
  } else {
    console.warn("⚠️ [Firebase Client] Firebase API Key is missing! `db` instance is NULL. On Vercel, ensure environment variables (VITE_FIREBASE_API_KEY) or firebase-applet-config.json are committed.");
  }
} catch (e) {
  console.error("⚠️ [Firebase Client] Error initializing Firebase in firebase.ts:", e);
}

export { app, auth, db };


