<p align="center">
  <img src="public/app-icon.svg" alt="Fintrack" width="96" height="96" />
</p>

# Fintrack

Fintrack is an *offline-first* app for tracking income, expenses, cash, net worth, and monthly history. It uses a local SQLite database and can optionally sync with Firebase to use the same data across multiple devices.

## Downloads

- Windows installer: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_x64-setup.exe)
- Windows MSI: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_x64_en-US.msi)
- Windows portable ZIP: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_portable_windows.zip)
- macOS Apple Silicon: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_aarch64.dmg)
- Linux AppImage: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_amd64.AppImage)
- Linux DEB: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_amd64.deb)
- Linux RPM: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0-1.x86_64.rpm)
- Android APK: [Fintrack 3.2.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.2.0/Fintrack_3.2.0_android.apk)

The links will be available once release `v3.2.0` is published.

## Features

- Monthly, yearly, and history views.
- Import from CSV files or pasted text.
- CSV, SQL, and JSON backup export.
- Share JSON backups from Android through the native system share menu.
- Cash, profit, and net worth charts.
- Local mode without an account.
- Cloud mode with Firebase Authentication and Firestore.
- Automatic sync and explicit conflict resolution.
- Local emergency PIN for working without Firebase once it has been configured.
- Optional investment portfolio.
- Monthly notes and a responsive interface.
- Current-month entries stay editable and are included in insights automatically on the first day of the next month.

## Usage modes

**Local**: no account or connection required. Data stays in a SQLite database on the device.

**Official cloud**: uses the private Firebase infrastructure of the official distribution. Public sign-up is not available from the app; access is granted individually.

**Self-hosted cloud**: fork the repository, create your own Firebase project, replace the configuration, and deploy `firestore.rules`.

## Data locations

On desktop, Fintrack stores data and configuration in the user's standard Tauri/WebView locations. On Windows, they are usually located here:

```text
C:\\Users\\<username>\\AppData\\Roaming\\com.fintrack.app
C:\\Users\\<username>\\AppData\\Local\\com.fintrack.app
```

The default SQLite database is named:

```text
finanzas.db
```

In Windows portable mode, if `fintrack.portable` is placed next to `fintrack-app.exe`, the database is created beside the executable:

```text
fintrack-app.exe
fintrack.portable
finanzas.db
```

Android uses the app's protected internal storage.

## Backups

The recommended format is **JSON Backup**, available from:

```text
Settings > Your data > Export backup
```

Use this JSON file to migrate to another device or keep an external copy. On Android, you can also use **Share backup** to send it through Telegram, WhatsApp, Drive, or any compatible app.

## Development

Requirements:

- Node.js 20+
- Rust and Tauri dependencies

Install:

```bash
npm install
```

Common commands:

```bash
npm run dev
npm run tauri dev
npm run check
npm run build
npm run tauri build
```

Mock data:

```bash
npm run dev:mocks
npm run tauri:dev:mocks
```

Mocks use `finanzas.mocks.db` and do not modify `finanzas.db`.

## Project structure

```text
src/            UI, hooks, features, services, utilities, and translations
src-tauri/      Tauri configuration and native code
scripts/        Android build and mock utilities
firestore.rules Firestore security rules
```

## Releases

When a `v*` tag is published, for example `v3.2.0`, GitHub Actions builds the Windows, macOS, Linux, and Android packages and creates the release with its artifacts.

## License

MIT. See `LICENSE`.
