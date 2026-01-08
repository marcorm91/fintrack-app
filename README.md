# Fintrack

Aplicacion para control mensual/anual de finanzas personales con graficas, tablas e importacion de datos.

## Caracteristicas
- Vista mensual, anual e historico.
- Importacion desde CSV o pegado de texto.
- Graficas de barras/linea con control de series visibles.
- Ordenacion de columnas en tablas.
- Idiomas ES/EN.
- Datos locales con SQLite (Tauri plugin).
- Filtros por rango y paginacion en historico.
- Configuracion de ruta de base de datos desde la app.

## Descargas
- Windows (instalador .exe): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0_x64-setup.exe)
- Windows (MSI): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0_x64_en-US.msi)
- macOS (Apple Silicon, .dmg): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0_aarch64.dmg)
- Linux (AppImage): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0_amd64.AppImage)
- Linux (DEB): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0_amd64.deb)
- Linux (RPM): [Fintrack 0.1.0](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_0.1.0-1.x86_64.rpm)

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)
- Tauri 2 + SQLite plugin

## Requisitos
- Node.js 18+ (o 20+)
- Rust toolchain y dependencias de Tauri

Guia de requisitos de Tauri: https://tauri.app

## Instalacion
```bash
npm install
```

## Lint
```bash
npm run lint
```

## Desarrollo web
```bash
npm run dev
```

## Desarrollo desktop (Tauri)
```bash
npm run tauri dev
```

## Build
```bash
npm run build
npm run tauri build
```

## Distribucion (sin firma)
Si compartes el .exe desde el repo, Windows puede mostrar advertencias (SmartScreen).
Recomendado:
- Publicar en GitHub Releases con nota de que es una app sin firma.
- Ofrecer un ZIP con el ejecutable.
- Incluir un checksum SHA256 para verificar integridad.

Ejemplo para generar checksum:
```bash
Get-FileHash -Algorithm SHA256 .\src-tauri\target\release\fintrack-app.exe
```

## Datos y ubicacion
En Windows, la base de datos se guarda por defecto en:
`C:\Users\<usuario>\AppData\Roaming\com.fintrack.app\finanzas.db`.

Desde la app puedes abrir la configuracion y elegir otra carpeta o archivo `.db`.

## Importacion CSV
Admite coma o punto y coma como delimitador. El importador intenta detectar cabeceras en ES/EN.

Cabeceras reconocidas:
- mes: `mes`, `month`, `fecha`
- ano: `year`, `ano`
- ingresos: `income`, `ingresos`
- gastos: `expense`, `gastos`
- saldo: `balance`, `saldo`, `acumulacion`, `saldo al cierre`, `saldo cierre`

Formatos de mes aceptados:
- `YYYY-MM` o `YYYY/MM`
- `MM-YYYY` o `MM/YYYY`
- `ene 2025`, `enero 2025`, `jan 2025`, etc.

Notas:
- En vista mensual se espera una sola fila (si no se incluye la columna de mes).
- Si se repite un mes en la importacion, se sobrescribe el snapshot de ese mes.

## Estructura del proyecto
- `src/`: UI, hooks, features, utils y locales.
- `src-tauri/`: codigo desktop, configuracion y build.

## CI / Releases
Al subir un tag `v*` (por ejemplo `v0.1.0`), GitHub Actions genera builds para Windows/macOS/Linux y crea un release en borrador.

## Licencia
MIT. Ver `LICENSE`.
