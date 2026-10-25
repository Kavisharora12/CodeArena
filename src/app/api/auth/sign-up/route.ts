import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore, firebaseAdminAuth } from "@/lib/firebaseAdmin";
import { signUpValidation } from "@/schemas/signUpSchema";

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");
    const idToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Firebase authentication is required." },
        { status: 401 },
      );
    }

    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    const body = await req.json();
    const parsedData = signUpValidation.pick({ username: true }).safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 },
      );
    }

    const userRef = adminFirestore.collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();

    await userRef.set(
      {
        uid: decodedToken.uid,
        email: decodedToken.email,
        username: parsedData.data.username,
        avatar: decodedToken.picture ?? "",
        userType: userSnapshot.exists ? userSnapshot.get("userType") : "user",
        bio: userSnapshot.exists ? userSnapshot.get("bio") ?? "" : "",
        country: userSnapshot.exists ? userSnapshot.get("country") ?? "" : "",
        university: userSnapshot.exists ? userSnapshot.get("university") ?? "" : "",
        github: userSnapshot.exists ? userSnapshot.get("github") ?? "" : "",
        linkdin: userSnapshot.exists ? userSnapshot.get("linkdin") ?? "" : "",
        skills: userSnapshot.exists ? userSnapshot.get("skills") ?? [] : [],
        solutions: userSnapshot.exists ? userSnapshot.get("solutions") ?? [] : [],
        submissions: userSnapshot.exists ? userSnapshot.get("submissions") ?? [] : [],
        solvedQuestions: userSnapshot.exists ? userSnapshot.get("solvedQuestions") ?? [] : [],
        solvedProblems: userSnapshot.exists ? userSnapshot.get("solvedProblems") ?? 0 : 0,
        updatedAt: FieldValue.serverTimestamp(),
        ...(userSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile created successfully. Verify your email to sign in.",
        userId: decodedToken.uid,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Firebase profile creation failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to create the account profile." },
      { status: 500 },
    );
  }
}
