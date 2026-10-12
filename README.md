# Defensa de Torres

Juego de defensa de torres (tower defense) minimalista en blanco y negro. El foco está
en el funcionamiento, no en los gráficos: torretas y enemigos son figuras geométricas.

## Cómo jugar

- Los enemigos salen del punto de origen y recorren el camino hasta tu base.
- Coloca torretas en las celdas libres (no en el camino) para destruirlos.
- Cada enemigo que llega a la base resta vidas. Si llegan a 0, pierdes.
- Sobrevive a 20 oleadas para ganar. Cada oleada los enemigos son más fuertes.
- Las torretas se desbloquean al avanzar de oleada y se pueden mejorar (3 niveles) o vender.

### Controles

| Acción | Ratón / teclado |
|---|---|
| Colocar torreta | Clic en una celda libre (con una torreta seleccionada en la lista) |
| Seleccionar torreta colocada | Clic sobre ella |
| Elegir tipo de torreta | `1`-`5` o botones del panel |
| Iniciar oleada | `Espacio` o botón |
| Pausa | `P` |
| Velocidad x1/x2/x3 | `F` |
| Cancelar selección | Clic derecho |

## Torretas

| Tecla | Nombre | Símbolo | Rol |
|---|---|---|---|
| 1 | Flecha | triángulo | equilibrada, un objetivo |
| 2 | Cañón | cuadrado | daño en área |
| 3 | Escarcha | círculo | ralentiza |
| 4 | Francotirador | rombo | largo alcance, mucho daño |
| 5 | Tesla | hexágono | rayo en cadena |

## Tecnología

- **Vite + TypeScript + Canvas 2D**. Sin motor gráfico ni dependencias de runtime.
- **Vitest** para las pruebas de la lógica (oleadas, economía, targeting, combate, movimiento).
- Progreso guardado en `localStorage`.

## Estructura

```
src/
  config/     balance y datos: map, towers, enemies, waves
  core/       bucle de juego, matemáticas, RNG con semilla
  entities... tipos en state.ts; lógica en systems/
  systems/    spawn, movement, targeting, combat, economy
  render/     renderer (canvas), shapes, hud
  input/      ratón y teclado
  persistence/ guardado local
  game.ts     orquestación del juego
  main.ts     arranque
tests/        pruebas unitarias de la lógica
```

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo en 127.0.0.1
npm run build      # verificación de tipos + build de producción
npm run test       # pruebas
npm run typecheck  # sólo comprobación de tipos
```

## Ajuste de dificultad

Todo el balance vive en `src/config/`:

- `waves.ts`: número y composición de enemigos, y multiplicadores de vida/velocidad/recompensa.
- `enemies.ts`: estadísticas base por tipo de enemigo.
- `towers.ts`: costes, niveles y estadísticas de cada torreta y su oleada de desbloqueo.
- `map.ts`: tamaño de la rejilla y recorrido del camino.
