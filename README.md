# Fintrack

Aplicación local para control mensual, anual e histórico de finanzas personales con entradas agregadas, gráficas, tablas e importación de datos.

> **Motivación**  
> Este proyecto nace de una necesidad personal: dejar de gestionar mis finanzas en hojas de Excel que con el tiempo se volvieron difíciles de mantener, propensas a errores y poco prácticas para analizar el histórico.  
> Fintrack surge como una alternativa local, sencilla y mantenible para controlar ingresos, gastos, efectivo y patrimonio sin depender de herramientas externas.

## Características
- Vista mensual, anual e histórico.
- Importación desde CSV o pegado de texto.
- Exportación CSV y SQL desde ajustes.
- Gráficas de barras para flujo de efectivo y patrimonio.
- Ordenación de columnas en tablas.
- Idiomas ES/EN.
- Datos locales con SQLite (Tauri plugin).
- Filtros por rango y paginación en histórico.
- Configuración de ruta de base de datos desde la app.
- Modo solo lectura desde ajustes.
- Cartera de inversión opcional: si se desactiva, la app no la muestra ni la incluye en cálculos de patrimonio.
- Mocks de desarrollo con histórico desde 2019.

## Descargas
- Windows (instalador .exe): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_x64-setup.exe)
- Windows (MSI): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_x64_en-US.msi)
- Windows (portable .zip): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_portable_windows.zip)
- macOS (Apple Silicon, .dmg): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_aarch64.dmg)
- Linux (AppImage): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_amd64.AppImage)
- Linux (DEB): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0_amd64.deb)
- Linux (RPM): [Fintrack 2.0.0](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.0/Fintrack_2.0.0-1.x86_64.rpm)
- Android (APK): se genera desde el workflow manual `Android APK (artifact)` y debe adjuntarse a la release si se quiere distribuir.

## Novedades 2.0.0
- Rediseño visual de la app con una interfaz más compacta y consistente.
- Vista mensual centrada en ingresos, gastos y beneficio de efectivo, sin gastos individualizados.
- Cartera de inversión opcional desde ajustes; al desactivarla no se muestra ni participa en cálculos.
- Nuevas comparativas anual e histórica, histórico mock desde 2019 y gráficas de barras unificadas.
- Icono de app renovado para instaladores y ejecutables generados.

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

## Desarrollo con mocks
```bash
npm run dev:mocks
```

Este modo usa `finanzas.mocks.db`, rellena datos simulados en cada arranque y no toca `finanzas.db` ni la ruta guardada en ajustes.

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
- saldo/efectivo: `balance`, `saldo`, `efectivo`, `acumulacion`, `saldo al cierre`, `saldo cierre`
- cartera inversión: `portfolio`, `cartera`, `inversiones`, `cartera al cierre`

Formatos de mes aceptados:
- `YYYY-MM` o `YYYY/MM`
- `MM-YYYY` o `MM/YYYY`
- `ene 2025`, `enero 2025`, `jan 2025`, etc.

Notas:
- En vista mensual se espera una sola fila (si no se incluye la columna de mes).
- Si se repite un mes en la importación, se sobrescribe el snapshot de ese mes.
- La columna de cartera es opcional para compatibilidad con históricos antiguos; si falta, se importa como `0`.

## Estructura del proyecto
- `src/`: UI, hooks, features, utils y locales.
- `src-tauri/`: código desktop, configuración y build.

## CI / Releases
Al subir un tag `v*` (por ejemplo `v2.0.0`), GitHub Actions genera builds para Windows/macOS/Linux y crea un release en borrador.

## Ejemplo de uso

### Resumen mensual (Vista)

<img width="1919" height="1079" alt="imagen" src="https://github.com/user-attachments/assets/b9fe34a7-1258-42ef-b44b-dcc6b78cdd95" />
Vista principal de la aplicación.
Permite registrar ingresos, gastos, saldo al cierre y, si está activada, cartera de inversión. La vista mensual usa una dona para ingresos/gastos de efectivo y muestra el beneficio calculado sin registrar gastos individualizados.

### Resumen anual (Vista)

<img width="1891" height="884" alt="imagen" src="https://github.com/user-attachments/assets/4d95e332-ce02-49a1-b195-40fdd2bbee3c" />
<img width="1881" height="765" alt="imagen" src="https://github.com/user-attachments/assets/2beba6ee-9298-43de-bacd-e3f7646773ed" />
Resumen global del año seleccionado, con agregados de ingresos, gastos, beneficio, efectivo final, cartera final y patrimonio final. Incluye comparativas contra el año anterior o contra un año seleccionado.

### Histórico (Vista)

<img width="1884" height="797" alt="imagen" src="https://github.com/user-attachments/assets/6e36fbfe-7867-49b6-89f8-f67d50636391" />
Vista global de todos los años registrados, con agregados anuales de ingresos, gastos, beneficio y patrimonio. Permite filtrar por rango de años y paginar la tabla.

### Explicación de los campos de entrada

Introduce los importes tal y como aparecen en tu banco al final de cada mes:

- Ingresos: todo lo que ha entrado en el mes.
- Gastos: todo lo que ha salido en el mes.
- Saldo al cierre: efectivo disponible al finalizar el mes.
- Cartera inversión: valor de la cartera al cierre del mes, si la opción está activada.

El beneficio se calcula automáticamente como ingresos menos gastos. El patrimonio total se calcula como efectivo más cartera cuando la cartera está activada.

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
Este archivo es el origen de todos los datos de la aplicación: meses, histórico, efectivo, cartera y ajustes.

Es importante que la aplicación esté **apuntando al archivo `.db` correcto** para poder ver, guardar o recuperar tu información.  
Cambiar de archivo implica cambiar de conjunto de datos.


Ventaja clave: los datos **no se alojan en ningun servidor**, no hace falta registro ni cuenta, y todo queda en tu equipo.
Fintrack busca llevar tus cuentas de forma puntual y **lo mas simple posible**.

<img width="1282" height="710" alt="imagen" src="https://github.com/user-attachments/assets/21637a76-1dd8-44d4-bbd9-14e0e7504304" />

Para enlazar o cambiar el archivo de datos:

1. Abre **Ajustes** desde el icono de configuración.
2. Selecciona una carpeta o un archivo `.db`.
3. Guarda la nueva ubicación.

A partir de ese momento, Fintrack utilizará ese archivo como fuente de datos.

> Los datos utilizados en las capturas y ejemplos son datos simulados con fines demostrativos.

## Licencia
MIT. Ver `LICENSE`.
