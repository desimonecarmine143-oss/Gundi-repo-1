import { Router, Request, Response } from "express";
import { exchangeCode, fetchDiscordUser } from "../lib/discordOAuth";
import { verifyState } from "../lib/oauthState";
import { encryptToken } from "../lib/crypto";
import { prisma } from "../lib/prisma";

export const callbackRouter = Router();

callbackRouter.get("/api/auth/discord/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;

  if (error) {
    return sendPage(res, 400, `Autorisierung abgelehnt: ${error}`);
  }
  if (!code || !state) {
    return sendPage(res, 400, "Fehlende Parameter in der Discord-Antwort.");
  }

  let statePayload;
  try {
    statePayload = verifyState(state);
  } catch {
    return sendPage(res, 400, "State-Prüfung fehlgeschlagen. Bitte den Verify-Link erneut anfordern.");
  }

  try {
    const tokenRes = await exchangeCode(code);
    const discordUser = await fetchDiscordUser(tokenRes.access_token);

    if (discordUser.id !== statePayload.discordId) {
      return sendPage(res, 400, "Discord-Account stimmt nicht mit dem Verify-Link überein.");
    }

    const expiresAt = new Date(Date.now() + tokenRes.expires_in * 1000);

    await prisma.verifiedUser.upsert({
      where: {
        discordId_guildId: {
          discordId: discordUser.id,
          guildId: statePayload.guildId,
        },
      },
      create: {
        discordId: discordUser.id,
        guildId: statePayload.guildId,
        username: discordUser.username,
        accessToken: encryptToken(tokenRes.access_token),
        refreshToken: encryptToken(tokenRes.refresh_token),
        expiresAt,
      },
      update: {
        username: discordUser.username,
        accessToken: encryptToken(tokenRes.access_token),
        refreshToken: encryptToken(tokenRes.refresh_token),
        expiresAt,
      },
    });

    return sendPage(res, 200, "✅ Verifizierung erfolgreich! Du kannst dieses Fenster jetzt schließen.");
  } catch (err) {
    console.error("OAuth-Callback-Fehler:", err);
    return sendPage(res, 500, "Beim Verifizieren ist ein Fehler aufgetreten. Bitte später erneut versuchen.");
  }
});

function sendPage(res: Response, status: number, message: string) {
  res
    .status(status)
    .type("html")
    .send(
      `<html><body style="font-family:sans-serif;text-align:center;padding-top:4rem">
        <h2>${status === 200 ? "Verifizierung" : "Hinweis"}</h2>
        <p>${message}</p>
      </body></html>`
    );
}
