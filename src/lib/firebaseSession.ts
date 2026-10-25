import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

import { FIREBASE_SESSION_COOKIE } from "@/lib/firebaseSessionCookie";
import { adminFirestore, firebaseAdminAuth } from "@/lib/firebaseAdmin";

export async function getFirebaseSession(
  request: NextRequest,
): Promise<DecodedIdToken | null> {
  const sessionCookie = request.cookies.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    return await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (typeof error.code === "string" || typeof error.code === "number")
        ? error.code
        : "unknown";
    console.warn("Firebase session cookie verification failed.", { errorCode });
    return null;
  }
}

export async function isFirebaseAdmin(uid: string): Promise<boolean> {
  const userSnapshot = await adminFirestore.collection("users").doc(uid).get();
  return userSnapshot.get("userType") === "admin";
}

export async function isContestManager(uid: string): Promise<boolean> {
  const userSnapshot = await adminFirestore.collection("users").doc(uid).get();
  const role = userSnapshot.get("userType");
  return role === "admin" || role === "teacher";
}
