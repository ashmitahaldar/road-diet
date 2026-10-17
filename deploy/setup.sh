#!/usr/bin/env bash
# First install and every redeploy on Ubuntu 24.04, as root: bash setup.sh <domain>
set -euo pipefail

DOMAIN=${1:?usage: bash setup.sh <domain>}
REPO=${REPO:-https://github.com/ashmitahaldar/road-diet.git}
BRANCH=${BRANCH:-main}
APP=/opt/road-diet

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q git curl gnupg debian-keyring debian-archive-keyring apt-transport-https

if [[ "$(node -v 2>/dev/null)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi

if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get install -y -q caddy
fi

id roaddiet >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/roaddiet --shell /usr/sbin/nologin roaddiet

if [[ -d $APP/.git ]]; then
  git -C "$APP" fetch -q origin "$BRANCH"
  git -C "$APP" checkout -q "$BRANCH"
  git -C "$APP" reset -q --hard "origin/$BRANCH"
else
  git clone -q --branch "$BRANCH" "$REPO" "$APP"
fi
touch "$APP/.env"
chmod 600 "$APP/.env"
chown -R roaddiet:roaddiet "$APP"
runuser -l roaddiet -s /bin/bash -c "cd $APP && npm ci --no-audit --no-fund && npm run build"

install -m 644 "$APP/deploy/road-diet.service" /etc/systemd/system/road-diet.service
sed "s|{\$DOMAIN}|$DOMAIN|" "$APP/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then ufw allow 80,443/tcp; fi

systemctl daemon-reload
systemctl enable road-diet caddy
systemctl restart road-diet
systemctl reload-or-restart caddy

for _ in $(seq 20); do
  curl -fsS localhost:3000/api/health && echo && echo "Road Diet is running. Open https://$DOMAIN" && exit 0
  sleep 1
done
echo "Server did not answer on :3000. Check: journalctl -u road-diet -n 50" >&2
exit 1
