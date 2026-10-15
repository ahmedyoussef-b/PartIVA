// E8P-S08 — Test d'intégration sync bout-en-bout (Bloc E).
// wiremock simule les endpoints /api/desktop/sync/* ; SQLite temporaire (tempfile).

use app_lib::sync;
use reqwest::Client;
use std::path::Path;

const MANIFEST: &str = r#"{
  "version": 1,
  "sync_direction": "web_to_local",
  "tables": [
    {"name": "part", "model": "Part", "incremental": true, "pageSize": 500},
    {"name": "vehicle", "model": "Vehicle", "incremental": true, "pageSize": 500},
    {"name": "fitment", "model": "Fitment", "incremental": false, "pageSize": 500}
  ]
}"#;

const PARTS_PAGE: &str = r#"{
  "table": "part",
  "count": 2,
  "since": null,
  "skip": 0,
  "data": [
    {"id": "p1", "partNumber": "PTV-1", "ptvReference": null, "name": "Roulement",
     "description": null, "status": "DRAFT", "categoryId": null, "clientId": null,
     "material": "Acier", "autoCategory": null,
     "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-02T00:00:00.000Z"},
    {"id": "p2", "partNumber": "PTV-2", "ptvReference": null, "name": "Joint",
     "description": null, "status": "DRAFT", "categoryId": null, "clientId": null,
     "material": "Caoutchouc", "autoCategory": null,
     "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-02T00:00:00.000Z"}
  ]
}"#;

const VEHICLES_PAGE: &str = r#"{
  "table": "vehicle",
  "count": 1,
  "since": null,
  "skip": 0,
  "data": [
    {"id": "v1", "make": "Renault", "model": "Clio", "year": 2010, "engine": null,
     "ktype": null, "vin": null,
     "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z"}
  ]
}"#;

const FITMENTS_PAGE: &str = r#"{
  "table": "fitment",
  "count": 1,
  "since": null,
  "skip": 0,
  "data": [
    {"id": "f1", "partId": "p1", "vehicleId": "v1", "notes": null,
     "createdAt": "2026-01-01T00:00:00.000Z"}
  ]
}"#;

async fn seed_pool(dir: &Path) -> sqlx::SqlitePool {
    let db_path = dir.join("sync-integration.db");
    app_lib::db::connect(&db_path).await.unwrap()
}

#[tokio::test]
async fn sync_all_upserts_from_mock_and_tracks_metadata() {
    use wiremock::matchers::{method, path, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    let base = server.uri();

    Mock::given(method("GET"))
        .and(path("/manifest"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(MANIFEST, "application/json"))
        .mount(&server)
        .await;
    Mock::given(method("GET"))
        .and(path("/pull"))
        .and(query_param("table", "part"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(PARTS_PAGE, "application/json"))
        .mount(&server)
        .await;
    Mock::given(method("GET"))
        .and(path("/pull"))
        .and(query_param("table", "vehicle"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(VEHICLES_PAGE, "application/json"))
        .mount(&server)
        .await;
    Mock::given(method("GET"))
        .and(path("/pull"))
        .and(query_param("table", "fitment"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(FITMENTS_PAGE, "application/json"))
        .mount(&server)
        .await;

    let dir = tempfile::tempdir().unwrap();
    let pool = seed_pool(dir.path()).await; // seed_pool applique déjà les migrations

    let http = Client::new();
    let summary = sync::sync_all(&pool, &http, "tok", &base).await.unwrap();
    assert_eq!(summary.tables_synced, 3);
    assert_eq!(summary.rows_total, 4, "2 parts + 1 vehicle + 1 fitment");

    let parts: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM part")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(parts.0, 2);
    let name: (String,) = sqlx::query_as("SELECT name FROM part WHERE id = 'p1'")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(name.0, "Roulement");

    // métadonnées : curseur MAX(updatedAt) pour les tables incrémentales
    let since: (Option<String>,) =
        sqlx::query_as("SELECT last_sync_since FROM sync_metadata WHERE table_name = 'part'")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(since.0.as_deref(), Some("2026-01-02T00:00:00.000Z"));
    let since_full: (Option<String>,) = sqlx::query_as(
        "SELECT last_sync_since FROM sync_metadata WHERE table_name = 'fitment'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(since_full.0, None, "full-refresh : pas de curseur");

    // second passage : idempotence (upsert par id) + curseur `since` transmis au mock
    sync::sync_all(&pool, &http, "tok", &base).await.unwrap();
    let parts_again: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM part")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(parts_again.0, 2, "upsert idempotent — pas de duplication");

    let requests = server
        .received_requests()
        .await
        .unwrap()
        .iter()
        .filter(|r| r.url.as_str().contains("table=part") && r.url.as_str().contains("since="))
        .count();
    assert!(requests > 0, "le second pull doit envoyer since");
}
