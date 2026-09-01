import { Client, GatewayIntentBits, Collection, Interaction } from "discord.js";
import * as verifyCommand from "./commands/verify";
import * as migrateCommand from "./commands/migrate";

interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: any) => Promise<void>;
}

const commands = new Collection<string, Command>();
commands.set(verifyCommand.data.name, verifyCommand);
commands.set(migrateCommand.data.name, migrateCommand);

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Bot eingeloggt als ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Fehler bei /${interaction.commandName}:`, err);
    const payload = { content: "❌ Es ist ein Fehler aufgetreten.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

export function startBot() {
  client.login(process.env.DISCORD_BOT_TOKEN);
}

// Wird separat ausgeführt (siehe package.json "deploy-commands"), NICHT bei
// jedem Bot-Start, da Discord das Neu-Registrieren rate-limitet.
export const commandsToRegister = [verifyCommand.data.toJSON(), migrateCommand.data.toJSON()];
