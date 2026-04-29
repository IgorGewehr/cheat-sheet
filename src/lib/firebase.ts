"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
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
  apiKey: "AIzaSyDqGt7sYozIVZJHeBa3-5JQ8D0srcemnkE",
  authDomain: "facilito-9f70c.firebaseapp.com",
  projectId: "facilito-9f70c",
  storageBucket: "facilito-9f70c.firebasestorage.app",
  messagingSenderId: "851640298286",
  appId: "1:851640298286:web:35ebad519bd288acb568bf",
};

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

let signInPromise: Promise<void> | null = null;

export function ensureSignedIn(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const { auth } = getFirebase();
  if (auth.currentUser) return Promise.resolve();
  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then(() => undefined)
      .catch((err) => {
        console.error("Anonymous sign-in failed:", err);
        signInPromise = null;
      });
  }
  return signInPromise;
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
  signInPromise = null;
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, callback);
}

export type { User };
