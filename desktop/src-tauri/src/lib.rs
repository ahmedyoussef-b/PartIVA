use sqlx::SqlitePool;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

pub mod auth;
pub mod db;
pub mod materials;
pub mod parts;
pub mod sync;

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
}

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
      // E8P-S02 — BDD locale SQLite initialisée au démarrage (pool exposée en state Tauri)
      let pool = tauri::async_runtime::block_on(db::init_local_db())
        .expect("[PartIVA Desktop] Échec init BDD locale");
      app.manage(AppState {
        pool: pool.clone(),
        http: reqwest::Client::new(),
      });
      app.manage(pool);

      // Start the Next.js sidecar and wait for it to be ready
      let app_handle = app.handle().clone();
      let _ = tauri::async_runtime::spawn(async move {
        if let Err(e) = start_server(&app_handle).await {
          eprintln!("[PartIVA] ÉCHEC CRITIQUE démarrage serveur: {}", e);
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

async fn start_server(app: &tauri::AppHandle) -> Result<(), String> {
  let resource_dir = app.path().resource_dir()
    .map_err(|e| format!("Failed to get resource dir: {e}"))?;

  // En bundle NSIS Windows, les ressources '.../server' sont sous '_up_/server'
  // En mode développement ou autre packaging, elles peuvent être sous 'server'.
  let candidate_paths = [
    resource_dir.join("_up_").join("server").join("server.js"),
    resource_dir.join("server").join("server.js"),
  ];

  let server_js_path = candidate_paths
    .iter()
    .find(|p| p.exists())
    .cloned()
    .ok_or_else(|| {
      let msg = format!(
        "[PartIVA] server.js introuvable dans {:?}",
        candidate_paths
      );
      eprintln!("{msg}");
      msg
    })?;

  let clean_server_js_path = strip_unc_prefix(&server_js_path);
  let server_dir = clean_server_js_path.parent().unwrap_or(&resource_dir);
  let clean_server_dir = strip_unc_prefix(server_dir);

  eprintln!("[PartIVA] server.js trouvé à : {:?}", clean_server_js_path);
  eprintln!("[PartIVA] Répertoire sidecar : {:?}", clean_server_dir);

  let sidecar = app.shell()
    .sidecar("node")
    .map_err(|e| {
      eprintln!("[PartIVA] Erreur configuration sidecar node: {e}");
      format!("sidecar error: {e}")
    })?
    .current_dir(&clean_server_dir)
    .env("PORT", "0")
    .env("HOSTNAME", "127.0.0.1")
    .args(["server.js"]);

  let (mut rx, _child) = sidecar.spawn()
    .map_err(|e| {
      eprintln!("[PartIVA] Erreur spawn sidecar node: {e}");
      format!("spawn error: {e}")
    })?;

  // Read stdout to extract the port
  let mut port: Option<u16> = None;
  while let Some(event) = rx.recv().await {
    match event {
      CommandEvent::Stdout(line) => {
        let text = String::from_utf8_lossy(&line);
        eprintln!("[PartIVA][Sidecar-out] {}", text.trim());
        if let Some(p) = parse_port_line(&text) {
          port = Some(p);
          break;
        }
      }
      CommandEvent::Stderr(line) => {
        let text = String::from_utf8_lossy(&line);
        eprintln!("[PartIVA][Sidecar-err] {}", text.trim());
      }
      CommandEvent::Error(err) => {
        eprintln!("[PartIVA][Sidecar-error] {}", err);
      }
      CommandEvent::Terminated(status) => {
        eprintln!("[PartIVA][Sidecar-terminated] code={:?}", status.code);
        break;
      }
      _ => {}
    }
  }

  let port = port.ok_or_else(|| {
    eprintln!("[PartIVA] Erreur: Port non communiqué par le sidecar Node");
    "Port not communicated".to_string()
  })?;

  eprintln!("[PartIVA] Port extrait: {}", port);

  // Wait for healthcheck
  eprintln!("[PartIVA] Démarrage healthcheck sur http://127.0.0.1:{}/api/health", port);
  if let Err(e) = wait_for_health(port, 30).await {
    eprintln!("[PartIVA] Erreur healthcheck: {}", e);
    return Err(format!("Healthcheck failed: {}", e));
  }
  eprintln!("[PartIVA] Healthcheck OK");

  // Get the main window and navigate to dashboard
  let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
  let url_str = format!("http://127.0.0.1:{}/admin/dashboard", port);
  eprintln!("[PartIVA] Navigation vers: {}", url_str);
  let url = url_str.parse::<tauri::Url>().map_err(|e| {
    eprintln!("[PartIVA] Erreur parse URL: {}", e);
    e.to_string()
  })?;
  main_window.navigate(url).map_err(|e| {
    eprintln!("[PartIVA] Erreur navigation: {}", e);
    e.to_string()
  })?;
  eprintln!("[PartIVA] Navigation OK");
  main_window.show().map_err(|e| {
    eprintln!("[PartIVA] Erreur show: {}", e);
    e.to_string()
  })?;
  let _ = main_window.maximize();
  let _ = main_window.set_focus();
  eprintln!("[PartIVA] Fenêtre principale maximisée et affichée");

  // Close the splash screen
  let splash = app.get_webview_window("splash").ok_or("Splash window not found")?;
  splash.close().map_err(|e| {
    eprintln!("[PartIVA] Erreur close splash: {}", e);
    e.to_string()
  })?;

  Ok(())
}

fn parse_port_line(line: &str) -> Option<u16> {
  // Expected format: PARTIVA_SERVER_PORT=<port> (supports multiline and surrounding whitespace)
  for l in line.lines() {
    let trimmed = l.trim();
    if let Some(stripped) = trimmed.strip_prefix("PARTIVA_SERVER_PORT=") {
      if let Ok(p) = stripped.trim().parse::<u16>() {
        return Some(p);
      }
    }
  }
  None
}

fn strip_unc_prefix(path: &std::path::Path) -> std::path::PathBuf {
  let s = path.to_string_lossy();
  if let Some(stripped) = s.strip_prefix(r"\\?\") {
    std::path::PathBuf::from(stripped)
  } else {
    path.to_path_buf()
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
async fn get_demandes_file() -> Result<serde_json::Value, String> {
  // Mock E9-R3.b — bridge SQLite réel en E9-R4
  Ok(serde_json::json!([]))
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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_port_line_exact() {
    assert_eq!(parse_port_line("PARTIVA_SERVER_PORT=4567"), Some(4567));
  }

  #[test]
  fn test_parse_port_line_multiline() {
    let output = "▲ Next.js 16.4.0\nPARTIVA_SERVER_PORT=51234\n✓ Ready";
    assert_eq!(parse_port_line(output), Some(51234));
  }

  #[test]
  fn test_parse_port_line_whitespace() {
    assert_eq!(parse_port_line("  PARTIVA_SERVER_PORT=3000\r\n"), Some(3000));
  }

  #[test]
  fn test_parse_port_line_invalid() {
    assert_eq!(parse_port_line("SOME_OTHER_LINE"), None);
    assert_eq!(parse_port_line("PARTIVA_SERVER_PORT=invalid"), None);
  }
}
