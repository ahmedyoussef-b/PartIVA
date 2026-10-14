// E8P-S02 — initialisation BDD locale SQLite (fichier vide, sans schéma applicatif)
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
  // mode=rwc : read-write-create — crée le fichier SQLite s'il n'existe pas
  let url = format!(
    "sqlite://{}?mode=rwc",
    db_path.to_string_lossy().replace('\\', "/")
  );
  let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect(&url)
    .await?;
  log::info!("[PartIVA Desktop] BDD locale prête : {:?}", db_path);
  Ok(pool)
}
