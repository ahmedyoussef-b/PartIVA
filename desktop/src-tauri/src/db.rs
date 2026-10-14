// E8P-S02 — initialisation BDD locale SQLite (fichier vide, sans schéma applicatif)
// E8P-S03 — migrations SQLx appliquées au démarrage (migrations/0001 → 0003)
// Schéma local + migrations en E8P-S03 ; sync web → local en E8P-S04/S05.
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use std::path::PathBuf;

pub async fn init_local_db() -> Result<SqlitePool, Box<dyn std::error::Error>> {
  let appdata =
    std::env::var("APPDATA").map_err(|_| "APPDATA non défini — Windows requis pour E8P-S02")?;
  let dir = PathBuf::from(appdata).join("PartIVA");
  std::fs::create_dir_all(&dir)?;
  let db_path = dir.join("partiva.db");
  let pool = connect(&db_path).await?;
  log::info!("[PartIVA Desktop] BDD locale prête : {:?}", db_path);
  Ok(pool)
}

async fn connect(db_path: &std::path::Path) -> Result<SqlitePool, sqlx::Error> {
  // mode=rwc : read-write-create — crée le fichier SQLite s'il n'existe pas
  let url = format!(
    "sqlite://{}?mode=rwc",
    db_path.to_string_lossy().replace('\\', "/")
  );
  let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect(&url)
    .await?;
  sqlx::migrate!("./migrations").run(&pool).await?;
  log::info!("[PartIVA Desktop] Migrations appliquées");
  Ok(pool)
}

#[cfg(test)]
mod tests {
  use super::*;

  // E8P-S03 — Bloc H (alternative au lancement GUI) : les migrations s'appliquent
  // sur une base vide et créent les 6 tables métier + _sqlx_migrations.
  #[tokio::test]
  async fn migrations_apply_on_empty_db() {
    let dir = std::env::temp_dir().join("partiva-desktop-test");
    std::fs::create_dir_all(&dir).unwrap();
    let db_path = dir.join("test-partiva.db");
    let _ = std::fs::remove_file(&db_path);

    let pool = connect(&db_path).await.expect("connexion BDD de test");
    let rows: Vec<(String,)> =
      sqlx::query_as("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .fetch_all(&pool)
        .await
        .expect("lecture sqlite_master");
    pool.close().await;
    let _ = std::fs::remove_file(&db_path);

    let names: Vec<&str> = rows.iter().map(|(n,)| n.as_str()).collect();
    for expected in [
      "part",
      "vehicle",
      "fitment",
      "part_image",
      "part_version",
      "sync_metadata",
      "_sqlx_migrations",
    ] {
      assert!(names.contains(&expected), "table manquante : {expected}");
    }
  }
}
