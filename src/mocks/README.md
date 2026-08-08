# Mocks de desarrollo

Estos datos se usan solo en modo desarrollo para ver la interfaz con histórico, cartera y patrimonio.

Para arrancar la app usando siempre mocks:

```bat
npm run dev:mocks
```

Para ejecutar la aplicación Tauri con la misma base aislada:

```bash
npm run tauri:dev:mocks
```

Estos comandos usan `finanzas.mocks.db` y la vuelven a rellenar en cada arranque. No usan `finanzas.db` ni una ruta de base de datos guardada en ajustes.

La app los carga únicamente si se cumplen estas condiciones:

- `import.meta.env.DEV` es `true`.
- `VITE_USE_MOCK_DB` es `true`.
- `VITE_SEED_MOCKS` no está definido como `false`.

En builds de producción no deben sembrar datos.
