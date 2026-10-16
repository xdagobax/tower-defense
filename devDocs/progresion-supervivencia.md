# Progresión permanente y supervivencia

## Integración

- Oleadas ilimitadas: no hay una victoria global ni una oleada final.
- Cada nivel conserva su récord y tiene una meta de desbloqueo: nivel 1 = oleada 10; cada nivel suma cinco oleadas a la meta.
- Alcanzar la meta desbloquea el siguiente nivel, pero la partida puede continuar. Los niveles desbloqueados se pueden seleccionar para volver a jugar.
- La dificultad aumenta de forma compuesta por nivel: cada nivel multiplica por 1,4 la resistencia base y la velocidad de los enemigos, con el límite de velocidad ya definido por el sistema de aparición. El nivel 2 supone un salto deliberadamente importante para que las mejoras permanentes importen.
- El oro de partida, las torres, las vidas y los enemigos se reinician al comenzar o seleccionar un nivel. El oro de una partida no se transfiere a otra; solo persisten la experiencia y las mejoras permanentes compradas con ella.

## Experiencia y mejoras

Se obtiene experiencia al eliminar enemigos y completar oleadas. Las primeras tres oleadas dan poca experiencia por enemigo, por lo que avanzar en el nivel 1 y volver a intentarlo permite reunir experiencia para mejorar la estrategia antes de afrontar niveles posteriores.

Mejoras disponibles: oro inicial, oro por enemigo, daño por tipo de torreta y cadencia por tipo de torreta. Coste inicial de 100 XP; cada compra de la misma mejora incrementa el siguiente precio un 50 %. Los efectos están limitados a 30 % y a diez compras por mejora. La mejora de oro inicial aumenta el oro de inicio, pero no conserva oro de partidas anteriores.

## Guardado y reinicio

- XP, mejoras, récords, niveles desbloqueados, nivel elegido y estado de partida se guardan en `localStorage`.
- Los guardados versión 1 se leen y migran a versión 2 al guardar.
- **Reiniciar nivel** restablece oleada, oro inicial, vidas, torres y enemigos, conservando todo el progreso permanente.
- **Juego nuevo** solicita confirmación y borra todo el progreso.

## Verificación local

```bash
npm run typecheck
npm run test
npm run build
```
