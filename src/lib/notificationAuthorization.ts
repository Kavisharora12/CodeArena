export function canPublishNotification(userType: unknown): boolean {
  return userType === "admin";
}
