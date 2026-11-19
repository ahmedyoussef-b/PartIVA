//! T3.2-c / T4.0 (V8-D-14) — résolution de la configuration DB du sidecar.
//!
//! Priorité : (a) `PARTIVA_DATABASE_URL` (env) → (b) `%APPDATA%/PartIVA/db.toml`.
//! Aucune config → `None` : l'appelant n'injecte **pas** `DATABASE_URL` et affiche
//! l'écran de configuration. Better Auth/Prisma est **Postgres-only** : le repli
//! SQLite (catalogue) n'est **jamais** injecté au sidecar.
//!
//! Aucun secret n'est bundlé : la config est **hors bundle**, fournie à l'installation.

#[derive(Debug, Clone)]
pub struct DbConfig {
  pub database_url: String,
  /// "env" | "file" | "fallback"
  pub source: &'static str,
  /// true = aucune config explicite trouvée (écran de configuration à afficher)
  pub needs_setup: bool,
  /// Secret Better Auth (optionnel) — `PARTIVA_BETTER_AUTH_SECRET` ou `db.toml`.
  pub better_auth_secret: Option<String>,
}

fn read_key(content: &str, wanted: &str) -> Option<String> {
  for line in content.lines() {
    let line = line.trim();
    if line.is_empty() || line.starts_with('#') {
      continue;
    }
    if let Some((key, value)) = line.split_once('=') {
      if key.trim() == wanted {
        let value = value.trim().trim_matches('"').trim_matches('\'').to_string();
        if !value.is_empty() {
          return Some(value);
        }
      }
    }
  }
  None
}

fn app_config_dir() -> Option<std::path::PathBuf> {
  if let Ok(appdata) = std::env::var("APPDATA") {
    return Some(std::path::PathBuf::from(appdata).join("PartIVA"));
  }
  std::env::var("LOCALAPPDATA")
    .ok()
    .map(|p| std::path::PathBuf::from(p).join("PartIVA"))
}

/// Résout la config DB : env → fichier → None.
pub fn resolve_db_config_full() -> Option<DbConfig> {
  let secret = std::env::var("PARTIVA_BETTER_AUTH_SECRET")
    .ok()
    .filter(|s| !s.trim().is_empty());

  if let Ok(url) = std::env::var("PARTIVA_DATABASE_URL") {
    let url = url.trim().to_string();
    if !url.is_empty() {
      log::info!(target: "config", "DB source=env (PARTIVA_DATABASE_URL) url_len={}", url.len());
      return Some(DbConfig {
        database_url: url,
        source: "env",
        needs_setup: false,
        better_auth_secret: secret,
      });
    }
  }

  // T4.1 (V8-D-14) — diagnostics db.toml (chemin, existence, parsing) — aucun secret loggé.
  let dir = match app_config_dir() {
    Some(d) => d,
    None => {
      log::warn!(target: "config", "DB: APPDATA/LOCALAPPDATA introuvable → aucune config");
      return None;
    }
  };
  let file = dir.join("db.toml");
  log::info!(target: "config", "db.toml path={} exists={}", file.display(), file.exists());
  if !file.exists() {
    log::warn!(target: "config", "db.toml absent → aucune config DB");
    return None;
  }
  let mut content = match std::fs::read_to_string(&file) {
    Ok(c) => c,
    Err(e) => {
      log::warn!(target: "config", "db.toml lecture impossible: {e}");
      return None;
    }
  };
  // T4.1 (V8-D-14) — retirer un éventuel BOM UTF-8 en tête (`EF BB BF`, fréquent
  // avec PowerShell `>` / `Out-File`). Sans cela, le 1er key (DATABASE_URL) est
  // préfixé de U+FEFF (que `trim()` ne retire pas) → `read_key` échoue → db_cfg=None.
  if content.starts_with('\u{FEFF}') {
    content.remove(0);
    log::warn!(target: "config", "db.toml: BOM UTF-8 détecté et retiré (correctif T4.1)");
  }
  let database_url = read_key(&content, "DATABASE_URL");
  log::info!(target: "config", "db.toml parsed DATABASE_URL present={}", database_url.is_some());
  let database_url = database_url?;
  let file_secret = read_key(&content, "BETTER_AUTH_SECRET");
  log::info!(target: "config", "db.toml parsed BETTER_AUTH_SECRET present={}", file_secret.is_some());
  Some(DbConfig {
    database_url,
    source: "file",
    needs_setup: false,
    better_auth_secret: secret.or(file_secret),
  })
}

/// ⚠️ Legacy (T3.3) — **NON injecté au sidecar** depuis T4.0 (Better Auth/Prisma
/// est Postgres-only : SQLite incompatible). Conservé pour un éventuel mode
/// « catalogue only » ; ne pas utiliser pour `DATABASE_URL` du sidecar.
pub fn fallback_db_config() -> DbConfig {
  let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
  let db_path = std::path::PathBuf::from(appdata)
    .join("PartIVA")
    .join("partiva.db");
  // Le dossier parent doit exister avant que le sidecar n'ouvre le fichier.
  if let Some(parent) = db_path.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  let db_url = format!(
    "sqlite://{}?mode=rwc",
    db_path.to_string_lossy().replace('\\', "/")
  );
  DbConfig {
    database_url: db_url,
    source: "fallback",
    needs_setup: false,
    better_auth_secret: None,
  }
}

/// API simple (T3.2-c) : URL de base à injecter dans le sidecar.
/// Priorité : `PARTIVA_DATABASE_URL` → `%APPDATA%/PartIVA/db.toml` → repli SQLite.
pub fn resolve_db_config() -> String {
  resolve_db_config_full()
    .map(|config| config.database_url)
    .unwrap_or_else(|| fallback_db_config().database_url)
}

/// Écran de configuration affiché dans le webview (aucune config trouvée).
pub const CONFIG_SCREEN_HTML: &str = r#"document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui;background:#0f172a;color:#f8fafc;padding:24px"><div style="max-width:34rem;text-align:left"><h1 style="font-size:1.1rem;margin:0 0 12px">Configuration requise</h1><p style="font-size:.85rem;opacity:.85;margin:0 0 10px">Aucune base de données n&rsquo;est configur&eacute;e. Cr&eacute;ez le fichier <code>%APPDATA%\PartIVA\db.toml</code> contenant &ldquo;DATABASE_URL=postgres&hellip;&rdquo;, ou d&eacute;finissez la variable <code>PARTIVA_DATABASE_URL</code>, puis relancez l&rsquo;application.</p><p style="font-size:.75rem;opacity:.6;margin:0">Le catalogue local (SQLite) reste op&eacute;rationnel ; les fonctions PCB/IA n&eacute;cessitent PostgreSQL.</p></div></div>';"#;