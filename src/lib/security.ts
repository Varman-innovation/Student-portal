import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_KEY_LENGTH = 64;

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function derivePasswordKey(password: string, salt: Buffer, keyLength: number, cost: number, blockSize: number, parallelization: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, { N: cost, r: blockSize, p: parallelization }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt, PASSWORD_KEY_LENGTH, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION);
  return ["scrypt", SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION, salt.toString("hex"), key.toString("hex")].join("$");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, costValue, blockSizeValue, parallelizationValue, saltValue, hashValue] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !costValue || !blockSizeValue || !parallelizationValue || !saltValue || !hashValue) return false;

  const cost = Number(costValue);
  const blockSize = Number(blockSizeValue);
  const parallelization = Number(parallelizationValue);
  const expected = Buffer.from(hashValue, "hex");
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization) || expected.length === 0) return false;

  try {
    const actual = await derivePasswordKey(password, Buffer.from(saltValue, "hex"), expected.length, cost, blockSize, parallelization);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
