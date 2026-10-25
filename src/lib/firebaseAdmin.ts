import "server-only";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync } from "node:fs";
import path from "node:path";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Firebase Admin.");
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const localCredentialPath = path.resolve(
    process.cwd(),
    "firebase-service-account.json",
  );
  if (existsSync(localCredentialPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localCredentialPath;
  } else {
    throw new Error(
      "Firebase Admin credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file path.",
    );
  }
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: applicationDefault(),
      projectId,
    });

export const firebaseAdminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);
