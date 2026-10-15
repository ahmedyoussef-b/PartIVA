mod db;
mod sync;

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
    .invoke_handler(tauri::generate_handler![sync_now])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
}

/// E8P-S05 — commande Tauri de synchronisation manuelle (D-E8P-S01-3 = A).
/// Token dev via PARTIVA_SYNC_TOKEN (D-E8P-S05-1 = A) ; jamais logué (Sécurité #7).
#[tauri::command]
async fn sync_now(state: tauri::State<'_, AppState>) -> Result<sync::SyncSummary, String> {
  let token = std::env::var("PARTIVA_SYNC_TOKEN")
    .map_err(|_| "PARTIVA_SYNC_TOKEN manquant".to_string())?;
  sync::sync_all(&state.pool, &state.http, &token)
    .await
    .map_err(|e| e.to_string())
}
