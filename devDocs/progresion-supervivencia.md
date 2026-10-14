# Progresión permanente y supervivencia

## Integración

- Oleadas ilimitadas: no hay una victoria global ni una oleada final.
- Cada nivel conserva su récord y tiene una meta de desbloqueo: nivel 1 = oleada 10; cada nivel suma cinco oleadas a la meta.
- Alcanzar la meta desbloquea el siguiente nivel, pero la partida puede continuar. Los niveles desbloqueados se pueden seleccionar para volver a jugar.
- La dificultad aumenta por nivel y por oleada.

## Experiencia y mejoras

Se obtiene experiencia al eliminar enemigos y completar oleadas. Las primeras tres oleadas del nivel 1 dan poca experiencia por enemigo. La experiencia crece con la oleada y el nivel.

Mejoras disponibles: oro inicial, oro por enemigo, daño por tipo de torreta y cadencia por tipo de torreta. Coste inicial de 100 XP; cada compra de la misma mejora incrementa el siguiente precio un 50 %. Los efectos están limitados a 30 % y a diez compras por mejora.

## Guardado y reinicio

- XP, mejoras, récords, niveles desbloqueados, nivel elegido y estado de partida se guardan en `localStorage`.
- Los guardados versión 1 se leen y migran a versión 2 al guardar.
- **Reiniciar nivel** restablece oleada, oro, vidas, torres y enemigos, conservando todo el progreso permanente.
- **Juego nuevo** solicita confirmación y borra todo el progreso.

## Verificación local

```bash
npm run typecheck
npm run test
npm run build
```
