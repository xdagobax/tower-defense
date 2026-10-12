#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

NPM="$(command -v npm || true)"
NODE="$(command -v node || true)"
if [ -z "$NPM" ] || [ -z "$NODE" ]; then
  echo "No encuentro node/npm en el PATH. Abre la terminal con nvm cargado." >&2
  exit 1
fi
NODE_DIR="$(dirname "$NODE")"

LOG="${TMPDIR:-/tmp}/tower-defense-dev.log"
: > "$LOG"

systemctl --user stop tower-defense-dev 2>/dev/null || true
systemctl --user reset-failed tower-defense-dev 2>/dev/null || true

systemd-run --user --unit=tower-defense-dev --collect \
  -p WorkingDirectory="$PWD" \
  -p "Environment=PATH=$NODE_DIR:/usr/local/bin:/usr/bin:/bin" \
  -p "StandardOutput=file:$LOG" \
  -p "StandardError=file:$LOG" \
  "$NPM" run dev >/dev/null

sleep 2
URL="$(grep -oE 'http://127\.0\.0\.1:[0-9]+/' "$LOG" | tail -1 || true)"
echo "Servidor de desarrollo en marcha${URL:+: $URL}"
