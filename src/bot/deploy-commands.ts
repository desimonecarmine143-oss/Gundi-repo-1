import { REST, Routes } from "discord.js";
import { commandsToRegister } from "./client";

async function main() {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN ?? "");

  console.log(`Registriere ${commandsToRegister.length} Slash-Commands …`);

  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID ?? ""),
    { body: commandsToRegister }
  );

  console.log("Fertig.");
}

main().catch(console.error);
