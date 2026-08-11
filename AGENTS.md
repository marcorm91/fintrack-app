# Fintrack — instrucciones de trabajo

## Flujo de Git y pull requests

- Parte siempre de `main` actualizado para iniciar una tarea nueva.
- Crea una rama y una pull request por cambio. No reutilices ni modifiques una PR que ya esté fusionada o cerrada.
- Antes de abrir una PR, comprueba que la rama no arrastra commits ni cambios ajenos.
- Cada PR debe explicar qué cambia, qué se ha validado y cualquier decisión relevante.
- Antes de solicitar la PR, ejecuta `npm run check` y corrige los fallos relacionados con el cambio.
- Revisa referencias, imports, hooks, tipos, traducciones y archivos que hayan quedado sin uso. Elimina el código residual en la misma PR cuando sea seguro hacerlo.
- No fuerces actualizaciones de rama ni reescribas historial sin indicación expresa.

## Convención de commits

Usa un mensaje corto, descriptivo y con ámbito obligatorio:

```text
Tipo(ámbito): descripción en minúsculas
```

Tipos permitidos:

- `Feat`: nueva funcionalidad.
- `Fix`: corrección de un error.
- `Refactor`: mejora interna sin cambio funcional.
- `Docs`: documentación.
- `Test`: pruebas.
- `Chore`: mantenimiento, configuración o dependencias.
- `Style`: formato o estilos sin cambiar la lógica.

Ejemplos:

```text
Feat(monthly-recap): simplifica la comparación mensual
Fix(settings-dialog): corrige la capa de los modales anidados
Refactor(insights): elimina el hook mensual sin uso
Docs(readme): actualiza los enlaces de la release
Chore(release): prepara la versión 3.1.0
```

## Releases

- Actualiza la versión solo cuando el cambio vaya a publicarse como release.
- En una release, mantén alineados `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` y `README.md`.
- Actualiza en el README los enlaces y el texto de la nueva versión.
- Crea y publica el tag únicamente después de fusionar la PR en `main`.
- No modifiques ni reutilices un tag ya publicado: prepara una versión posterior.

## Producto y calidad

- Fintrack es una app local-first, sencilla y privada. Evita añadir complejidad que no aporte valor claro.
- Prioriza mobile, accesibilidad y una interfaz clara antes que añadir más datos o tarjetas.
- Usa lenguaje cercano y humano; evita tecnicismos, porcentajes y métricas redundantes en la vista principal.
- Mantén el detalle disponible bajo demanda cuando sea útil.
- Si el cambio es visual, no alteres la lógica financiera, los datos guardados ni las importaciones/exportaciones.
- Comprueba los estados vacíos, los flujos de error y los modales, especialmente en móvil.
