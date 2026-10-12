# AGENTS.md — tower-defense

Reglas para agentes que trabajen en este proyecto. Sustituye a `~/dev/AGENTS.md`
(ese es para otros proyectos del directorio `~/dev`).

## Qué es

Juego de defensa de torres en blanco y negro, centrado en el funcionamiento, no en los
gráficos. Torretas y enemigos son figuras geométricas dibujadas en canvas.

## Stack

- **Vite + TypeScript + Canvas 2D.** Sin motor gráfico ni dependencias de runtime.
- **Vitest** para pruebas de la lógica.
- `localStorage` para el guardado.

## Comandos (ejecutar desde la raíz del proyecto)

```bash
npm install
npm run dev        # servidor de desarrollo en 127.0.0.1 (NO exponer fuera de loopback)
npm run build      # tsc --noEmit + build de producción
npm run test       # Vitest
npm run typecheck  # sólo comprobación de tipos
```

Antes de dar una tarea por terminada: `npm run typecheck` y `npm run test` en verde.
Si tocaste render/UI, verifica además con `npm run build`.

## Estructura

```
src/
  config/       balance y datos: map.ts, towers.ts, enemies.ts, waves.ts
  core/         loop.ts (fixed timestep), math.ts, rng.ts (semilla)
  state.ts      tipos de entidades y GameState
  systems/      spawn, movement, targeting, combat, economy (lógica pura)
  render/       renderer.ts (canvas), shapes.ts, hud.ts (overlay HTML)
  input/        input.ts (ratón/teclado)
  persistence/  save.ts
  game.ts       orquestación del juego (clase Game)
  main.ts       arranque
tests/          pruebas unitarias de la lógica
index.html      layout + estilos + HUD
```

## Convenciones

- **Idioma:** textos de UI en español; identificadores de código (variables, funciones,
  tipos) en inglés.
- **Sin comentarios** salvo que aporten algo no obvio.
- **Balance en `src/config/`**: cualquier número ajustable (costes, daño, escalado,
  oleadas, camino) vive ahí, no incrustado en la lógica. Así se puede testear y tunear.
- **Lógica pura y testeable en `src/systems/`**: reciben datos y devuelven resultados;
  evita acoplarla al canvas o al DOM. Las pruebas van en `tests/`.
- **Canvas sólo para el campo de juego.** El HUD son elementos HTML/CSS en `index.html`
  actualizados por `render/hud.ts`.
- Mantén el estilo de dibujo en blanco y negro con figuras geométricas; no añadas assets
  ni imágenes.
- Un tipo de torreta/enemigo nuevo se define en `config/` y, si necesita comportamiento
  especial, en `systems/`. No metas casos especiales dispersos por `game.ts`.

## Reglas de git

- `git status` limpio es el punto de retorno. No se empieza a tocar código con cambios
  sin commitear.
- `node_modules/` y `dist/` están en `.gitignore`; nunca los commitees.
- Commits pequeños y descriptivos; no commitear si no te lo piden explícitamente.

## Notas

- En desarrollo, `window.__game` expone la instancia de `Game` (sólo con `import.meta.env.DEV`)
  para depurar desde la consola o con Playwright.
- La victoria es en la oleada 20 (`VICTORY_WAVE` en `game.ts`).
