import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "../../lib/prisma";
import { decryptToken, encryptToken } from "../../lib/crypto";
import { refreshAccessToken } from "../../lib/discordOAuth";

const DISCORD_API = "https://discord.com/api/v10";
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 1500;
const REFRESH_BUFFER_MS = 60 * 1000;

export const data = new SlashCommandBuilder()
  .setName("migrate")
  .setDescription("Bringt alle verifizierten Mitglieder dieses Servers automatisch in einen anderen Server.")
  .addStringOption((opt) =>
    opt
      .setName("ziel_server_id")
      .setDescription("ID des neuen Servers (der Bot muss dort bereits Mitglied sein)")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Dieser Befehl funktioniert nur auf einem Server.", ephemeral: true });
    return;
  }

  const targetGuildId = interaction.options.getString("ziel_server_id", true).trim();

  const targetGuild = interaction.client.guilds.cache.get(targetGuildId);
  if (!targetGuild) {
    await interaction.reply({
      content: "❌ Der Bot ist nicht (oder noch nicht gecacht) im Zielserver. Bitte zuerst den Bot dort einladen.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const verifiedUsers = await prisma.verifiedUser.findMany({
    where: { guildId: interaction.guildId },
  });

  if (verifiedUsers.length === 0) {
    await interaction.editReply("Es sind keine verifizierten Mitglieder für diesen Server gespeichert.");
    return;
  }

  let added = 0;
  let alreadyMember = 0;
  let failed = 0;
  const failedUsers: string[] = [];

  for (let i = 0; i < verifiedUsers.length; i += BATCH_SIZE) {
    const batch = verifiedUsers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          let accessToken = decryptToken(user.accessToken);

          if (user.expiresAt.getTime() - Date.now() < REFRESH_BUFFER_MS) {
            const refreshed = await refreshAccessToken(decryptToken(user.refreshToken));
            accessToken = refreshed.access_token;

            await prisma.verifiedUser.update({
              where: { id: user.id },
              data: {
                accessToken: encryptToken(refreshed.access_token),
                refreshToken: encryptToken(refreshed.refresh_token),
                expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              },
            });
          }

          const res = await fetch(
            `${DISCORD_API}/guilds/${targetGuildId}/members/${user.discordId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: accessToken }),
            }
          );

          if (res.status === 201) added++;
          else if (res.status === 204) alreadyMember++;
          else {
            failed++;
            failedUsers.push(`${user.username} (${user.discordId}) – HTTP ${res.status}`);
          }
        } catch (err) {
          failed++;
          failedUsers.push(`${user.username} (${user.discordId}) – ${(err as Error).message}`);
        }
      })
    );

    if (i + BATCH_SIZE < verifiedUsers.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }

    if (verifiedUsers.length > 20) {
      await interaction.editReply(
        `⏳ Migration läuft … ${Math.min(i + BATCH_SIZE, verifiedUsers.length)}/${verifiedUsers.length} verarbeitet`
      );
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("Server-Migration abgeschlossen")
    .setColor(failed > 0 ? 0xffaa00 : 0x57f287)
    .addFields(
      { name: "✅ Neu hinzugefügt", value: String(added), inline: true },
      { name: "ℹ️ Bereits im Server", value: String(alreadyMember), inline: true },
      { name: "❌ Fehlgeschlagen", value: String(failed), inline: true }
    );

  if (failedUsers.length > 0) {
    embed.addFields({
      name: "Fehlgeschlagene User (max. 15 angezeigt)",
      value: failedUsers.slice(0, 15).join("\n").slice(0, 1024) || "–",
    });
  }

  await interaction.editReply({ content: null, embeds: [embed] });
}
