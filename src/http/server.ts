import express from "express";
import { callbackRouter } from "./callback";

export function startHttpServer() {
  const app = express();

  app.get("/", (_req, res) => res.send("Bot läuft."));
  app.use(callbackRouter);

  // Railway setzt PORT automatisch als Umgebungsvariable
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`HTTP-Server (OAuth-Callback) läuft auf Port ${port}`);
  });
}
