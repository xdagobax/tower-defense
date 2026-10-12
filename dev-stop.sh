#!/usr/bin/env bash
set -euo pipefail

systemctl --user stop tower-defense-dev 2>/dev/null || true
systemctl --user reset-failed tower-defense-dev 2>/dev/null || true
echo "Servidor de desarrollo detenido."
