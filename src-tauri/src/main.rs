#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn resolve_portable_db_path(app: tauri::AppHandle) -> Option<String> {
  let resource_dir = app.path().resource_dir().ok()?;
  let db_path = resource_dir.join("finanzas.db");
  let marker_path = resource_dir.join("fintrack.portable");
  if marker_path.exists() || db_path.exists() {
    return Some(db_path.to_string_lossy().to_string());
  }
  None
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![resolve_portable_db_path])
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
