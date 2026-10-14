# Despliegue en el VPS

El juego se publica como **SPA estática** en:

- **URL:** https://towers.dagobasoft.com
- **VPS:** `dagoba-server` (`64.23.217.27`), acceso `ssh dagoba` (root).

No hay contenedor ni PHP: es una app estática. El reverse proxy
(`dagoba-infra`, Nginx) sirve el build directamente desde el montaje
`/opt/dagoba/apps` → `/var/www/apps:ro`. Encaja en la excepción de apps
estáticas de la plataforma (ver `dagoba-infra/devdocs/arquitectura-plataforma.md` §8).

## Dónde vive cada cosa

| Elemento | Ruta |
|---|---|
| Build servido | `/opt/dagoba/apps/tower-defense/dist/` (en el VPS) |
| Vhost de Nginx | `dagoba-server-infra` → `nginx/conf.d/15-tower-defense.conf` |
| Config viva en el VPS | `/opt/dagoba/infra/nginx/conf.d/15-tower-defense.conf` |
| Certificado TLS | comodín `*.dagobasoft.com` (`/etc/letsencrypt/live/dagobasoft.com/`) |

El **código no vive en el VPS**: solo se sube el contenido de `dist/`

- El DNS comodín (`*.dagobasoft.com → 64.23.217.27`) y el certificado comodín ya
  cubren el subdominio, así que no hay que tocar DNS ni TLS al redeployar.

## Redeploy manual

```bash
# 1) Build de producción (desde ~/dev/tower-defense)
npm run build

# 2) Subir solo el build al VPS
ssh dagoba 'mkdir -p /opt/dagoba/apps/tower-defense/dist'
rsync -avz --delete ~/dev/tower-defense/dist/ dagoba:/opt/dagoba/apps/tower-defense/dist/

# 3) (solo si cambió el vhost) traer cambios de infra y validar
ssh dagoba 'cd /opt/dagoba/infra && git pull --ff-only'
ssh dagoba 'cd /opt/dagoba/infra && docker compose exec -T reverse-proxy nginx -t'
ssh dagoba 'cd /opt/dagoba/infra && docker compose exec -T reverse-proxy nginx -s reload'
```

Recargar Nginx **no** afecta a las demás apps; el montaje de `apps` es vivo, así
que los archivos nuevos de `dist/` se sirven sin reiniciar nada. Solo hace falta
el `reload` cuando se **añade o edita un vhost**.

## Verificación

```bash
curl -I https://towers.dagobasoft.com/            # 200
curl -I https://towers.dagobasoft.com/assets/     # asset con hash -> 200
curl -I http://towers.dagobasoft.com/             # 301 -> https
```

## Rollback

```bash
ssh dagoba 'rm /opt/dagoba/infra/nginx/conf.d/15-tower-defense.conf'
ssh dagoba 'cd /opt/dagoba/infra && docker compose exec -T reverse-proxy nginx -s reload'
# El código en /opt/dagoba/apps/tower-defense se elimina aparte, de forma explícita.
```

El vhost vive en el repo `dagoba-server-infra`; para revertirlo de forma
permanente, borra `nginx/conf.d/15-tower-defense.conf` en el repo, commitea y
despliega.
