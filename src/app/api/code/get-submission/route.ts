import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";

export async function GET(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const submissionId = new URL(req.url).searchParams.get("submissionId");
  if (!submissionId) {
    return NextResponse.json(
      { success: false, message: "Submission ID is required" },
      { status: 400 },
    );
  }

  try {
    const submissionSnapshot = await adminFirestore
      .collection("submissions")
      .doc(submissionId)
      .get();
    if (
      !submissionSnapshot.exists ||
      submissionSnapshot.get("userId") !== session.uid
    ) {
      return NextResponse.json(
        { success: false, message: "Submitted code not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Submission details found successfully",
        submissionDetails: {
          _id: submissionSnapshot.id,
          ...submissionSnapshot.data(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Something went wrong while fetching submission details:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Unable to fetch submission details" },
      { status: 500 },
    );
  }
}
