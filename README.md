# MediLink

Red distribuida de triaje y abastecimiento hospitalario. Proyecto integrador de Sistemas Distribuidos (UDLA).

Cada hospital es un nodo autónomo que se comunica con los demás mediante eventos para armar el **combo vital**: una cama en un hospital + la medicina que el paciente necesita desde otro.

> Estado actual: **prototipo del front** con datos simulados, para explicar la idea. No hay backend.

## Cómo ver el prototipo

Abre `dashboard/index.html` en el navegador (doble clic), o en VS Code con la extensión **Live Server** (clic derecho > *Open with Live Server*).

Qué mostrar:

1. **+ Paciente crítico**: el paciente llega a un hospital, los demás ofrecen cama y medicina, y la red propone el combo.
2. **Aprobar traslado**: se descuenta el inventario y se dibuja el traslado en el mapa.
3. Esperar 30 s sin aprobar: la reserva expira (TTL) y se libera sola.
4. **Simular caída** (o clic en un nodo): la red sigue funcionando sin ese hospital; al volver, sincroniza los eventos que se perdió.

## Flujo de ramas

| Rama | Uso |
|---|---|
| `main` | Versión estable. Solo recibe merges desde `dev` cuando hay una versión lista (se etiqueta `v0.1.0`, `v0.2.0`, ...). |
| `dev` | Integración. Aquí se juntan las funcionalidades terminadas. |
| `feature/<nombre>` | Una rama por funcionalidad, creada desde `dev` y fusionada de vuelta a `dev` al terminar. |
| `fix/<nombre>` | Corrección de errores, desde `dev`. |

```bash
# empezar una funcionalidad
git checkout dev
git pull
git checkout -b feature/mi-funcionalidad

# al terminar: subir y abrir Pull Request hacia dev en GitHub
git push -u origin feature/mi-funcionalidad
```

### Mensajes de commit

Formato corto con prefijo: `feat:` nueva funcionalidad · `fix:` corrección · `docs:` documentación · `style:` estilos · `refactor:` reorganizar código · `chore:` tareas varias.

Ejemplo: `feat: animación de eventos en el mapa`
