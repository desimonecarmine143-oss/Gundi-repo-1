import { createHmac, randomBytes } from "crypto";

const STATE_SECRET = process.env.OAUTH_STATE_SECRET ?? "";
const MAX_AGE_MS = 10 * 60 * 1000;

interface StatePayload {
  discordId: string;
  guildId: string;
  ts: number;
  nonce: string;
}

export function createState(discordId: string, guildId: string): string {
  const payload: StatePayload = {
    discordId,
    guildId,
    ts: Date.now(),
    nonce: randomBytes(8).toString("hex"),
  };

  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", STATE_SECRET)
    .update(json)
    .digest("base64url");

  return `${json}.${signature}`;
}

export function verifyState(state: string): StatePayload {
  const [json, signature] = state.split(".");
  if (!json || !signature) {
    throw new Error("Ungültiger State-Parameter.");
  }

  const expectedSignature = createHmac("sha256", STATE_SECRET)
    .update(json)
    .digest("base64url");

  if (signature !== expectedSignature) {
    throw new Error("State-Signatur stimmt nicht überein (mögliche Manipulation).");
  }

  const payload: StatePayload = JSON.parse(
    Buffer.from(json, "base64url").toString("utf8")
  );

  if (Date.now() - payload.ts > MAX_AGE_MS) {
    throw new Error("State-Parameter ist abgelaufen, bitte erneut verifizieren.");
  }

  return payload;
}
