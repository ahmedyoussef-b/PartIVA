//! P2.2-b3 (V8-D-14) — journalisation structurée (JSON lines).
//!
//! Cible 1 : stdout (dev, via `Start-Process -RedirectStandardOutput`).
//! Cible 2 : `<app_log_dir>/partiva-desktop.log` — JSON, rotation KeepSome(5), 10 Mo.
//! Niveau  : Info par défaut ; Debug si `PARTIVA_LOG_DEBUG=1`.
//!
//! Les champs structurés (`port`, `elapsed_ms`, `socket`, `version`, `error`)
//! sont **formatés dans le message** (clé=valeur) plutôt qu'en KV `log::kv`,
//! instable : la sortie reste des JSON lines entièrement parsables.

use tauri_plugin_log::{Builder, RotationStrategy, Target, TargetKind};

const LOG_FILE: &str = "partiva-desktop";
const DEFAULT_MAX_FILE_SIZE: u128 = 10_000_000;

/// Targets conservés dans le fichier (H5 — anti-bruit).
const KEPT_TARGET_PREFIXES: [&str; 5] = ["sidecar", "app_lib", "kicad", "config", "dev"];

fn max_file_size() -> u128 {
  std::env::var("PARTIVA_LOG_MAX_BYTES")
    .ok()
    .and_then(|v| v.parse::<u128>().ok())
    .unwrap_or(DEFAULT_MAX_FILE_SIZE)
}

/// Construit le logger (à passer à `.plugin(...)`).
pub fn build_logger<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
  let debug = std::env::var("PARTIVA_LOG_DEBUG")
    .map(|v| v == "1")
    .unwrap_or(false);

  Builder::default()
    .level(if debug {
      log::LevelFilter::Debug
    } else {
      log::LevelFilter::Info
    })
    .rotation_strategy(RotationStrategy::KeepSome(5))
    .max_file_size(max_file_size())
    .targets([
      Target::new(TargetKind::Stdout),
      Target::new(TargetKind::LogDir {
        file_name: Some(LOG_FILE.into()),
      }),
    ])
    .format(|cb, _args, record| {
      let target = record.target();
      if !KEPT_TARGET_PREFIXES.iter().any(|p| target.starts_with(p)) {
        return;
      }
      let msg = format!("{}", record.args());
      let line = format!(
        "{{\"ts\":\"{}\",\"level\":\"{}\",\"target\":\"{}\",\"msg\":{}}}\n",
        chrono::Local::now().to_rfc3339(),
        record.level(),
        record.target(),
        serde_json::to_string(&msg).unwrap_or_else(|_| "\"\"".to_string())
      );
      let _ = cb.finish(format_args!("{}", line));
    })
    .build()
}