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
fn write_text_file(path: String, contents: String) -> Result<(), String> {
  std::fs::write(&path, contents).map_err(|err| err.to_string())
}

#[tauri::command]
fn copy_file(source: String, destination: String) -> Result<(), String> {
  std::fs::copy(&source, &destination)
    .map(|_| ())
    .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      resolve_portable_db_path,
      write_text_file,
      copy_file
    ])
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
