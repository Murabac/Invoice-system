import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class VaultEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultEncryptionError";
  }
}

export type VaultPayload = {
  value: string;
  notes: string;
};

function deriveKey(raw: string): Buffer {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  if (trimmed.length >= 32) {
    return createHash("sha256").update(trimmed, "utf8").digest();
  }
  throw new VaultEncryptionError(
    "VAULT_ENCRYPTION_KEY must be 64 hex characters (32 bytes) or a long passphrase"
  );
}

export function isVaultEncryptionConfigured(): boolean {
  return Boolean(process.env.VAULT_ENCRYPTION_KEY?.trim());
}

function getEncryptionKey(): Buffer {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw?.trim()) {
    throw new VaultEncryptionError(
      "Vault encryption is not configured. Set VAULT_ENCRYPTION_KEY in .env.local (64-char hex from: openssl rand -hex 32)."
    );
  }
  return deriveKey(raw);
}

export function encryptVaultPayload(payload: VaultPayload): {
  ciphertext: string;
  iv: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, tag]);
  return {
    iv: iv.toString("base64"),
    ciphertext: combined.toString("base64"),
  };
}

export function decryptVaultPayload(
  ciphertext: string,
  iv: string
): VaultPayload {
  const key = getEncryptionKey();
  const ivBuf = Buffer.from(iv, "base64");
  const combined = Buffer.from(ciphertext, "base64");
  if (combined.length <= TAG_BYTES) {
    throw new VaultEncryptionError("Invalid vault ciphertext");
  }
  const tag = combined.subarray(combined.length - TAG_BYTES);
  const encrypted = combined.subarray(0, combined.length - TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  const parsed = JSON.parse(decrypted.toString("utf8")) as VaultPayload;
  if (typeof parsed.value !== "string") {
    throw new VaultEncryptionError("Invalid vault payload");
  }
  return {
    value: parsed.value,
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
  };
}
