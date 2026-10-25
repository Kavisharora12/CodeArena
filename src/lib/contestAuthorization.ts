export function canManageContestByRole(
  uid: string,
  role: string | undefined,
  ownerUid: string,
): boolean {
  return role === "admin" || (role === "teacher" && uid === ownerUid);
}
