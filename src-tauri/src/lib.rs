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

#[tauri::command]
fn backup_database_file(source: String, destination: String) -> Result<(), String> {
  let source_path = std::path::Path::new(&source);
  let destination_path = std::path::Path::new(&destination);
  let source_name = source_path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or_default();
  let valid_source = matches!(source_name, "finanzas.db" | "finanzas.mocks.db");
  let valid_destination = destination_path
    .extension()
    .and_then(|extension| extension.to_str())
    .is_some_and(|extension| extension.eq_ignore_ascii_case("db"));

  if !valid_source || !valid_destination || source_path == destination_path {
    return Err("Invalid database backup path".to_string());
  }

  std::fs::copy(source_path, destination_path)
    .map(|_| ())
    .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      resolve_portable_db_path,
      backup_database_file
    ])
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
