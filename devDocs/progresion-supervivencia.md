# Progresión permanente y supervivencia

## Estado

Este documento especifica las reglas de progresión. Las funciones puras iniciales están en `src/config/progression.ts` y sus contratos en `tests/progression.test.ts`. La integración con el ciclo del juego, el HUD y el guardado debe completarse antes de considerar terminado el sistema.

## Niveles y supervivencia

- No existe un nivel máximo ni una última oleada global.
- Cada nivel tiene una meta de supervivencia. La meta inicial es la oleada 10 y aumenta cinco oleadas por nivel.
- Superar la meta desbloquea el siguiente nivel. Los niveles previos siguen seleccionables.
- Cada nivel conserva su récord de oleada por separado.
- La dificultad aumenta por nivel; los parámetros definitivos deben validarse jugando.

## Experiencia

- La experiencia es progreso permanente, independiente del oro de una partida.
- Las primeras tres oleadas del nivel inicial otorgan experiencia mínima o nula por enemigo.
- La experiencia crece moderadamente con el número de nivel y las oleadas avanzadas.
- Volver a niveles anteriores permite conseguir experiencia, pero repetir el inicio no debe ser la estrategia más rentable.

## Mejoras permanentes

Los identificadores admitidos son daño, cadencia, oro inicial y oro por enemigo. Daño y cadencia se identifican por arma, por ejemplo `damage:arrow` y `fireRate:sniper`; comprar una mejora no modifica otras armas.

- Coste base: 100 XP.
- Cada compra de la misma mejora incrementa su siguiente coste un 50 %: 100, 150, 225, 338...
- Los efectos de combate son pequeños (3 % por nivel) y tienen un límite inicial del 30 %.
- El precio y nivel comprado son independientes para cada mejora y arma.

## Reinicio y guardado

- Reiniciar nivel reinicia solamente el estado temporal de la partida: oro, vidas, torres, enemigos y oleada actual.
- Iniciar juego nuevo reinicia explícitamente experiencia, mejoras permanentes, récords y desbloqueos, con confirmación.
- Experiencia, mejoras, récords y niveles desbloqueados deben persistir en `localStorage`.
- Reiniciar nivel no debe borrar el guardado permanente.

## Verificación local

```bash
npm run typecheck
npm run test
npm run build
```

Las pruebas iniciales comprueban escalado de experiencia, aumento del precio por compra, mejoras independientes por arma, topes de bonificación y desbloqueo/record de niveles. La integración final debe añadir pruebas de persistencia y de reinicio de partida/nivel.
