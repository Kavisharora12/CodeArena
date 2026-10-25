export function canPublishOfficialSolution(
  userType: unknown,
  isOfficial: boolean,
): boolean {
  return !isOfficial || userType === "admin";
}

export function canManageSolution(
  uid: string,
  userType: unknown,
  ownerUid: unknown,
  isOfficial: boolean,
): boolean {
  if (isOfficial) return userType === "admin";
  return ownerUid === uid;
}
