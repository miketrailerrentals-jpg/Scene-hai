import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  Firestore
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "gen-lang-client-0648193037",
  appId: "1:959957774322:web:ba0e980203c09393d2456b",
  apiKey: "AIzaSyB1y-_UGHmP2dTZlCTh3gNsM3RTjWL27XU",
  authDomain: "gen-lang-client-0648193037.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-scenehai-4494a13b-a264-4565-aaaa-f1f82a750460",
  storageBucket: "gen-lang-client-0648193037.firebasestorage.app",
  messagingSenderId: "959957774322"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.warn('[Firebase] Initialization error:', err);
}

export { app, auth, googleProvider, db };

export function handleFirestoreError(error: any, operation: string) {
  const errorInfo = {
    operation,
    code: error?.code || 'unknown',
    message: error?.message || 'Unknown Firestore error',
    details: error
  };
  console.error('[Firestore Error]', errorInfo);
  return errorInfo;
}
