# Road Diet

Every street has a budget. How would you spend it?

A short game where you redesign a Toronto street's limited road space and see how it affects four fictional residents, plus emissions, safety and fairness. A learning tool, not a forecast.

## Develop

```bash
npm install
npm run dev    # server on :3000, client on :5173 (proxies /api)
npm test       # vitest in shared/ and server/
npm run build
```

## Database (Tiger Data / TimescaleDB)

Run history and "how others solved this street" need Postgres with TimescaleDB. Without `DATABASE_URL` the game still works and the stats section is hidden.

```bash
docker run -d --name roaddiet-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=roaddiet -p 55432:5432 timescale/timescaledb:latest-pg17
# .env: DATABASE_URL=postgres://postgres:dev@localhost:55432/roaddiet   (or your Tiger Data connection string)
npm run migrate -w @road-diet/server     # idempotent; plain table + view if timescaledb is missing
npm run seed -w @road-diet/server -- --level bloor-christie-ossington --n 40   # demo runs, marked demo = true
npm run refresh -w @road-diet/server     # materialize the hourly aggregate now (demos)
TEST_DATABASE_URL=postgres://postgres:dev@localhost:55432/roaddiet npm test   # DB tests use throwaway schemas
```

## Run in production

```bash
npm run build
NODE_ENV=production npm start   # one process serves the game and /api on $PORT (default 3000)
```

Copy `.env.example` to `.env` for local secrets. Never commit `.env`.

## Deploy (Vultr + Caddy)

One-time setup:

1. Create a Vultr instance running Ubuntu 24.04 and note its IPv4 address. Pick a plan that includes IPv4 (the cheapest tier can be IPv6-only, which can't take an `A` record); 1 GB of RAM is enough.
2. At your domain registrar, add a DNS `A` record for the domain pointing at that IP.
3. Copy your secrets to the server and run the setup script as root:

   ```bash
   scp .env root@<ip>:/root/road-diet.env      # GEMINI_API_KEY, GEMINI_MODEL, ... (set NODE_ENV=production)
   ssh root@<ip>
   curl -fsSLO https://raw.githubusercontent.com/ashmitahaldar/road-diet/main/deploy/setup.sh
   bash setup.sh <domain>
   install -m 600 -o roaddiet -g roaddiet /root/road-diet.env /opt/road-diet/.env && systemctl restart road-diet
   ```

`setup.sh` installs Node 22, Caddy and git, clones the repo to `/opt/road-diet`, builds it, and starts the `road-diet` systemd service behind Caddy. Caddy gets the HTTPS certificate once DNS points at the server.

Redeploy after merging to `main`: `ssh root@<ip> bash /opt/road-diet/deploy/setup.sh <domain>`.

Check: `curl https://<domain>/api/health` returns `{"ok":true}`. Logs: `journalctl -u road-diet -n 50`.
