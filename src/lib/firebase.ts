"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

if (typeof window !== "undefined") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.error(
      `[firebase] variáveis NEXT_PUBLIC_FIREBASE_* faltando: ${missing.join(", ")}. ` +
        `Veja .env.example.`,
    );
  }
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  }
  return { app, auth: authInstance!, db: dbInstance! };
}

let authReadyPromise: Promise<void> | null = null;

/**
 * Aguarda Firebase resolver o auth state inicial (de cache local).
 * NÃO faz login automático. Se usuário não estiver logado, currentUser fica null.
 */
export function waitForAuth(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!authReadyPromise) {
    const { auth } = getFirebase();
    authReadyPromise = new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }
  return authReadyPromise;
}

/**
 * Garante que existe um usuário autenticado.
 * Lança AuthRequiredError se não houver — UI deve abrir login.
 */
export async function ensureSignedIn(): Promise<void> {
  if (typeof window === "undefined") return;
  await waitForAuth();
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    throw new AuthRequiredError();
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Login obrigatório.");
    this.name = "AuthRequiredError";
  }
}

export function isAuthRequiredError(err: unknown): err is AuthRequiredError {
  return err instanceof AuthRequiredError || (err as { name?: string })?.name === "AuthRequiredError";
}

export async function signUpEmail(email: string, password: string, displayName?: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function resetPassword(email: string): Promise<void> {
  const { auth } = getFirebase();
  await sendPasswordResetEmail(auth, email.trim(), {
    url: typeof window !== "undefined" ? window.location.origin : "https://brain.app",
    handleCodeInApp: false,
  });
}

export async function signOutUser(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, callback);
}

export type { User };
