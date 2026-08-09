<p align="center">
  <img src="public/app-icon.svg" alt="Fintrack" width="96" height="96" />
</p>

# Fintrack

Aplicación *offline-first* para el control mensual, anual e histórico de finanzas personales. Mantiene los datos disponibles en SQLite y permite sincronizarlos de forma opcional y segura mediante Firebase.

> **Motivación**  
> Este proyecto nace de una necesidad personal: dejar de gestionar mis finanzas en hojas de Excel que con el tiempo se volvieron difíciles de mantener, propensas a errores y poco prácticas para analizar el histórico.  
> Fintrack surge como una alternativa sencilla y mantenible para controlar ingresos, gastos, efectivo y patrimonio. Puede utilizarse íntegramente en local o combinarse con una copia cloud para compartir los datos entre dispositivos.

## Características

- Vista mensual, anual e histórico.
- Importación desde CSV o pegado de texto.
- Exportación CSV, SQL y backup JSON desde ajustes.
- Gráficas de barras para flujo de efectivo y patrimonio.
- Ordenación de columnas en tablas.
- Idiomas ES/EN.
- Arquitectura *offline-first*: SQLite funciona como almacenamiento principal incluso sin conexión.
- Modo local sin cuenta y modo cloud con Firebase Authentication y Firestore.
- Sincronización automática al iniciar, guardar, recuperar conexión o recibir cambios remotos.
- Control de versiones y resolución explícita de conflictos para evitar sobrescrituras silenciosas.
- Sesión persistente por dispositivo, cierre de sesión y vinculación de la base local a su propietario.
- PIN local de emergencia opcional para acceder a SQLite cuando Firebase no está disponible.
- Filtros por rango y paginación en histórico.
- Configuración de ruta de base de datos desde la app en escritorio; Android utiliza almacenamiento interno protegido.
- Modo solo lectura desde ajustes.
- Cartera de inversión opcional: si se desactiva, la app no la muestra ni la incluye en cálculos de patrimonio.
- Notas opcionales para documentar ingresos, gastos o circunstancias excepcionales de cada mes.
- Tarjetas responsive para consultar el detalle anual e histórico sin tablas horizontales en móvil.
- Mocks de desarrollo con histórico desde 2019.

## Descargas

- Windows (instalador .exe): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_x64-setup.exe)
- Windows (MSI): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_x64_en-US.msi)
- Windows (portable .zip): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_portable_windows.zip)
- macOS (Apple Silicon, .dmg): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_aarch64.dmg)
- Linux (AppImage): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_amd64.AppImage)
- Linux (DEB): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_amd64.deb)
- Linux (RPM): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2-1.x86_64.rpm)
- Android (APK): [Fintrack 3.0.2](https://github.com/marcorm91/fintrack-app/releases/download/v3.0.2/Fintrack_3.0.2_android.apk)

Los enlaces estarán disponibles cuando se publique la release `v3.0.2`.

## Modalidades de uso y acceso

### Uso local

Fintrack puede utilizarse sin cuenta, sin conexión a Internet y sin contactar con el autor. En este modo, toda la información permanece en la base SQLite del dispositivo y el usuario conserva el control de sus copias de seguridad.

### Servicio cloud administrado

La infraestructura Firebase utilizada por la distribución oficial es privada y no admite el registro público desde la aplicación. Para solicitar una cuenta autorizada y utilizar la aplicación con esta base cloud, sin clonar el proyecto ni desplegar una infraestructura propia, es necesario contactar con [marco.romeromartin@hotmail.com](mailto:marco.romeromartin@hotmail.com). El acceso está sujeto a autorización y se habilita de forma individual.

### Despliegue cloud independiente

Quien prefiera gestionar su propia infraestructura puede clonar o bifurcar este repositorio, crear un proyecto propio de Firebase con Authentication y Firestore, sustituir la configuración de Firebase y publicar las reglas incluidas en `firestore.rules`. La licencia MIT permite hacerlo sin solicitar permiso ni contactar con el autor.

En este caso, la administración de usuarios, seguridad, disponibilidad, costes y copias de seguridad de la infraestructura propia corresponde a quien realice el despliegue.

## Novedades 3.0.2

- Añade la generación automática del APK y AAB de Android al publicar una nueva versión.
- Adjunta los paquetes Android firmados directamente a la release de GitHub.
- Mejora la cabecera móvil para evitar cortes y aprovechar mejor el espacio disponible.
- Corrige la disposición del PIN de emergencia y sus acciones en pantallas pequeñas.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Chart.js (react-chartjs-2)
- Tauri 2 + SQLite plugin
- Firebase Authentication + Cloud Firestore

## Requisitos
- Node.js 20+
- Rust toolchain y dependencias de Tauri

Guía de requisitos de Tauri: https://tauri.app

## Instalación para desarrollo o despliegue propio

```bash
npm install
```

Para habilitar el modo cloud en un despliegue independiente, crea un proyecto Firebase, configura Authentication y Firestore, sustituye la configuración de Firebase de la aplicación y publica `firestore.rules`. El modo local no necesita estos pasos.

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

Al subir un tag `v*`, como `v3.0.2`, GitHub Actions genera los paquetes para Windows, macOS, Linux y Android, y crea una release en borrador con los artefactos correspondientes.

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

Las reglas que validan propietario, formato y avance de versión están en `firestore.rules`. En la infraestructura oficial ya forman parte de la configuración administrada; cualquier despliegue independiente debe publicarlas en su propio proyecto Firebase antes de probar la sincronización.

**Base de datos (.db)** <br/>
Fintrack guarda toda la información en un único archivo de base de datos **SQLite (`.db`)**.  
Este archivo es el origen de todos los datos de la aplicación: meses, histórico, efectivo, cartera y ajustes.

Es importante que la aplicación esté **apuntando al archivo `.db` correcto** para poder ver, guardar o recuperar tu información.  
Cambiar de archivo implica cambiar de conjunto de datos.


En modo local, los datos **no se alojan en ningún servidor**, no hace falta registro ni cuenta y todo queda en el equipo. En modo cloud se mantiene esa copia SQLite y se sincroniza con Firestore.
Fintrack busca facilitar el control de tus cuentas de la forma más sencilla posible.

Para enlazar o cambiar el archivo de datos:

1. Abre **Ajustes** desde el icono de configuración.
2. Selecciona una carpeta o un archivo `.db`.
3. Guarda la nueva ubicación.

A partir de ese momento, Fintrack utilizará ese archivo como fuente de datos.

## Licencia
MIT. Ver `LICENSE`.
