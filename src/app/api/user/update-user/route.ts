import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { updateUserValidation } from "@/schemas/updateUserSchema";

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const parsedData = updateUserValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 },
      );
    }

    const userRef = adminFirestore.collection("users").doc(session.uid);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    await userRef.update({
      ...parsedData.data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updatedSnapshot = await userRef.get();

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        user: { uid: updatedSnapshot.id, ...updatedSnapshot.data() },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while updating user:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to update user information" },
      { status: 500 },
    );
  }
}
