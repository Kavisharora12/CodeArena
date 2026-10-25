import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_BYTES = 64;

export function hashContestAccessCode(code: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, HASH_BYTES).toString("hex");
  return { salt, hash };
}

export function verifyContestAccessCode(code: string, salt: string, hash: string) {
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(code, salt, HASH_BYTES);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
