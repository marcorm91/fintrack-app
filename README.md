# Fintrack

Aplicación para control mensual/anual de finanzas personales con gráficas, tablas e importación de datos.

> **Motivación**  
> Este proyecto nace de una necesidad personal: dejar de gestionar mis finanzas en hojas de Excel que con el tiempo se volvieron difíciles de mantener, propensas a errores y poco prácticas para analizar el histórico.  
> Fintrack surge como una alternativa local, sencilla y mantenible para controlar ingresos, gastos y saldo acumulado sin depender de herramientas externas.

## Características
- Vista mensual, anual e histórico.
- Importación desde CSV o pegado de texto.
- Exportación CSV y SQL desde ajustes.
- Gráficas de barras/línea con control de series visibles.
- Ordenación de columnas en tablas.
- Idiomas ES/EN.
- Datos locales con SQLite (Tauri plugin).
- Filtros por rango y paginación en histórico.
- Configuración de ruta de base de datos desde la app.

## Descargas
- Windows (instalador .exe): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_x64-setup.exe)
- Windows (MSI): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_x64_en-US.msi)
- Windows (portable .zip): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_portable_windows.zip)
- macOS (Apple Silicon, .dmg): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_aarch64.dmg)
- Linux (AppImage): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_amd64.AppImage)
- Linux (DEB): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5_amd64.deb)
- Linux (RPM): [Fintrack 1.0.5](https://github.com/marcorm91/fintrack-app/releases/latest/download/Fintrack_1.0.5-1.x86_64.rpm)

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)
- Tauri 2 + SQLite plugin

## Requisitos
- Node.js 18+ (o 20+)
- Rust toolchain y dependencias de Tauri

Guía de requisitos de Tauri: https://tauri.app

## Instalación
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

## Distribución (sin firma)
Si compartes el .exe desde el repo, Windows puede mostrar advertencias (SmartScreen).
Recomendado:
- Publicar en GitHub Releases con nota de que es una app sin firma.
- Ofrecer un ZIP con el ejecutable.
- Incluir un checksum SHA256 para verificar integridad.

Ejemplo para generar checksum:
```bash
Get-FileHash -Algorithm SHA256 .\src-tauri\target\release\fintrack-app.exe
```

## Portable (Windows)
Para usar la app sin instalar:
1. Crea una carpeta y copia `fintrack-app.exe`.
2. Crea un archivo vacío `fintrack.portable` en la misma carpeta (o copia `finanzas.db` ahí).
3. Ejecuta la app. La base de datos se guardará en esa carpeta.

Nota: requiere WebView2 (Windows 10/11 normalmente lo trae).

## Datos y ubicación
En Windows, la base de datos se guarda por defecto en:
`C:\Users\<usuario>\AppData\Roaming\com.fintrack.app\finanzas.db`.

Desde la app puedes abrir la configuración y elegir otra carpeta o archivo `.db`.

## Importación CSV
Admite coma o punto y coma como delimitador. El importador intenta detectar cabeceras en ES/EN.

Cabeceras reconocidas:
- mes: `mes`, `month`, `fecha`
- año: `year`, `ano`
- ingresos: `income`, `ingresos`
- gastos: `expense`, `gastos`
- saldo: `balance`, `saldo`, `acumulacion`, `saldo al cierre`, `saldo cierre`

Formatos de mes aceptados:
- `YYYY-MM` o `YYYY/MM`
- `MM-YYYY` o `MM/YYYY`
- `ene 2025`, `enero 2025`, `jan 2025`, etc.

Notas:
- En vista mensual se espera una sola fila (si no se incluye la columna de mes).
- Si se repite un mes en la importación, se sobrescribe el snapshot de ese mes.

## Estructura del proyecto
- `src/`: UI, hooks, features, utils y locales.
- `src-tauri/`: código desktop, configuración y build.

## CI / Releases
Al subir un tag `v*` (por ejemplo `v1.0.5`), GitHub Actions genera builds para Windows/macOS/Linux y crea un release en borrador.

## Ejemplo de uso

### Resumen mensual (Vista)

<img width="1919" height="1079" alt="imagen" src="https://github.com/user-attachments/assets/b9fe34a7-1258-42ef-b44b-dcc6b78cdd95" />
Vista principal de la aplicación.
Permite registrar ingresos, gastos y saldo al cierre de cada mes, mostrando gráficas y métricas clave para validar los datos sin depender de hojas de cálculo.

### Resumen anual (Vista)

<img width="1891" height="884" alt="imagen" src="https://github.com/user-attachments/assets/4d95e332-ce02-49a1-b195-40fdd2bbee3c" />
<img width="1881" height="765" alt="imagen" src="https://github.com/user-attachments/assets/2beba6ee-9298-43de-bacd-e3f7646773ed" />
Resumen global del año seleccionado, con agregados de ingresos, gastos, beneficio y saldo final, junto con una gráfica comparativa mes a mes.

### Histórico (Vista)

<img width="1884" height="797" alt="imagen" src="https://github.com/user-attachments/assets/6e36fbfe-7867-49b6-89f8-f67d50636391" />
Vista global de todos los años registrados, con agregados anuales de ingresos, gastos, beneficio y saldo al cierre.

### Explicación de los campos de entrada

Introduce los importes tal y como aparecen en tu banco al final de cada mes:

- Ingresos: todo lo que ha entrado en el mes.
- Gastos: todo lo que ha salido en el mes.
- Saldo al cierre: el dinero total que queda en la cuenta al finalizar el mes.

El beneficio se calcula automáticamente.

### Extra

**Importar CSV** <br/>
Puedes importar un archivo CSV con tus datos históricos.
El importador detecta automáticamente el delimitador (coma o punto y coma) y reconoce cabeceras en español o inglés.

**Pegar datos** <br/>
También puedes pegar directamente los datos como texto, tal y como se muestran en el ejemplo del campo.
El formato de los datos depende de la vista desde la que se realiza la importación (mensual, anual o histórico).
Cada vista muestra un ejemplo de formato en el campo de texto, que debe respetarse al pegar los datos.

**Exportar CSV/SQL** <br/>
Desde Ajustes puedes exportar los datos a CSV o a un volcado SQL para backup o migraciones.

**Base de datos (.db)** <br/>
Fintrack guarda toda la información en un único archivo de base de datos **SQLite (`.db`)**.  
Este archivo es el origen de todos los datos de la aplicación: meses, histórico y saldo acumulado.

Es importante que la aplicación esté **apuntando al archivo `.db` correcto** para poder ver, guardar o recuperar tu información.  
Cambiar de archivo implica cambiar de conjunto de datos.

No existe sincronización automática ni copias ocultas.

<img width="1282" height="710" alt="imagen" src="https://github.com/user-attachments/assets/21637a76-1dd8-44d4-bbd9-14e0e7504304" />

Para enlazar o cambiar el archivo de datos:

1. Abre **Ajustes** desde el icono de configuración.
2. Selecciona una carpeta o un archivo `.db`.
3. Guarda la nueva ubicación.

A partir de ese momento, Fintrack utilizará ese archivo como fuente de datos.

> Los datos utilizados en las capturas y ejemplos son datos simulados con fines demostrativos.

## Licencia
MIT. Ver `LICENSE`.
