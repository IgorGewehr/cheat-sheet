import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let _app: App | null = null;

function app(): App {
  if (_app) return _app;
  if (getApps().length > 0) return (_app = getApps()[0]!);
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não configurado. Gere em Firebase Console → Project Settings → Service Accounts → Generate new private key.");
  _app = initializeApp({ credential: cert(JSON.parse(json)) });
  return _app;
}

export function adminDb() {
  app();
  return getFirestore();
}

export function adminAuth() {
  app();
  return getAuth();
}
