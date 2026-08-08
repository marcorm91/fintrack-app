<p align="center">
  <img src="public/app-icon.svg" alt="Fintrack" width="96" height="96" />
</p>

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
- Notas opcionales para documentar ingresos, gastos o circunstancias excepcionales de cada mes.
- Tarjetas responsive para consultar el detalle anual e histórico sin tablas horizontales en móvil.
- Mocks de desarrollo con histórico desde 2019.

## Descargas
- Windows (instalador .exe): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_x64-setup.exe)
- Windows (MSI): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_x64_en-US.msi)
- Windows (portable .zip): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_portable_windows.zip)
- macOS (Apple Silicon, .dmg): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_aarch64.dmg)
- Linux (AppImage): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_amd64.AppImage)
- Linux (DEB): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5_amd64.deb)
- Linux (RPM): [Fintrack 2.0.5](https://github.com/marcorm91/fintrack-app/releases/download/v2.0.5/Fintrack_2.0.5-1.x86_64.rpm)
- Android (APK): se genera desde el workflow manual `Android APK (artifact)` y debe adjuntarse a la release si se quiere distribuir.

## Novedades 2.0.5
- Documenta la columna opcional de notas en los ejemplos de importación mensual, anual e histórica.
- Mantiene visible la tarjeta «Nota del mes» incluso cuando está vacía para evitar saltos en el diseño.
- Añade el estado «Sin notas para este mes» en español e inglés.

## Novedades 2.0.4
- Añade notas opcionales a los cierres mensuales, con migración automática para bases de datos existentes.
- Incluye las notas en la importación y exportación CSV y en los volcados SQL.
- Muestra las notas en la vista mensual y en un diálogo accesible desde el detalle anual.
- Rediseña los detalles anual e histórico como tarjetas en móvil, sin perder ordenación, tendencias, filtros ni paginación.
- Mantiene los controles de ordenación en una fila horizontal desplazable y conserva las tablas originales en escritorio.
- Compacta el panel móvil de cierre mensual y bloquea el scroll del contenido de fondo mientras está abierto.
- Añade una animación de cierre descendente al panel mensual.
- Corrige el menú de importación para cerrarlo al pulsar fuera o utilizar la tecla `Escape`.
- Reduce el JavaScript inicial mediante carga diferida de vistas y reorganiza lógica reutilizable en hooks y utilidades.

## Novedades 2.0.3
- Extiende el swipe mensual a todo el contenido de la pestaña de mes.
- Elimina los chevrons flotantes móviles y deja el swipe como gesto lateral principal.
- Mueve el botón flotante `+` a un portal para evitar problemas con padres transformados.
- Añade animación de entrada al botón `+` y mantiene su posición fixed durante el swipe.
- Corrige el overflow horizontal de la vista anual móvil al cambiar a años con datos.
- Abre los modales de gráficas anual e histórico a pantalla completa también en desktop.
- Permite cerrar los modales de gráficas con la tecla `Escape`.
- Añade el año seleccionado al título del modal de gráfica anual.
- Elimina constantes de series y props obsoletas sin uso.
- Refuerza tipados de resultados SQL, tooltips de gráficas, bloqueo de orientación e imports de insights.

## Novedades 2.0.2
- Mantiene patrimonio, efectivo y cartera desde el último mes con saldo al cierre informado.
- Evita que meses posteriores sin datos o con saldo al cierre `0` corten el patrimonio acumulado.
- Precarga saldo al cierre y cartera inversión en meses nuevos desde el último cierre real.
- Mejora la importación de CSV antiguos: ignora filas vacías con todo a `0` y no usa una columna de cartera completamente a `0` para sobrescribir cartera existente.
- Mejora la vista móvil mensual: dona sin tooltips superpuestos y formulario de guardado en panel inferior.
- Mantiene las mejoras de 2.0.1: ancho estable del selector de mes y porcentaje de ingresos/gastos en la dona mensual.
- Mantiene los cambios principales de 2.0.0: nuevo diseño, cartera opcional, comparativas anual/histórica, mocks desde 2019 e icono renovado.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)
- Tauri 2 + SQLite plugin

## Requisitos
- Node.js 20+
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

Para abrir la aplicación de escritorio con Tauri y datos simulados:

```bash
npm run tauri:dev:mocks
```

Ambos comandos usan `finanzas.mocks.db`, rellenan datos simulados en cada arranque y no tocan `finanzas.db` ni la ruta guardada en ajustes.

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

Comando para generar checksum:
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
- nota mensual: `note`, `notes`, `nota`, `notas`, `comentario`, `observaciones`

Formatos de mes aceptados:
- `YYYY-MM` o `YYYY/MM`
- `MM-YYYY` o `MM/YYYY`
- `ene 2025`, `enero 2025`, `jan 2025`, etc.

Notas:
- En vista mensual se espera una sola fila (si no se incluye la columna de mes).
- Si se repite un mes en la importación, se sobrescribe el snapshot de ese mes.
- La columna de cartera es opcional para compatibilidad con históricos antiguos; si falta o viene vacía, se conserva la cartera ya guardada para ese mes o la del último mes anterior con saldo al cierre informado.
- Si la columna de cartera existe pero todos sus valores son `0`, se trata como una columna heredada y no se usa para sobrescribir la cartera existente.

