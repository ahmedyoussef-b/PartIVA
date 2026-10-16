use sqlx::SqlitePool;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // E8P-S02 – BDD locale SQLite initialisée au démarrage (pool exposée en state Tauri)
      let pool = tauri::async_runtime::block_on(db::init_local_db())
        .expect("[PartIVA Desktop] Échec init BDD locale");
      app.manage(AppState {
        pool: pool.clone(),
        http: reqwest::Client::new(),
      });
      app.manage(pool);

      // Start the Next.js sidecar and wait for it to be ready
      let _ = tauri::async_runtime::spawn(async move {
        if let Err(e) = start_server(app.handle()).await {
          eprintln!("Failed to start server: {}", e);
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
      get_part
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

async fn start_server(app: &tauri::AppHandle) -> Result<(), String> {
  let resource_dir = app.path().resource_dir()
    .map_err(|e| format!("Failed to get resource dir: {e}"))?;
  let server_js_path = resource_dir.join("server").join("server.js");
  let server_js_path_str = server_js_path.to_string_lossy();

  let sidecar = app.shell()
    .sidecar("node")
    .args([server_js_path_str.as_ref()])
    .map_err(|e| format!("sidecar error: {e}"))?;

  let (mut rx, mut child) = sidecar.spawn()
    .map_err(|e| format!("spawn error: {e}"))?;

  // Read stdout to extract the port
  let mut port: Option<u16> = None;
  while let Some(event) = rx.recv().await {
    if let CommandEvent::Stdout(line) = event {
      let line = String::from_utf8_lossy(&line);
      if let Some(p) = parse_port_line(&line) {
        port = Some(p);
        break;
      }
    }
  }

  let port = port.ok_or_else(|| "Port not communicated".to_string())?;

  // Wait for healthcheck
  if let Err(e) = wait_for_health(port, 30).await {
    return Err(format!("Healthcheck failed: {}", e));
  }

  // Get the main window and show it
  let main_window = app.get_webview_window("main").unwrap();
  main_window.navigate(format!("http://127.0.0.1:{}/admin/dashboard", port).parse().unwrap())?;
  main_window.show()?;

  // Close the splash screen
  let splash = app.get_webview_window("splash").unwrap();
  splash.close()?;

  Ok(())
}

fn parse_port_line(line: &str) -> Option<u16> {
  // Expected format: PARTIVA_SERVER_PORT=<port>
  if let Some(stripped) = line.strip_prefix("PARTIVA_SERVER_PORT=") {
    stripped.trim().parse::<u16>().ok()
  } else {
    None
  }
}

async fn wait_for_health(port: u16, timeout_secs: u64) -> Result<(), String> {
  let client = reqwest::Client::new();
  let url = format!("http://127.0.0.1:{}/api/health", port);
  let start = std::time::Instant::now();
  while start.elapsed().as_secs() < timeout_secs {
    if let Ok(resp) = client.get(&url).send().await {
      if resp.status().is_success() {
        return Ok(());
      }
    }
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
  }
  Err("Healthcheck timeout".to_string())
}

pub mod auth;
pub mod db;
pub mod parts;
pub mod sync;

use sqlx::SqlitePool;
use tauri::Manager;

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
}

/// E8P-S05/S06 – synchronisation manuelle et au démarrage (D-E8P-S01-3 = A).
/// Token : keyring (login interactif, D-E8P-S06-2) puis repli PARTIVA_SYNC_TOKEN (dev).
/// Jamais logué (Sécurité #7).
#[tauri::command]
async fn sync_now(state: tauri::State<'_, AppState>) -> Result<sync::SyncSummary, String> {
  let token = auth::resolve_token().map_err(|e| e.to_string())?;
  sync::sync_all(&state.pool, &state.http, &token, sync::SYNC_BASE_URL)
    .await
    .map_err(|e| e.to_string())
}

/// E8P-S06 – login interactif : appel BetterAuth + stockage keyring (token non renvoyé).
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

/// E8P-S06 – catalogue local (lecture seule).
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

/// E8P-S06 – recherche locale, 6 modes (match statique côté Rust).
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

/// E8P-S06 – fiche pièce (détails + specs + images + fitments).
#[tauri::command]
async fn get_part(
  state: tauri::State<'_, AppState>,
  id: String,
) -> Result<Option<parts::PartDetail>, String> {
  parts::get_part(&state.pool, &id)
    .await
    .map_err(|e| e.to_string())
}