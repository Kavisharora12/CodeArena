import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore, firebaseAdminAuth } from "@/lib/firebaseAdmin";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebaseSessionCookie";
import { getFirebaseSession } from "@/lib/firebaseSession";

const sessionDurationMs = 5 * 24 * 60 * 60 * 1000;

function isSameOrigin(request: NextRequest): boolean {
  return request.headers.get("origin") === request.nextUrl.origin;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionDurationMs / 1000,
  };
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!idToken) {
    return NextResponse.json(
      { success: false, message: "Firebase authentication is required." },
      { status: 401 },
    );
  }

  try {
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken, true);
    if (!decodedToken.email || decodedToken.email_verified !== true) {
      return NextResponse.json(
        { success: false, message: "Verify your email before signing in." },
        { status: 403 },
      );
    }

    const userRef = adminFirestore.collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      await userRef.create({
        uid: decodedToken.uid,
        email: decodedToken.email,
        username:
          decodedToken.name ?? decodedToken.email.split("@")[0],
        avatar: decodedToken.picture ?? "",
        userType: "user",
        bio: "",
        country: "",
        university: "",
        github: "",
        linkdin: "",
        skills: [],
        solutions: [],
        submissions: [],
        solvedQuestions: [],
        solvedProblems: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
      expiresIn: sessionDurationMs,
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      FIREBASE_SESSION_COOKIE,
      sessionCookie,
      sessionCookieOptions(),
    );
    return response;
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (typeof error.code === "string" || typeof error.code === "number")
        ? error.code
        : "unknown";
    console.error("Firebase session creation failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode,
    });
    if (errorCode === 7 || errorCode === "permission-denied") {
      return NextResponse.json(
        {
          success: false,
          message:
            "CodeArena's Firebase server account does not have permission to access Firestore. Ask the Firebase project owner to grant the Cloud Datastore User role.",
        },
        { status: 503 },
      );
    }
    if (errorCode === 5 || errorCode === "not-found") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cloud Firestore is not available in this Firebase project. Create the default Firestore database, then retry.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unable to create a CodeArena session." },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  const decodedToken = await getFirebaseSession(request);
  if (!decodedToken) {
    const response = NextResponse.json(
      { success: false, message: "Not signed in." },
      { status: 401 },
    );
    response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }

  try {
    const userSnapshot = await adminFirestore
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (!userSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        user: {
          _id: decodedToken.uid,
          uid: decodedToken.uid,
          email: decodedToken.email ?? "",
          username: userSnapshot.get("username") ?? "",
          avatar: userSnapshot.get("avatar") ?? "",
          userType: userSnapshot.get("userType") ?? "user",
          isVerified: decodedToken.email_verified === true,
        },
      },
    });
  } catch (error) {
    console.error(
      "Firebase session profile lookup failed.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to load the user profile." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
