// E8P-S05 — Client de synchronisation web → local (unidirectionnel, D-E8P-S01-2).
// Fetch GET /api/desktop/sync/{manifest,pull} + upsert SQLite local + suivi sync_metadata.
// Pull-only (D-E8P-S01-8) — aucun push vers le web.
// Auth : session BetterAuth transmise en Bearer (PARTIVA_SYNC_TOKEN, décision D-E8P-S05-1 = A —
// token dev ; login interactif + keyring en E8P-S06, D-E8P-S01-9).
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use thiserror::Error;

const SYNC_BASE: &str = "https://part-iva.vercel.app/api/desktop/sync";

#[derive(Debug, Error)]
pub enum SyncError {
    #[error("HTTP: {0}")]
    Http(#[from] reqwest::Error),
    #[error("DB: {0}")]
    Db(#[from] sqlx::Error),
    #[error("Auth: PARTIVA_SYNC_TOKEN manquant")]
    MissingToken,
    #[error("Payload: {0}")]
    Payload(String),
}

#[derive(Debug, Deserialize)]
pub struct ManifestResponse {
    pub version: u32,
    pub sync_direction: String,
    pub tables: Vec<TableSpec>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableSpec {
    pub name: String,
    pub model: String,
    pub incremental: bool,
    pub page_size: u64,
}

#[derive(Debug, Deserialize)]
pub struct PullResponse {
    pub table: String,
    pub count: usize,
    pub since: Option<String>,
    pub skip: u64,
    pub data: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SyncSummary {
    pub tables_synced: usize,
    pub rows_total: usize,
    pub duration_ms: u128,
}

/// Effectue la synchronisation complète web → local.
/// - tables incrémentales : boucle de pages `since` (curseur sync_metadata) + upsert par id
/// - tables full-refresh (fitment, part_image, part_version — D-E8P-S03-1) : DELETE + re-pull paginé
pub async fn sync_all(
    pool: &SqlitePool,
    http: &reqwest::Client,
    token: &str,
) -> Result<SyncSummary, SyncError> {
    let started = std::time::Instant::now();
    let manifest = fetch_manifest(http, token).await?;

    if manifest.sync_direction != "web_to_local" {
        return Err(SyncError::Payload(format!(
            "direction inattendue : {}",
            manifest.sync_direction
        )));
    }

    let mut rows_total = 0usize;
    for table in &manifest.tables {
        ensure_metadata_row(pool, &table.name, table.incremental).await?;
        let since = if table.incremental {
            read_since(pool, &table.name).await?
        } else {
            None
        };

        let mut synced = 0usize;
        let mut max_updated_at: Option<String> = None;
        let mut skip = 0u64;
        loop {
            let page = fetch_pull(http, token, &table.name, since.as_deref(), skip).await?;
            if page.count == 0 && skip == 0 && !table.incremental {
                // Full-refresh sur table distante vide : on nettoie quand même le miroir local.
                sqlx::query(&format!("DELETE FROM {}", table.name))
                    .execute(pool)
                    .await?;
            }
            if page.count > 0 {
                if !table.incremental && skip == 0 {
                    // Full-refresh : purge avant réinsertion (source de vérité = web).
                    sqlx::query(&format!("DELETE FROM {}", table.name))
                        .execute(pool)
                        .await?;
                }
                let upserted = upsert_table(pool, &table.name, &page.data).await?;
                synced += upserted;
                if table.incremental {
                    if let Some(max) = max_updated_at_in(&page.data) {
                        max_updated_at = Some(match max_updated_at {
                            Some(cur) if cur >= max => cur,
                            _ => max,
                        });
                    }
                }
            }
            if (page.count as u64) < table.page_size {
                break;
            }
            skip += table.page_size;
        }

        update_metadata(
            pool,
            &table.name,
            if table.incremental {
                max_updated_at.or(since)
            } else {
                None
            },
            synced,
        )
        .await?;
        rows_total += synced;
        log::info!(
            "[sync] table={} rows={} incremental={}",
            table.name,
            synced,
            table.incremental
        );
    }

    Ok(SyncSummary {
        tables_synced: manifest.tables.len(),
        rows_total,
        duration_ms: started.elapsed().as_millis(),
    })
}

pub async fn fetch_manifest(
    http: &reqwest::Client,
    token: &str,
) -> Result<ManifestResponse, SyncError> {
    let resp = http
        .get(format!("{SYNC_BASE}/manifest"))
        .bearer_auth(token)
        .send()
        .await?
        .error_for_status()?
        .json::<ManifestResponse>()
        .await?;
    Ok(resp)
}

pub async fn fetch_pull(
    http: &reqwest::Client,
    token: &str,
    table: &str,
    since: Option<&str>,
    skip: u64,
) -> Result<PullResponse, SyncError> {
    let mut url = format!("{SYNC_BASE}/pull?table={table}&skip={skip}");
    if let Some(s) = since {
        url.push_str(&format!("&since={s}"));
    }
    let resp = http
        .get(&url)
        .bearer_auth(token)
        .send()
        .await?
        .error_for_status()?
        .json::<PullResponse>()
        .await?;
    Ok(resp)
}

// ─── sync_metadata ────────────────────────────────────────────────────────────

async fn ensure_metadata_row(pool: &SqlitePool, name: &str, incremental: bool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT OR IGNORE INTO sync_metadata (table_name, full_refresh_required) VALUES (?, ?)",
    )
    .bind(name)
    .bind(if incremental { 0 } else { 1 })
    .execute(pool)
    .await?;
    Ok(())
}

async fn read_since(pool: &SqlitePool, name: &str) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(Option<String>,)> =
        sqlx::query_as("SELECT last_sync_since FROM sync_metadata WHERE table_name = ?")
            .bind(name)
            .fetch_optional(pool)
            .await?;
    Ok(row.and_then(|(s,)| s))
}

async fn update_metadata(
    pool: &SqlitePool,
    name: &str,
    since: Option<String>,
    row_count: usize,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE sync_metadata SET last_sync_at = ?, last_sync_since = COALESCE(?, last_sync_since), row_count = ? WHERE table_name = ?",
    )
    .bind(chrono::Utc::now().to_rfc3339())
    .bind(since)
    .bind(row_count as i64)
    .bind(name)
    .execute(pool)
    .await?;
    Ok(())
}

// ─── upserts (match statique — aucun SQL dynamique de données, Sécurité #7) ───

async fn upsert_table(
    pool: &SqlitePool,
    name: &str,
    rows: &[serde_json::Value],
) -> Result<usize, SyncError> {
    match name {
        "part" => upsert_parts(pool, rows).await,
        "vehicle" => upsert_vehicles(pool, rows).await,
        "fitment" => upsert_fitments(pool, rows).await,
        "part_image" => upsert_part_images(pool, rows).await,
        "part_version" => upsert_part_versions(pool, rows).await,
        "part_specification" => upsert_part_specifications(pool, rows).await,
        "part_category" => upsert_part_categories(pool, rows).await,
        other => Err(SyncError::Payload(format!("table inconnue : {other}"))),
    }
}

// Helpers de lecture JSON (champs absents côté web → NULL, jamais inventés — Règle #1).
fn s(v: &serde_json::Value, key: &str) -> Option<String> {
    v.get(key).and_then(|x| x.as_str()).map(str::to_owned)
}

fn i(v: &serde_json::Value, key: &str) -> Option<i64> {
    v.get(key).and_then(|x| x.as_i64())
}

fn f(v: &serde_json::Value, key: &str) -> Option<f64> {
    v.get(key).and_then(|x| x.as_f64())
}

fn b(v: &serde_json::Value, key: &str) -> Option<i64> {
    v.get(key)
        .and_then(|x| x.as_bool())
        .map(|x| if x { 1 } else { 0 })
}

async fn upsert_parts(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO part (id, part_number, ptv_reference, name, description, status, category_id, client_id, material, auto_category, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "partNumber"))
        .bind(s(r, "ptvReference"))
        .bind(s(r, "name"))
        .bind(s(r, "description"))
        .bind(s(r, "status"))
        .bind(s(r, "categoryId"))
        .bind(s(r, "clientId"))
        .bind(s(r, "material"))
        .bind(s(r, "autoCategory"))
        .bind(s(r, "createdAt"))
        .bind(s(r, "updatedAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_vehicles(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO vehicle (id, make, model, year, engine, ktype, vin, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "make"))
        .bind(s(r, "model"))
        .bind(i(r, "year"))
        .bind(s(r, "engine"))
        .bind(s(r, "ktype"))
        .bind(s(r, "vin"))
        .bind(s(r, "createdAt"))
        .bind(s(r, "updatedAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_fitments(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO fitment (id, part_id, vehicle_id, notes, created_at)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "partId"))
        .bind(s(r, "vehicleId"))
        .bind(s(r, "notes"))
        .bind(s(r, "createdAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_part_images(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO part_image (id, part_id, url, public_id, alt_text, caption, sort_order, is_primary, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "partId"))
        .bind(s(r, "url"))
        .bind(s(r, "publicId"))
        .bind(s(r, "altText"))
        .bind(s(r, "caption"))
        .bind(i(r, "order"))
        .bind(b(r, "isPrimary"))
        .bind(s(r, "createdAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_part_versions(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        // snapshot : Json web → TEXT JSON sérialisé
        let snapshot = r
            .get("snapshot")
            .map(|v| v.to_string())
            .unwrap_or_else(|| "{}".to_string());
        sqlx::query(
            "INSERT OR REPLACE INTO part_version (id, part_id, version_number, snapshot, audit_log_id, created_by_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "partId"))
        .bind(i(r, "versionNumber"))
        .bind(snapshot)
        .bind(s(r, "auditLogId"))
        .bind(s(r, "createdById"))
        .bind(s(r, "createdAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_part_specifications(
    pool: &SqlitePool,
    rows: &[serde_json::Value],
) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO part_specification (id, part_id, key, value, unit, tolerance_min, tolerance_max, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "partId"))
        .bind(s(r, "key"))
        .bind(s(r, "value"))
        .bind(s(r, "unit"))
        .bind(f(r, "toleranceMin"))
        .bind(f(r, "toleranceMax"))
        .bind(s(r, "createdAt"))
        .bind(s(r, "updatedAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

async fn upsert_part_categories(pool: &SqlitePool, rows: &[serde_json::Value]) -> Result<usize, SyncError> {
    let mut count = 0;
    for r in rows {
        sqlx::query(
            "INSERT OR REPLACE INTO part_category (id, name, slug, description, parent_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(s(r, "id"))
        .bind(s(r, "name"))
        .bind(s(r, "slug"))
        .bind(s(r, "description"))
        .bind(s(r, "parentId"))
        .bind(s(r, "createdAt"))
        .bind(s(r, "updatedAt"))
        .execute(pool)
        .await?;
        count += 1;
    }
    Ok(count)
}

fn max_updated_at_in(rows: &[serde_json::Value]) -> Option<String> {
    rows.iter()
        .filter_map(|r| s(r, "updatedAt"))
        .max()
        .map(|v| v)
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn temp_pool(test_name: &str) -> (SqlitePool, std::path::PathBuf) {
        // Fichier unique par test (exécution parallèle) — évite le rejeu concurrent des migrations.
        let dir = std::env::temp_dir().join("partiva-sync-test");
        std::fs::create_dir_all(&dir).unwrap();
        let db_path = dir.join(format!("{test_name}-{}.db", std::process::id()));
        let _ = std::fs::remove_file(&db_path);
        let pool = crate::db::connect(&db_path).await.unwrap();
        (pool, db_path)
    }

    #[tokio::test]
    async fn upsert_parts_maps_web_fields_to_local_columns() {
        let (pool, db_path) = temp_pool("parts").await;
        let rows = vec![serde_json::json!({
            "id": "p1",
            "partNumber": "PTV-2026-000001",
            "ptvReference": null,
            "name": "Roulement",
            "description": null,
            "status": "DRAFT",
            "categoryId": null,
            "clientId": null,
            "material": null,
            "autoCategory": null,
            "createdAt": "2026-01-01T00:00:00.000Z",
            "updatedAt": "2026-01-02T00:00:00.000Z"
        })];
        let n = upsert_parts(&pool, &rows).await.unwrap();
        assert_eq!(n, 1);
        let row: (String, String, String) =
            sqlx::query_as("SELECT id, part_number, name FROM part WHERE id = 'p1'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.1, "PTV-2026-000001");
        assert_eq!(row.2, "Roulement");
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }

    #[tokio::test]
    async fn upsert_fitments_full_refresh_then_delete() {
        let (pool, db_path) = temp_pool("fitments").await;
        // dépendances FK (part, vehicle)
        upsert_parts(
            &pool,
            &[serde_json::json!({"id":"p1","partNumber":"A","name":"n","status":"DRAFT","createdAt":"2026-01-01T00:00:00.000Z","updatedAt":"2026-01-01T00:00:00.000Z"})],
        )
        .await
        .unwrap();
        upsert_vehicles(
            &pool,
            &[serde_json::json!({"id":"v1","make":"Renault","model":"Clio","year":2010,"createdAt":"2026-01-01T00:00:00.000Z","updatedAt":"2026-01-01T00:00:00.000Z"})],
        )
        .await
        .unwrap();
        upsert_fitments(
            &pool,
            &[serde_json::json!({"id":"f1","partId":"p1","vehicleId":"v1","notes":null,"createdAt":"2026-01-01T00:00:00.000Z"})],
        )
        .await
        .unwrap();
        let c: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM fitment")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(c.0, 1);
        // full-refresh : purge miroir
        sqlx::query("DELETE FROM fitment").execute(&pool).await.unwrap();
        let c2: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM fitment")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(c2.0, 0);
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }

    #[tokio::test]
    async fn metadata_row_created_for_new_table_and_updated() {
        let (pool, db_path) = temp_pool("metadata").await;
        ensure_metadata_row(&pool, "part_specification", true).await.unwrap();
        update_metadata(&pool, "part_specification", Some("2026-01-05".into()), 3)
            .await
            .unwrap();
        let row: (Option<String>, i64) =
            sqlx::query_as("SELECT last_sync_since, row_count FROM sync_metadata WHERE table_name = 'part_specification'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row.0.as_deref(), Some("2026-01-05"));
        assert_eq!(row.1, 3);
        // mise à jour sans nouveau curseur : last_sync_since conservé
        update_metadata(&pool, "part_specification", None, 0).await.unwrap();
        let row2: (Option<String>,) =
            sqlx::query_as("SELECT last_sync_since FROM sync_metadata WHERE table_name = 'part_specification'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(row2.0.as_deref(), Some("2026-01-05"));
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }

    #[tokio::test]
    async fn manifest_json_parses_to_contract() {
        let json = serde_json::json!({
            "version": 1,
            "sync_direction": "web_to_local",
            "tables": [
                {"name": "part", "model": "Part", "incremental": true, "pageSize": 500},
                {"name": "fitment", "model": "Fitment", "incremental": false, "pageSize": 500}
            ]
        });
        let m: ManifestResponse = serde_json::from_value(json).unwrap();
        assert_eq!(m.version, 1);
        assert_eq!(m.tables.len(), 2);
        assert!(m.tables[0].incremental);
        assert!(!m.tables[1].incremental);
        assert_eq!(m.tables[0].page_size, 500);
    }
}
