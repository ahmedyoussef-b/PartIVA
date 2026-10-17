// E9-R4b-1 — Commandes SQLite réelles pour la table `request` (pilote E9-R4b-1).
// Calqué sur `materials.rs` (style des structs FromRow, requêtes SQLx).
// Retourne une structure alignée sur `RequestWithRelations` (camelCase + client: null + projects: [])
// pour compatibilité avec le mapper UI `mapRequestToUi`.
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct RequestRow {
    pub id: String,
    pub client_id: Option<String>,
    pub machine_ref: Option<String>,
    pub part_description: String,
    pub part_function: Option<String>,
    pub suspected_material: Option<String>,
    pub quantity: i32,
    pub urgency: String,
    pub status: String,
    pub photos: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Retourne la liste des requests enrichie avec `client: null` et `projects: []`
/// pour compatibilité avec `RequestWithRelations` (attendu par le mapper UI).
/// Relation `client` et `projects` non miroitées en E9-R4b-1 (décision Option A).
pub async fn get_demandes_file(pool: &SqlitePool) -> Result<serde_json::Value, sqlx::Error> {
    let rows: Vec<RequestRow> = sqlx::query_as::<_, RequestRow>(
        "SELECT id, client_id, machine_ref, part_description, part_function, \
                suspected_material, quantity, urgency, status, photos, created_at, updated_at \
         FROM request \
         ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;

    // Enrichir chaque row avec client: null et projects: []
    let enriched: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|row| {
            let mut value = serde_json::to_value(&row).unwrap_or_else(|_| json!({}));
            if let Some(obj) = value.as_object_mut() {
                obj.insert("client".to_string(), json!(null));
                obj.insert("projects".to_string(), json!([]));
            }
            value
        })
        .collect();

    Ok(json!(enriched))
}
