import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebaseAdmin";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";
import { notificationCreateSchema } from "@/schemas/notificationSchema";
import { canPublishNotification } from "@/lib/notificationAuthorization";

export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 8 * 1024;

export async function GET(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminFirestore.collection("notifications")
      .where("published", "==", true)
      .limit(50)
      .get();
    const notifications = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt ?? null,
        };
      })
      .sort((left, right) =>
        String(right.createdAt).localeCompare(String(left.createdAt)),
      );
    return NextResponse.json(
      { success: true, notifications },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to list notifications:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to load notifications." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getFirebaseSession(req);
  if (!session?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await parseBoundedJson(req, MAX_REQUEST_BYTES);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Invalid request body." },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
  const parsed = notificationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid notification." },
      { status: 400 },
    );
  }

  try {
    const userSnapshot = await adminFirestore.collection("users").doc(session.uid).get();
    if (!userSnapshot.exists || !canPublishNotification(userSnapshot.get("userType"))) {
      return NextResponse.json(
        { success: false, message: "Only admins can publish notifications." },
        { status: 403 },
      );
    }

    const notificationRef = adminFirestore.collection("notifications").doc();
    const createdAt = new Date().toISOString();
    const notification = {
      ...parsed.data,
      authorUid: session.uid,
      published: true,
      createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await notificationRef.create(notification);
    return NextResponse.json(
      {
        success: true,
        message: "Announcement published.",
        notification: { id: notificationRef.id, ...parsed.data, createdAt },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to publish notification:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { success: false, message: "Unable to publish the notification." },
      { status: 500 },
    );
  }
}
