# Discord Server-Migration Bot (Verify + Auto-Rejoin)

Ein eigenständiger Discord-Bot, der verifizierte Mitglieder bei einem
Server-Umzug automatisch in einen neuen Server holt – per Discord OAuth2
`guilds.join`-Scope. **Keine separate Website nötig**: Bot und der kleine
OAuth-Callback-Server laufen zusammen in einem einzigen Node-Prozess
(`src/index.ts`).

## Warum überhaupt ein HTTP-Server?

Discord schickt den Browser jedes Members nach der Autorisierung an eure
`redirect_uri` zurück. Diese URL muss von den Browsern der Server-Mitglieder
erreichbar sein – `localhost` funktioniert deshalb nur bei dir selbst zum
Testen, nicht für andere Mitglieder. Sobald ihr den Bot z.B. auf Railway
hostet, bekommt ihr dafür automatisch eine öffentliche Domain (siehe unten).

## Funktionsweise

1. **`/verify`** – Mitglied klickt einen Link-Button, autorisiert bei Discord
   mit den Scopes `identify guilds.join`.
2. **`GET /api/auth/discord/callback`** – tauscht den Code gegen Access-/
   Refresh-Token, holt die echte Discord-User-ID und speichert beide Tokens
   AES-256-verschlüsselt in der Datenbank.
3. **`/migrate ziel_server_id:<id>`** (Admin-only) – geht alle gespeicherten
   User durch, erneuert abgelaufene Tokens automatisch und fügt jeden per
   Discord-API in den neuen Server ein.

## Lokal starten

```bash
npm install
cp .env.example .env    # Werte eintragen, siehe unten
npx prisma migrate dev --name init
npm run deploy-commands # registriert /verify und /migrate bei Discord
npm run dev
```

Für lokale Tests: `DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback`
und im Discord Developer Portal unter OAuth2 → Redirects exakt so eintragen.
Damit kannst du `/verify` selbst durchtesten (der Callback läuft ja bei dir
lokal). Für echte Server-Mitglieder brauchst du danach den Live-Deploy.

## Werte für `.env`

- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` – aus dem
  [Discord Developer Portal](https://discord.com/developers/applications).
- `ENCRYPTION_KEY` – generieren mit
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `OAUTH_STATE_SECRET` – beliebiger langer Zufallsstring.
- `DATABASE_URL` – bei Railway automatisch vorhanden, wenn ihr eine
  PostgreSQL-Datenbank im selben Projekt hinzufügt.

## Deploy auf Railway (Kurzfassung)

1. Repo auf GitHub pushen (`.env` bleibt draußen, siehe `.gitignore`).
2. Railway: „New Project" → „Deploy from GitHub repo".
3. „+ New" → „Database" → „PostgreSQL" im selben Projekt hinzufügen.
4. Unter „Variables" alle Werte aus `.env.example` eintragen (`DATABASE_URL`
   kommt automatisch von der Datenbank).
5. Unter „Settings" → „Networking" → „Generate Domain" – die erzeugte
   `*.up.railway.app`-URL + `/api/auth/discord/callback` als
   `DISCORD_REDIRECT_URI` eintragen, identisch im Discord Developer Portal
   hinterlegen.
6. Einmalig `npm run deploy-commands` gegen die Produktions-Umgebung laufen
   lassen (z.B. per `railway run npm run deploy-commands`).
7. Logs prüfen, `/verify` auf dem echten Server testen.

## Falls ihr schon einen bestehenden Bot habt

`src/bot/client.ts` ist ein Minimal-Setup. Habt ihr bereits einen laufenden
Bot mit eigenem Command-Handler, reicht es, `src/bot/commands/verify.ts` und
`src/bot/commands/migrate.ts` dort einzuhängen und `src/http/server.ts` beim
Start eures bestehenden Prozesses mit aufzurufen – ein zweiter Bot-Login ist
nicht nötig.

## Sicherheitshinweise

- `.env` niemals committen.
- `ENCRYPTION_KEY` und `OAUTH_STATE_SECRET` sind Geheimnisse – bei Leak
  können gespeicherte Tokens missbraucht werden, bei Verlust nicht mehr
  entschlüsselt werden.
- `/migrate` ist per `PermissionFlagsBits.Administrator` eingeschränkt.
