# Fintrack Architecture

Fintrack is an offline-first personal finance app. SQLite is the primary data
store, and Firebase is an optional synchronization layer for authorized cloud
users.

## Runtime Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| React app | `src/` | UI, state orchestration, imports, exports, charts and settings |
| Local database | `src/db/` | SQLite schema, migrations, monthly snapshots and app settings |
| Cloud services | `src/services/` | Firebase Auth, Firestore access, cloud sync and offline PIN |
| Desktop/mobile shell | `src-tauri/` | Tauri configuration, native commands and platform packaging |
| Distribution | `.github/workflows/` | Release builds for desktop and Android artifacts |

## Data Model

Monthly financial data is stored in `monthly_snapshots`. Each row represents one
month and includes cash flow, closing balances, an optional note, sync metadata
and soft-delete state.

Application preferences live in `app_settings`. This keeps settings local to the
SQLite database so backup and portability remain predictable.

## App Startup

1. `src/main.tsx` initializes React, i18n and global styles.
2. `src/App.tsx` resolves the app mode: local or cloud.
3. Database ownership and offline PIN state are loaded.
4. Cloud users authenticate through Firebase Auth.
5. The main Fintrack UI loads monthly, yearly or historical views.

## Offline-First Sync

SQLite remains usable without network access. In cloud mode, local changes are
marked as pending and synchronized to Firestore when possible.

Firestore stores snapshots under:

```text
users/{uid}/monthlySnapshots/{month}
```

Sync uses monotonically increasing versions to avoid silent overwrites. If the
remote version has advanced unexpectedly, the local row is marked as a conflict
and the user must choose whether local or cloud data wins.

## Development Modes

`npm run dev` starts the normal Vite development server.

`npm run dev:mocks` starts the app against `finanzas.mocks.db` with seeded sample
data. This keeps development fixtures separate from the user's real local
database.

`npm run tauri:dev:mocks` opens the Tauri shell with the same mocked data flow.

## Release Flow

Version metadata is kept in `package.json`, `package-lock.json` and
`src-tauri/tauri.conf.json`.

Release workflows run when a `v*` tag is pushed. For example, pushing `v3.0.3`
builds desktop packages and Android artifacts for that version.
