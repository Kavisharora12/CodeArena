import assert from "node:assert/strict";
import { test } from "node:test";

import { notificationCreateSchema } from "./notificationSchema.ts";
import { canPublishNotification } from "../lib/notificationAuthorization.ts";

test("validates bounded announcement title and message", () => {
  assert.equal(notificationCreateSchema.safeParse({
    title: "Maintenance",
    message: "CodeArena will be read-only tonight.",
  }).success, true);
  assert.equal(notificationCreateSchema.safeParse({ title: "No", message: "Hi" }).success, false);
  assert.equal(notificationCreateSchema.safeParse({
    title: "x".repeat(121),
    message: "A valid message",
  }).success, false);
});

test("only the admin role can publish announcements", () => {
  assert.equal(canPublishNotification("admin"), true);
  assert.equal(canPublishNotification("user"), false);
  assert.equal(canPublishNotification(undefined), false);
});
