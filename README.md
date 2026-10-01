<p align="center">
  <img src="public/app-icon.svg" alt="Fintrack" width="96" height="96" />
</p>

# Fintrack

Fintrack is an *offline-first* app for tracking income, expenses, cash, investments, net worth, and monthly history. It uses a local SQLite database and can optionally sync with Firebase to use the same data across multiple devices.

## Downloads

- Windows installer: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_x64-setup.exe)
- Windows MSI: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_x64_en-US.msi)
- Windows portable ZIP: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_portable_windows.zip)
- macOS Apple Silicon: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_aarch64.dmg)
- Linux AppImage: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_amd64.AppImage)
- Linux DEB: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_amd64.deb)
- Linux RPM: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0-1.x86_64.rpm)
- Android APK: [Fintrack 3.5.0](https://github.com/marcorm91/fintrack-app/releases/download/v3.5.0/Fintrack_3.5.0_android.apk)

The links will be available once release `v3.5.0` is published.

## Features

- Overview opens by default, with current wealth, the goal, the latest recorded month, current-year cash flow, and historical wealth. Each preview opens its detailed view.
- Fixed desktop navigation and four-item mobile bottom navigation: Overview, Month, Annual, and History. Wealth and the goal appear only in Overview, freeing space in detailed views.
- The wealth heading shows the current calendar month; the monthly preview uses the latest stored record up to that month, including zero-valued records. Annual totals always use the current calendar year. Empty periods are shown explicitly instead of fabricated records.
- Responsive charts and custom SVG navigation icons, with keyboard focus, accessible chart data, and Spanish/English labels. Existing financial calculations, database storage, backups, and cloud sync are unchanged; no database migration is required.

- Monthly, yearly, and history views.
- Import from CSV files or pasted text.
- CSV, SQL, and JSON backup export.
- Share JSON backups from Android through the native system share menu.
- Cash, profit, and net worth charts.
- Local mode without an account.
- Cloud mode with Firebase Authentication and Firestore.
- Automatic sync and explicit conflict resolution.
- Cloud sync automatically retries temporary failures and resumes when the app returns to the foreground.
- Local emergency PIN for working without Firebase once it has been configured.
- Optional investment portfolio.
- One global wealth goal with a target amount and end month, integrated into the wealth summary. It follows cash plus the enabled portfolio, or cash alone when the portfolio is disabled.
- Goal progress, remaining amount, and monthly amount needed from the displayed closing month; a solid green progress bar and an accessible dialog capped at 560 px.
- Compact goal section with SVG icons, a target amount smaller than the main wealth total, closely grouped desktop figures, and a compact empty state. Only the pencil button opens goal editing; the empty state uses its dedicated set-goal button. Separate cards distinguish the goal from current wealth, with a horizontal goal layout on desktop. The dialog aligns the shared red delete button with Cancel and Save. The goal calculation continues to use the recorded wealth month, independently of the current-month heading.
- Separate monthly portfolio contributions from the real portfolio closing value, with automatic accumulated gain/loss tracking.
- Leave the monthly portfolio contribution empty to mark it as untracked; enter `0` to record an explicit zero contribution.
- Investment performance insights for monthly, yearly, and historical views.
- Monthly notes and a responsive interface.
- Current-month entries are reflected in insights immediately; unrecorded months stay absent instead of being treated as zero-valued periods.

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
firebase.json   Firebase CLI deployment configuration
```

## Firestore rules deployment

`firestore.rules` is the source of truth for the official Firestore security rules. When `firestore.rules`, `firebase.json`, or the deployment workflow changes on `main`, GitHub Actions runs **Deploy Firestore Rules** for project `fintrack-cloud-6ad3e`.

The repository must define an Actions secret named `FIREBASE_SERVICE_ACCOUNT` containing the JSON key for a Google Cloud service account that is allowed to deploy Firestore security rules. If the secret is missing, the workflow stops with an explicit error instead of silently leaving the Firebase Console rules outdated.

The workflow can also be started manually from **Actions > Deploy Firestore Rules > Run workflow**. Avoid making rule changes only in the Firebase Console: the next automated deployment uses the repository version and can overwrite console-only edits.

## Releases

When a `v*` tag is published, for example `v3.2.0`, GitHub Actions builds the Windows, macOS, Linux, and Android packages and creates the release with its artifacts.

## License

MIT. See `LICENSE`.

## Wealth goal storage and sync

The goal is stored in the existing SQLite `app_settings` table under `wealthGoal`. Only
`targetAmountCents` and `targetMonth` describe the goal; version, local revision and sync
status support the existing offline-first workflow. Deletion retains a null tombstone
until it can sync. No monthly snapshot or financial calculation is changed.

JSON backups keep the optional `settings.wealthGoal` object (or null) with format version
1. Importing an older backup without the field removes the goal. Existing expired goals
remain valid for display and backup; the editor requires the end month to be at least
the later of the current calendar month and the displayed wealth month. With no closing
snapshot, calculations use the current calendar month. Derived values are not persisted.

Cloud sync uses `users/{uid}/settings/wealthGoal`, since earlier versions only synced
monthly snapshots and had no remote global-settings document. The existing sync loop,
retry status and explicit local/cloud conflict choice cover this document too. Upload
acknowledgement retains newer local edits made during a request. **Deploy the updated
`firestore.rules` before enabling this feature in a cloud distribution.** These rules
restrict access to the owning user and validate the goal and monotonically increasing
version. The existing Deploy Firestore Rules workflow publishes them when this change
reaches `main`; pushing a feature branch does not deploy production rules.
