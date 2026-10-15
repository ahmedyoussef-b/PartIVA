pub mod auth;
pub mod db;
pub mod parts;
pub mod sync;

use sqlx::SqlitePool;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // E8P-S02 — BDD locale SQLite initialisée au démarrage (pool exposé en state Tauri)
      let pool = tauri::async_runtime::block_on(db::init_local_db())
        .expect("[PartIVA Desktop] Échec init BDD locale");
      app.manage(AppState {
        pool: pool.clone(),
        http: reqwest::Client::new(),
      });
      app.manage(pool);
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
      get_part
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
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

/// E8P-S06 — fiche pièce (détails + specs + images + fitments).
#[tauri::command]
async fn get_part(
  state: tauri::State<'_, AppState>,
  id: String,
) -> Result<Option<parts::PartDetail>, String> {
  parts::get_part(&state.pool, &id)
    .await
    .map_err(|e| e.to_string())
}
