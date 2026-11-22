use sqlx::SqlitePool;
use std::sync::Mutex;
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

pub mod auth;
pub mod components;
pub mod config;
pub mod db;
pub mod logging;
pub mod materials;
pub mod parts;
pub mod requests;
pub mod sync;

pub struct AppState {
  pool: SqlitePool,
  http: reqwest::Client,
}

/// B5 (V8-D-14) — port du sidecar : fixe (3210), repli 3211→3220 si occupé.
fn pick_sidecar_port() -> u16 {
  for port in 3210u16..=3220 {
    if std::net::TcpListener::bind(("127.0.0.1", port)).is_ok() {
      return port;
    }
  }
  3210
}

/// C2 (V8-D-14, 2026-11-17) — `resource_dir()` renvoie un chemin verbatim
/// (`\\?\F:\…`) que Node résout mal (`EISDIR: lstat 'F:'`). On retire le préfixe.
fn strip_verbatim_prefix(path: &std::path::Path) -> std::path::PathBuf {
  let raw = path.to_string_lossy();
  match raw.strip_prefix("\\\\?\\") {
    Some(rest) => std::path::PathBuf::from(rest),
    None => path.to_path_buf(),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let app = tauri::Builder::default()
    .plugin(logging::build_logger())
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      // P2.2-b3 — le logger structuré est enregistré au niveau du Builder
      // (`logging::build_logger()`), aucune seconde registration ici.
      // BDD locale SQLite initialisée au démarrage
      let pool = tauri::async_runtime::block_on(db::init_local_db())
        .expect("[PartIVA Desktop] Échec init BDD locale");
      app.manage(AppState {
        pool: pool.clone(),
        http: reqwest::Client::new(),
      });
      app.manage(pool);

      // B3 (V8-D-14) — spawn du sidecar Node (API plugin shell, Tauri 2).
      // T3.6 (V8-D-14) — résolution du dossier serveur via `current_exe()`
      // (fonctionne en mode installé MSI/NSIS, pas seulement depuis target/release/).
      let exe_dir = std::env::current_exe()?.parent().unwrap().to_path_buf();
      let server_dir = strip_verbatim_prefix(&exe_dir.join("resources").join("server"));
      // Repli si les resources ne sont pas placées dans un sous-dossier `resources/`.
      let server_dir = if server_dir.exists() {
        server_dir
      } else {
        strip_verbatim_prefix(&exe_dir.join("server"))
      };
      log::info!(target: "sidecar", "server_dir={}", server_dir.display());
      let sidecar_port = pick_sidecar_port();
      // T4.0 (V8-D-14) — config DB (env → db.toml). Aucune URL → pas d'injection
      // DATABASE_URL (Better Auth/Prisma est Postgres-only ; le catalogue reste SQLite via Rust).
      let db_cfg = config::resolve_db_config_full();
      let needs_setup = db_cfg.is_none();
      // T4.1 (V8-D-14) — diagnostic : DATABASE_URL injectée ou non (sans secret).
      match &db_cfg {
        Some(cfg) => log::info!(
          target: "config",
          "db_cfg=Some source={} url_len={} → DATABASE_URL injectée",
          cfg.source,
          cfg.database_url.len()
        ),
        None => log::warn!(
          target: "config",
          "db_cfg=None → DATABASE_URL NON injectée (écran de configuration)"
        ),
      }
      log::info!(target: "config", "needs_setup={}", needs_setup);
      match app.shell().sidecar("node") {
        Ok(cmd) => {
          let cmd = cmd
            .args([server_dir.join("server.js").to_string_lossy().to_string()])
            .current_dir(&server_dir)
            .env("PORT", sidecar_port.to_string())
            .env("HOSTNAME", "127.0.0.1")
            .env("BETTER_AUTH_URL", format!("http://127.0.0.1:{}", sidecar_port))
            .env("PARTIVA_DESKTOP", "1")
            .kill_on_drop(true);
          // DATABASE_URL injectée UNIQUEMENT si une URL Postgres est configurée
          // (sinon le sidecar démarre sans DB → écran de configuration).
          let cmd = match &db_cfg {
            Some(cfg) => cmd.env("DATABASE_URL", cfg.database_url.clone()),
            None => cmd,
          };
          // Secret stable dans tous les cas (évite le secret par défaut de Better Auth).
          let cmd = match db_cfg.as_ref().and_then(|c| c.better_auth_secret.clone()) {
            Some(secret) => cmd.env("BETTER_AUTH_SECRET", secret),
            None => cmd.env("BETTER_AUTH_SECRET", "partiva-desktop-local-secret-32-chars-min"),
          };
          // Clés LLM optionnelles (env ou db.toml) — nécessaires aux fonctions PCB/IA.
          let cmd = if let Some(cfg) = &db_cfg {
            let mut c = cmd;
            for (k, v) in &cfg.extra_env {
              c = c.env(k, v);
            }
            c
          } else {
            cmd
          };
          // T3.8 (V8-D-14) — trace du port injecté avant spawn.
          log::info!(target: "sidecar", "spawn: PORT={} HOSTNAME=127.0.0.1", sidecar_port);
          match cmd.spawn() {
            Ok((mut rx, child)) => {
              log::info!(target: "sidecar", "démarré port={}", sidecar_port);
              app.manage(Mutex::new(Some(child)));
              tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                  match event {
                    CommandEvent::Stdout(bytes) => {
                      let line = String::from_utf8_lossy(&bytes);
                      log::info!(target: "sidecar:node", "{}", line.trim());
                    }
                    CommandEvent::Stderr(bytes) => {
                      let line = String::from_utf8_lossy(&bytes);
                      log::warn!(target: "sidecar:node", "{}", line.trim());
                    }
                    CommandEvent::Error(err) => log::error!(target: "sidecar", "error={}", err),
                    CommandEvent::Terminated(payload) => {
                      log::info!(target: "sidecar", "terminé code={:?}", payload.code)
                    }
                    _ => {}
                  }
                }
              });
            }
            Err(err) => log::error!("[SIDECAR] échec du spawn : {err}"),
          }
        }
        Err(err) => log::error!("[SIDECAR] sidecar introuvable : {err}"),
      }

      // B3 (V8-D-14) — afficher la fenêtre principale APRÈS readiness du sidecar
      // (30 s max, healthcheck HTTP /api/health toutes les 150 ms). Échec → écran d'erreur.
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        let start = std::time::Instant::now();
        let deadline = start + std::time::Duration::from_secs(30);
        let health_url = format!("http://127.0.0.1:{}/api/health", sidecar_port);
        let client = reqwest::Client::builder()
          .timeout(std::time::Duration::from_millis(800))
          .build()
          .unwrap_or_else(|_| reqwest::Client::new());
        let mut ready = false;
        while std::time::Instant::now() < deadline {
          // T3.8 (V8-D-14) — healthcheck HTTP réel (et non simple ouverture TCP) :
          // le port peut être ouvert avant que Next.js ne soit prêt à répondre.
          if let Ok(resp) = client.get(&health_url).send().await {
            if resp.status().is_success() {
              ready = true;
              break;
            }
          }
          tokio::time::sleep(std::time::Duration::from_millis(150)).await;
        }

        if let Some(splash) = app_handle.get_webview_window("splash") {
          let _ = splash.close();
        }
        if let Some(main) = app_handle.get_webview_window("main") {
          let _ = main.show();
          let _ = main.maximize();
          let _ = main.set_focus();
          if ready {
            log::info!(target: "sidecar", "readiness OK elapsed_ms={}", start.elapsed().as_millis());
            if needs_setup {
              log::warn!(target: "config", "aucune config DB explicite — écran de configuration");
              let _ = main.eval(config::CONFIG_SCREEN_HTML);
            } else {
              // T3.8 (V8-D-14) — navigation du webview vers le sidecar (critère D3).
              // Sans cela, la fenêtre reste sur la page statique `index.html`
              // (« Démarrage du serveur local… ») qui bascule au bout de 30 s sur
              // « Le serveur local n'a pas répondu ». Le port 3210 répond bien (200).
              let url = format!("http://127.0.0.1:{}/", sidecar_port);
              let _ = main.eval(&format!("window.location.href = '{}';", url));
              log::info!(target: "sidecar", "navigation webview vers {}", url);
            }
          } else {
            log::warn!(target: "sidecar", "readiness timeout timeout_s=30 (écran d'erreur affiché)");
            let _ = main.eval(
              r#"document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui;background:#0f172a;color:#f8fafc;text-align:center"><div><h1 style="font-size:1.1rem;margin:0 0 8px">PartIVA Desktop</h1><p style="font-size:.85rem;opacity:.8;margin:0">Le serveur local n&rsquo;a pas r&eacute;pondu dans le d&eacute;lai imparti (30 s).</p><p style="font-size:.75rem;opacity:.6;margin:8px 0 0">Fermez puis relancez l&rsquo;application.</p></div></div>';"#,
            );
          }
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
      get_plastiques,
      search_components
    ])
    .build(tauri::generate_context!())
    .expect("error while building tauri application");

  app.run(|app_handle, event| {
    if let RunEvent::Exit = event {
      if let Some(state) = app_handle.try_state::<Mutex<Option<CommandChild>>>() {
        if let Ok(mut guard) = state.lock() {
          if let Some(child) = guard.take() {
            let _ = child.kill();
          }
        }
      }
    }
  });
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

/// E8P-S06 — login interactif : appel BetterAuth (production) + stockage keyring.
/// T4.0 (V8-D-14) — plus de repli local : l'auth est réelle (Better Auth/Postgres).
/// NB : en mode sidecar, l'UI passe par `fetch('/api/auth/sign-in/email')` (cookie
/// navigateur) ; cette commande Rust reste disponible (sync keyring).
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

/// A7.1-c — recherche de composants (FTS5 BM25, repli LIKE).
#[tauri::command]
async fn search_components(
  state: tauri::State<'_, AppState>,
  query: String,
  limit: Option<i64>,
) -> Result<Vec<components::ComponentRow>, String> {
  let limit = limit.unwrap_or(20).clamp(1, 100);
  components::search_components(&state.pool, &query, limit)
    .await
    .map_err(|e| e.to_string())
}