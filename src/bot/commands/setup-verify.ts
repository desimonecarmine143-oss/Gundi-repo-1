import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
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

  const embed = new EmbedBuilder()
    .setDescription("Verifiziere dich bitte um in der Gang beizutreten.")
    .setColor(0x57f287);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("start_verify")
      .setLabel("Verifiziere dich")
      .setStyle(ButtonStyle.Success)
  );

  await interaction.channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: "✅ Verifizierungs-Button wurde gepostet.", ephemeral: true });
}
