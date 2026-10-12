# Cambios de HUD y balance del juego

**Fecha:** 2026-10-12  
**Estado:** cambios documentados; falta validación en navegador y ejecución local de pruebas.

## Objetivo

Mantener una dificultad exigente pero superable y corregir la interacción para mejorar torretas sin que el botón desaparezca durante el clic.

## Corrección del botón de mejora

Archivo: `src/render/hud.ts`

- Los botones de acción de la torre seleccionada se conservan en el DOM entre fotogramas.
- El panel de selección solo se reconstruye cuando cambia la torre seleccionada, su nivel o la inversión registrada.
- El botón de mejora mantiene el manejador `onUpgrade`; el panel actualiza el coste y las estadísticas al cambiar de nivel.
- Se conserva la comprobación de oro disponible y el límite de nivel máximo.
- Motivo: reconstruir el panel en cada actualización del HUD podía separar el botón del DOM antes de que el navegador despachara el evento de clic.

## Balance actual relevante

Fuentes: `src/config/waves.ts`, `src/config/enemies.ts` y `src/config/towers.ts`.

- La vida de los enemigos aumenta un **10 % por oleada**: `hpMultiplier(wave) = 1.10^(wave - 1)`.
- La velocidad aumenta un **2 % por oleada**, con multiplicador máximo de **1.8**.
- La recompensa de oleada escala con `1 + 0.05 × (oleada - 1)`; además, el bono de finalización es `20 + 5 × oleada`.
- Los jefes aparecen cada cinco oleadas. Su vida base actual es **600**, velocidad **30**, armadura **6** y recompensa **80**.
- La torreta Flecha cuesta **50** de oro; sus mejoras cuestan **40** y **80**. El oro inicial conocido para la prueba inicial es **100**, por lo que permite comenzar con dos torretas Flecha.
- Las torretas se desbloquean progresivamente: Cañón en oleada 2, Escarcha en la 3, Francotirador en la 6 y Tesla en la 10.

## Observaciones de pruebas y límites

- En una prueba de la primera oleada con dos torretas Flecha en las posiciones (7, 8) y (13, 8), el resultado registrado fue **20/20 vidas**, **155 de oro final**, **cero enemigos escapados** y **cero disparos desperdiciados**.
- Una simulación aproximada posterior llegó a perder en la oleada 10. No constituye una verificación exhaustiva de las 20 oleadas ni demuestra que la partida completa sea imposible.
- Se observó como posible problema que la selección de objetivos pueda duplicar disparos sobre un mismo enemigo y desperdiciar daño. Debe comprobarse con pruebas específicas antes de cambiar la lógica de targeting.
- El objetivo de diseño es que la partida sea desafiante, pero no dependa de una estrategia matemáticamente inviable ni de acertar una colocación única.

## Validación pendiente

En local, ejecutar:

```bash
npm test
npm run typecheck
npm run build
```

Después, comprobar manualmente:
1. Seleccionar una torre durante la fase de construcción y mejorarla.
2. Confirmar que el nivel y las estadísticas cambian y que el oro se descuenta una sola vez.
3. Confirmar que el botón se deshabilita si no hay oro suficiente y al alcanzar el nivel máximo.
4. Repetir una mejora durante una oleada y verificar que el panel sigue respondiendo.
5. Jugar varias oleadas observando oro, fugas, selección de objetivos y dificultad.

**Importante:** no se deben considerar las 20 oleadas verificadas hasta completar una partida real o una simulación automatizada reproducible.
