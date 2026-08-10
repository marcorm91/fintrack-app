<p align="center">
  <img src="public/app-icon.svg" alt="Fintrack" width="96" height="96" />
</p>

# Fintrack

Fintrack es una app *offline-first* para controlar ingresos, gastos, efectivo, patrimonio e histórico mensual. Funciona con SQLite en local y, de forma opcional, puede sincronizarse con Firebase para usar los mismos datos en varios dispositivos.

## Descargas

- Windows instalador: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_x64-setup.exe)
- Windows MSI: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_x64_en-US.msi)
- Windows portable ZIP: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_portable_windows.zip)
- macOS Apple Silicon: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_aarch64.dmg)
- Linux AppImage: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_amd64.AppImage)
- Linux DEB: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_amd64.deb)
- Linux RPM: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9-1.x86_64.rpm)
- Android APK: [Fintrack 3.0.9](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.9/Fintrack_3.0.9_android.apk)

Los enlaces estarán disponibles cuando se publique la release `v3.0.9`.

## Qué incluye

- Vista mensual, anual e histórica.
- Importación desde CSV o texto pegado.
- Exportación CSV, SQL y backup JSON.
- Compartir backup JSON desde Android con el menú nativo del sistema.
- Gráficas de efectivo, beneficio y patrimonio.
- Modo local sin cuenta.
- Modo cloud con Firebase Authentication y Firestore.
- Sincronización automática y resolución explícita de conflictos.
- PIN local de emergencia para trabajar sin Firebase si ya estaba configurado.
- Cartera de inversión opcional.
- Notas mensuales e interfaz responsive.

## Modos de uso

**Local**: no requiere cuenta ni conexión. Los datos quedan en una base SQLite del dispositivo.

**Cloud oficial**: usa la infraestructura Firebase privada de la distribución oficial. No hay registro público desde la app; el acceso se autoriza de forma individual.

**Cloud propio**: puedes bifurcar el repo, crear tu propio proyecto Firebase, sustituir la configuración y publicar `firestore.rules`.

## Rutas de datos

En escritorio, Fintrack guarda datos y configuración en las rutas estándar de Tauri/WebView del usuario. En Windows suelen estar aquí:

```text
C:\Users\<usuario>\AppData\Roaming\com.fintrack.app
C:\Users\<usuario>\AppData\Local\com.fintrack.app
```

La base SQLite por defecto se llama:

```text
finanzas.db
```

En Windows portable, si existe `fintrack.portable` junto a `fintrack-app.exe`, la base se crea junto al ejecutable:

```text
fintrack-app.exe
fintrack.portable
finanzas.db
```

Android usa el almacenamiento interno protegido de la app.

## Copias de seguridad

El formato recomendado es **Backup JSON** desde:

```text
Ajustes > Tus datos > Exportar copia
```

Ese JSON sirve para migrar a otro dispositivo o conservar una copia externa. En Android también puedes usar **Compartir copia** para enviarlo a Telegram, WhatsApp, Drive u otra app compatible.

## Desarrollo

Requisitos:

- Node.js 20+
- Rust y dependencias de Tauri

Instalación:

```bash
npm install
```

Comandos habituales:

```bash
npm run dev
npm run tauri dev
npm run check
npm run build
npm run tauri build
```

Datos simulados:

```bash
npm run dev:mocks
npm run tauri:dev:mocks
```

Los mocks usan `finanzas.mocks.db` y no modifican `finanzas.db`.

## Estructura

```text
src/          UI, hooks, features, servicios, utils y traducciones
src-tauri/    configuración y código nativo Tauri
scripts/      utilidades de build Android y mocks
firestore.rules reglas de seguridad para Firestore
```

## Releases

Al publicar un tag `v*`, por ejemplo `v3.0.9`, GitHub Actions genera los paquetes de Windows, macOS, Linux y Android, y crea la release con sus artefactos.

## Licencia

MIT. Ver `LICENSE`.
