// Migra todos os dados de um workspace pra outro.
// Preserva IDs originais. Não apaga origem.
//
// Uso:
//   node scripts/migrate-workspace.mjs <fromWorkspaceId> <toWorkspaceId>
//
// Ex:
//   node scripts/migrate-workspace.mjs EKQuaUZAnsYfKprk8grlZlkzkRk2 F0R6SzK4fjPKlvdWlfjjEg0X0c02

import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";

loadEnvConfig(process.cwd());

const [, , FROM, TO] = process.argv;
if (!FROM || !TO) {
  console.error("Uso: node scripts/migrate-workspace.mjs <fromWorkspaceId> <toWorkspaceId>");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const COLLECTIONS = [
  "projetos",
  "modulos",
  "adocoes",
  "decisoes",
  "checklistSessions",
  "customCards",
  "comparacoes",
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function srcCol(name) {
  return collection(db, "workspaces", FROM, name);
}
function dstDoc(name, id) {
  return doc(db, "workspaces", TO, name, id);
}

async function migrateCollection(name) {
  const snap = await getDocs(srcCol(name));
  if (snap.empty) {
    console.log(`  · ${name}: vazio`);
    return 0;
  }
  // batch tem limite de 500 ops; se passar, divide
  const docs = snap.docs;
  let written = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const chunk = docs.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const d of chunk) {
      batch.set(dstDoc(name, d.id), d.data());
    }
    await batch.commit();
    written += chunk.length;
  }
  console.log(`  ✓ ${name}: ${written} docs`);
  return written;
}

async function main() {
  console.log(`\nMigrando: workspaces/${FROM}  →  workspaces/${TO}\n`);
  await signInAnonymously(auth);
  console.log(`Auth: ${auth.currentUser?.uid}\n`);
  let total = 0;
  for (const name of COLLECTIONS) {
    total += await migrateCollection(name);
  }
  console.log(`\n✅ Total: ${total} documentos copiados.`);
  console.log(`   Origem (${FROM}) preservada — apague pela UI se quiser.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
