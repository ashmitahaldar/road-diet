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

## Run in production

```bash
npm run build
NODE_ENV=production npm start   # one process serves the game and /api on $PORT (default 3000)
```

Copy `.env.example` to `.env` for local secrets. Never commit `.env`.

## Deploy (Vultr + Caddy)

One-time setup:

1. Create a Vultr instance running Ubuntu 24.04 (the smallest plan is enough) and note its IP.
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
