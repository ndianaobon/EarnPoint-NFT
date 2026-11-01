import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

// scrypt at the strength OWASP recommends for password storage.
const SCRYPT = { N: 2 ** 17, r: 8, p: 1, keyLength: 64, maxmem: 256 * 1024 * 1024 };

function derive(password: string, salt: Buffer, options: ScryptOptions, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, keyLength, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const { N, r, p, keyLength, maxmem } = SCRYPT;
  const key = await derive(password, salt, { N, r, p, maxmem }, keyLength);
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !N || !r || !p || !salt || !expected) return false;
  const want = Buffer.from(expected, "base64");
  const got = await derive(
    password,
    Buffer.from(salt, "base64"),
    { N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem },
    want.length,
  );
  return timingSafeEqual(got, want);
}

// Checked when an email has no account, so that answer takes as long as a real check.
export const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(32).toString("base64"));

export const newToken = () => randomBytes(32).toString("base64url");

// Tokens are long and random, so a fast hash is enough, and a stolen database
// contains nothing that can be used to log in.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomCode(length: number) {
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export const newReferralCode = () => randomCode(10);
export const newRecoveryCode = () => `${randomCode(5)}-${randomCode(5)}`;
export const normalizeRecoveryCode = (code: string) => code.trim().toUpperCase();

export function encrypt(plain: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
}

export function decrypt(stored: string, key: Buffer) {
  const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64"));
  if (!iv || !tag || !data) throw new Error("Malformed encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
