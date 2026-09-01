import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setup-verify")
  .setDescription("Postet den dauerhaften Verifizierungs-Button in diesem Kanal.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: "Dieser Befehl funktioniert nur in einem Text-Kanal auf einem Server.", ephemeral: true });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("start_verify")
      .setLabel("Verifiziere dich")
      .setStyle(ButtonStyle.Success)
  );

  await interaction.channel.send({ components: [row] });
  await interaction.reply({ content: "✅ Verifizierungs-Button wurde gepostet.", ephemeral: true });
}
