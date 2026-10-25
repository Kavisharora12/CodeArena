import { NextRequest, NextResponse } from "next/server";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { calculateActivityStreak } from "@/lib/activityStreak";
import { getFirebaseSession } from "@/lib/firebaseSession";

export const dynamic = "force-dynamic";

function submissionDate(value: unknown): Date | null {
  if (value instanceof Date || typeof value === "string" || typeof value === "number") {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshots = await adminFirestore
      .collection("submissions")
      .where("userId", "==", session.uid)
      .get();
    const dates = snapshots.docs
      .map((snapshot) => submissionDate(snapshot.get("createdAt")))
      .filter((date): date is Date => date !== null);
    return NextResponse.json({
      success: true,
      message: "Activity streak loaded.",
      ...calculateActivityStreak(dates),
      timezone: "UTC",
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Unable to load activity streak:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to load your activity streak." },
      { status: 500 },
    );
  }
}
