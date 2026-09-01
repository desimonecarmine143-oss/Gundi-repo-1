import "dotenv/config";
import { startHttpServer } from "./http/server";
import { startBot } from "./bot/client";

startHttpServer();
startBot();
