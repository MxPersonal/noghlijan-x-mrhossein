import "server-only";

import { constants } from "node:fs";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const KEY_PATH = join(process.cwd(), "prisma", "integration-secrets.key");
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const FORMAT_VERSION = 1;

let cachedKey: Buffer | null = null;

async function readKey(): Promise<Buffer> {
  if (cachedKey) return cachedKey;

  try {
    const key = await readFile(KEY_PATH);
    if (key.length !== KEY_BYTES) {
      throw new Error("کلید رمزگذاری اتصال‌ها نامعتبر است");
    }
    cachedKey = key;
    return key;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }

  const generatedKey = randomBytes(KEY_BYTES);
  try {
    await writeFile(KEY_PATH, generatedKey, {
      flag: "wx",
      mode: constants.S_IRUSR | constants.S_IWUSR,
    });
    await chmod(KEY_PATH, constants.S_IRUSR | constants.S_IWUSR).catch(
      () => undefined,
    );
    cachedKey = generatedKey;
    return generatedKey;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const key = await readFile(KEY_PATH);
    if (key.length !== KEY_BYTES) {
      throw new Error("کلید رمزگذاری اتصال‌ها نامعتبر است");
    }
    cachedKey = key;
    return key;
  }
}

export async function encryptJson(value: unknown): Promise<string> {
  const key = await readKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([
    Buffer.from([FORMAT_VERSION]),
    iv,
    tag,
    ciphertext,
  ]).toString("base64url");
}

export async function decryptJson<T>(encrypted: string): Promise<T> {
  const payload = Buffer.from(encrypted, "base64url");
  if (payload.length <= 1 + IV_BYTES + TAG_BYTES || payload[0] !== FORMAT_VERSION) {
    throw new Error("داده رمزگذاری‌شده اتصال نامعتبر است");
  }

  const key = await readKey();
  const iv = payload.subarray(1, 1 + IV_BYTES);
  const tag = payload.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
  const ciphertext = payload.subarray(1 + IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext) as T;
}
