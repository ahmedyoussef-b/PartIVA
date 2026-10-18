use sqlx::SqlitePool;
use tauri::Manager;

pub mod auth;
pub mod db;
pub mod materials;
pub mod parts;
pub mod requests;
pub mod sync;

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // BDD locale SQLite initialisée au démarrage
      let pool = tauri::async_runtime::block_on(db::init_local_db())
        .expect("[PartIVA Desktop] Échec init BDD locale");
      app.manage(AppState {
        pool: pool.clone(),
        http: reqwest::Client::new(),
      });
      app.manage(pool);

      // Fermer le splash et afficher la main (chargement direct de out/)
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
        if let Some(splash) = app_handle.get_webview_window("splash") {
          let _ = splash.close();
        }
        if let Some(main) = app_handle.get_webview_window("main") {
          let _ = main.show();
          let _ = main.maximize();
          let _ = main.set_focus();
        }
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      sync_now,
      login,
      save_token,
      load_token,
      logout,
      list_parts,
      search_parts,
      get_part,
      get_dashboard,
      get_audit_logs,
      get_materials,
      get_material_by_slug,
      get_demandes_file,
      get_reverse_cao,
      get_plastiques
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

/// E8P-S05/S06 — synchronisation manuelle et au démarrage (D-E8P-S01-3 = A).
/// Token : keyring (login interactif, D-E8P-S06-2) puis repli PARTIVA_SYNC_TOKEN (dev).
/// Jamais logué (Sécurité #7).
#[tauri::command]
async fn sync_now(state: tauri::State<'_, AppState>) -> Result<sync::SyncSummary, String> {
  let token = auth::resolve_token().map_err(|e| e.to_string())?;
  sync::sync_all(&state.pool, &state.http, &token, sync::SYNC_BASE_URL)
    .await
    .map_err(|e| e.to_string())
}

/// E8P-S06 — login interactif : appel BetterAuth + stockage keyring (token non renvoyé).
#[tauri::command]
async fn login(
  state: tauri::State<'_, AppState>,
  email: String,
  password: String,
) -> Result<(), String> {
  auth::login(&state.http, &email, &password, auth::AUTH_BASE_URL).await
}

#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
  auth::save_token(&token)
}

#[tauri::command]
fn load_token() -> Result<Option<String>, String> {
  auth::load_token()
}

#[tauri::command]
fn logout() -> Result<(), String> {
  auth::logout()
}

/// E8P-S06 — catalogue local (lecture seule).
#[tauri::command]
async fn list_parts(
  state: tauri::State<'_, AppState>,
  limit: i64,
  offset: i64,
) -> Result<Vec<parts::PartRow>, String> {
  parts::list_parts(&state.pool, limit, offset)
    .await
    .map_err(|e| e.to_string())
}

/// E8P-S06 — recherche locale, 6 modes (match statique côté Rust).
#[tauri::command]
async fn search_parts(
  state: tauri::State<'_, AppState>,
  mode: String,
  query: String,
) -> Result<Vec<parts::PartRow>, String> {
  parts::search_parts(&state.pool, &mode, &query)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_part(
  state: tauri::State<'_, AppState>,
  id: String,
) -> Result<Option<parts::PartDetail>, String> {
  parts::get_part(&state.pool, &id)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_dashboard() -> Result<serde_json::Value, String> {
  Ok(serde_json::json!({ "requests": [], "machines": [] }))
}

#[tauri::command]
async fn get_audit_logs() -> Result<Vec<serde_json::Value>, String> {
  Ok(vec![])
}

#[tauri::command]
async fn get_materials(
  state: tauri::State<'_, AppState>,
) -> Result<Vec<materials::MaterialRow>, String> {
  materials::get_materials(&state.pool)
    .await
    .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
async fn get_material_by_slug(
  state: tauri::State<'_, AppState>,
  slug: String,
) -> Result<Option<materials::MaterialRow>, String> {
  materials::get_material_by_slug(&state.pool, &slug)
    .await
    .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
async fn get_demandes_file(
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    requests::get_demandes_file(&state.pool)
        .await
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
async fn get_reverse_cao() -> Result<serde_json::Value, String> {
  // Mock E9-R3.b — bridge SQLite réel en E9-R4
  Ok(serde_json::json!([]))
}

#[tauri::command]
async fn get_plastiques(
  state: tauri::State<'_, AppState>,
) -> Result<Vec<materials::MaterialRow>, String> {
  materials::get_plastiques(&state.pool)
    .await
    .map_err(|e| format!("DB error: {}", e))
}