## Estructura del proyecto
- `src/`: UI, hooks, features, utils y locales.
- `src-tauri/`: código desktop, configuración y build.

## CI / Releases
Al subir un tag `v*`, como `v2.0.5`, GitHub Actions genera builds para Windows/macOS/Linux y crea un release en borrador.

## Campos de entrada

Introduce los importes tal y como aparecen en tu banco al final de cada mes:

- Ingresos: todo lo que ha entrado en el mes.
- Gastos: todo lo que ha salido en el mes.
- Saldo al cierre: efectivo disponible al finalizar el mes.
- Cartera inversión: valor de la cartera al cierre del mes, si la opción está activada.
- Nota mensual: contexto opcional para identificar movimientos o circunstancias excepcionales.

El beneficio se calcula automáticamente como ingresos menos gastos. El patrimonio total se calcula como efectivo más cartera cuando la cartera está activada.

## Operaciones

**Importar CSV** <br/>
Puedes importar un archivo CSV con tus datos históricos.
El importador detecta automáticamente el delimitador (coma o punto y coma) y reconoce cabeceras en español o inglés.

**Pegar datos** <br/>
También puedes pegar directamente los datos como texto.
El formato depende de la vista desde la que se realiza la importación: mensual, anual o histórico.

**Exportar CSV/SQL** <br/>
Desde Ajustes puedes exportar los datos a CSV o a un volcado SQL para backup o migraciones.
El CSV incluye una marca UTF-8 para que Excel interprete correctamente acentos y caracteres especiales.

**Backup JSON** <br/>
Desde **Ajustes > Tus datos > Exportar copia** puedes exportar un JSON con todos los meses, notas y ajustes.
Es el formato recomendado para migrar Fintrack a otro dispositivo. Antes de importarlo, Fintrack indica cuántos meses son nuevos, idénticos o contienen cambios; los meses que no están en el backup se conservan.

Antes de activar la sincronización en un dispositivo nuevo, guarda un backup JSON. Se genera únicamente desde SQLite y funciona sin conexión.

**Sincronización offline-first** <br/>
SQLite sigue siendo la fuente de datos de la app y continúa funcionando sin conexión. En modo cloud, cada mes se sincroniza en Firestore bajo `users/{uid}/monthlySnapshots/{month}`.

- Las bases existentes se migran automáticamente y conservan todos sus registros.
- Los registros locales anteriores se suben en la primera sincronización cloud.
- Los cambios y borrados se conservan como pendientes hasta que el servidor los confirme.
- La sincronización se ejecuta al abrir la app, guardar, recuperar conexión o recibir un cambio remoto.
- Las versiones se incrementan mediante transacciones de Firestore; una confirmación solo se acepta si el registro no volvió a cambiar durante la subida.
- Si llega una versión remota nueva mientras existe un cambio local pendiente, el registro se marca como conflicto y no se sobrescribe silenciosamente.
- Los conflictos se resuelven expresamente desde Ajustes conservando la copia local o la cloud.

Esta rama permite elegir en el primer arranque entre modo local y modo cloud. En modo local no hace falta iniciar sesión ni se inicializa Firebase. En modo cloud se usa Firebase Authentication, sin registro público desde la app y con sesión persistente en cada dispositivo. La base local queda vinculada al UID autenticado: cerrar sesión bloquea también el acceso desde el modo local y otra cuenta no puede sincronizar esa SQLite. El propietario puede desvincularla expresamente cambiando a modo local desde Ajustes, sin borrar datos.

Desde Ajustes se puede configurar un PIN local de emergencia de 6 dígitos. El PIN no se guarda: se almacena un verificador PBKDF2-SHA-256 con sal aleatoria y 600.000 iteraciones. Tras cinco intentos fallidos, el acceso se bloquea temporalmente. Este modo permite trabajar únicamente en SQLite; la sincronización permanece pausada hasta volver a iniciar sesión en Firebase.

Las reglas que validan propietario, formato y avance de versión están en `firestore.rules` y deben publicarse en Firebase antes de probar la sincronización.

**Base de datos (.db)** <br/>
Fintrack guarda toda la información en un único archivo de base de datos **SQLite (`.db`)**.  
Este archivo es el origen de todos los datos de la aplicación: meses, histórico, efectivo, cartera y ajustes.

Es importante que la aplicación esté **apuntando al archivo `.db` correcto** para poder ver, guardar o recuperar tu información.  
Cambiar de archivo implica cambiar de conjunto de datos.


En modo local, los datos **no se alojan en ningún servidor**, no hace falta registro ni cuenta y todo queda en el equipo. En modo cloud se mantiene esa copia SQLite y se sincroniza con Firestore.
Fintrack busca llevar tus cuentas de forma puntual y **lo mas simple posible**.

Para enlazar o cambiar el archivo de datos:

1. Abre **Ajustes** desde el icono de configuración.
2. Selecciona una carpeta o un archivo `.db`.
3. Guarda la nueva ubicación.

A partir de ese momento, Fintrack utilizará ese archivo como fuente de datos.

## Licencia
MIT. Ver `LICENSE`.
