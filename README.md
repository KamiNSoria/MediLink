# MediLink

Red distribuida de triaje y abastecimiento hospitalario. Proyecto integrador de Sistemas Distribuidos (UDLA).

Cada hospital es un nodo autónomo que se comunica con los demás mediante eventos para armar el **combo vital**: una cama en un hospital + la medicina que el paciente necesita desde otro.

> Estado actual: **prototipo del front** con datos simulados, para explicar la idea. No hay backend.

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
