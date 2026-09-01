import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { buildAuthorizeUrl } from "../../lib/discordOAuth";

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Verifiziere dich, damit du bei einem späteren Server-Umzug automatisch mitgenommen wirst.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Dieser Befehl funktioniert nur auf einem Server.", ephemeral: true });
    return;
  }

  const authorizeUrl = buildAuthorizeUrl(interaction.user.id, interaction.guildId);

  const embed = new EmbedBuilder()
    .setTitle("Verifizierung")
    .setDescription(
      "Klicke auf den Button, um dich zu verifizieren.\n\n" +
      "Damit erlaubst du dem Bot, dich **falls dieser Server jemals umziehen muss**, " +
      "automatisch in den neuen Server mitzunehmen – ohne dass du selbst einer Einladung folgen musst."
    )
    .setColor(0x5865f2);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Jetzt verifizieren")
      .setStyle(ButtonStyle.Link)
      .setURL(authorizeUrl)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
