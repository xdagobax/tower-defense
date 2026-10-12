# Comandos — tower-defense

Servidor de desarrollo como servicio de usuario de systemd (`tower-defense-dev`).
Sobrevive a cerrar la terminal. Escucha en `127.0.0.1:5174` (no `5173`, que lo
ocupa el contenedor `dagoba-dev-app-1`).

## Dónde ejecutar

Todos los comandos van en la **terminal de VS Code conectada al host Linux**
(Remote-SSH), que es donde corre el juego y donde existe `systemctl --user`.
No valen PowerShell, CMD ni Git Bash de tu Windows local.

## Arrancar / relanzar

```bash
cd ~/dev/tower-defense && ./dev-start.sh
```

Qué hace: para el servicio si estaba activo, limpia el estado `failed` y lo vuelve
a lanzar. Al terminar imprime la URL.

## Detener

```bash
cd ~/dev/tower-defense && ./dev-stop.sh
```

Cerrar la terminal **no** lo detiene; hay que usar este script (o el comando de
systemd de abajo).

## Abrir el juego

```bash
cd ~/dev/tower-defense && ./dev-start.sh && xdg-open http://127.0.0.1:5174/
```

O abre a mano en el navegador: http://127.0.0.1:5174/

## Ver estado

```bash
systemctl --user status tower-defense-dev
```

## Ver el log en vivo

```bash
tail -f /tmp/tower-defense-dev.log
```

## Comandos directos (sin scripts)

```bash
# detener
cd ~/dev/tower-defense && systemctl --user stop tower-defense-dev

# limpiar estado failed
cd ~/dev/tower-defense && systemctl --user reset-failed tower-defense-dev

# relanzar (equivale a dev-start.sh)
cd ~/dev/tower-defense && . "$HOME/.nvm/nvm.sh" && systemd-run --user \
  --unit=tower-defense-dev --collect \
  -p WorkingDirectory="$PWD" \
  -p "Environment=PATH=$(dirname "$(command -v node)"):/usr/local/bin:/usr/bin:/bin" \
  -p StandardOutput=file:/tmp/tower-defense-dev.log \
  -p StandardError=file:/tmp/tower-defense-dev.log \
  "$(command -v npm)" run dev
```

## Desarrollo normal (sin servicio)

Si sólo lo quieres mientras tengas la terminal abierta:

```bash
cd ~/dev/tower-defense && npm run dev
```

Se cierra al pulsar `Ctrl+C` o al cerrar la terminal.

## Otros

```bash
cd ~/dev/tower-defense && npm run typecheck   # tipos
cd ~/dev/tower-defense && npm run test        # pruebas
cd ~/dev/tower-defense && npm run build       # build de producción
```
