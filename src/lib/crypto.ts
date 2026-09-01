import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// ENCRYPTION_KEY muss ein 32-Byte-Hex-String sein (64 Zeichen).
// Erzeugen z.B. mit: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "hex");

if (KEY.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY fehlt oder ist ungültig (muss 32 Byte / 64 Hex-Zeichen sein)."
  );
}

export function encryptToken(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Ungültiges verschlüsseltes Token-Format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
