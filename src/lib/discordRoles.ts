const DISCORD_API = "https://discord.com/api/v10";

/**
 * Fügt einem Server-Mitglied eine Rolle hinzu. Der Bot braucht dafür die
 * Berechtigung "Rollen verwalten" UND seine eigene höchste Rolle muss in der
 * Rollen-Reihenfolge ÜBER der zu vergebenden Rolle stehen – sonst antwortet
 * Discord mit 403, ohne einen hilfreichen Text.
 */
export async function addRole(guildId: string, userId: string, roleId: string): Promise<void> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    throw new Error(`Rolle ${roleId} hinzufügen fehlgeschlagen: HTTP ${res.status} ${await res.text()}`);
  }
}

/**
 * Entfernt einem Server-Mitglied eine Rolle. Gleiche Voraussetzungen wie addRole.
 */
export async function removeRole(guildId: string, userId: string, roleId: string): Promise<void> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    throw new Error(`Rolle ${roleId} entfernen fehlgeschlagen: HTTP ${res.status} ${await res.text()}`);
  }
}
