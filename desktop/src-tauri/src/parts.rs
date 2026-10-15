// E8P-S06 — Lectures SQLite exposées à l'UI desktop (catalogue, recherche, fiche).
// Lecture seule métier (D-E8P-S01-2) — aucune commande d'écriture.
use serde::Serialize;
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Serialize, FromRow)]
pub struct PartRow {
    pub id: String,
    pub part_number: String,
    pub name: String,
    pub category_id: Option<String>,
    pub material: Option<String>,
    pub status: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct PartDetailRow {
    pub id: String,
    pub part_number: String,
    pub name: String,
    pub description: Option<String>,
    pub material: Option<String>,
    pub status: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct SpecRow {
    pub key: String,
    pub value: String,
    pub unit: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ImageRow {
    pub url: String,
    pub alt_text: Option<String>,
    pub is_primary: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct FitmentRow {
    pub vehicle_make: String,
    pub vehicle_model: String,
    pub vehicle_year: i64,
}

#[derive(Debug, Serialize)]
pub struct PartDetail {
    pub part: PartDetailRow,
    pub specifications: Vec<SpecRow>,
    pub images: Vec<ImageRow>,
    pub fitments: Vec<FitmentRow>,
}

const PART_COLUMNS: &str = "id, part_number, name, category_id, material, status, updated_at";

pub async fn list_parts(
    pool: &SqlitePool,
    limit: i64,
    offset: i64,
) -> Result<Vec<PartRow>, sqlx::Error> {
    sqlx::query_as::<_, PartRow>(&format!(
        "SELECT {PART_COLUMNS} FROM part ORDER BY updated_at DESC LIMIT ? OFFSET ?"
    ))
    .bind(limit.clamp(1, 200))
    .bind(offset.max(0))
    .fetch_all(pool)
    .await
}

/// 6 modes de recherche locaux (réplique des modes web — Bloc G).
/// Match statique : aucun SQL composé depuis l'entrée utilisateur (Sécurité #7).
pub async fn search_parts(
    pool: &SqlitePool,
    mode: &str,
    query: &str,
) -> Result<Vec<PartRow>, sqlx::Error> {
    let like = format!("%{query}%");
    let sql = match mode {
        "reference" => format!(
            "SELECT {PART_COLUMNS} FROM part WHERE part_number LIKE ? ORDER BY updated_at DESC LIMIT 100"
        ),
        "name" => format!(
            "SELECT {PART_COLUMNS} FROM part WHERE name LIKE ? ORDER BY updated_at DESC LIMIT 100"
        ),
        "category" => format!(
            "SELECT {PART_COLUMNS} FROM part WHERE category_id IN (SELECT id FROM part_category WHERE name LIKE ? OR slug LIKE ?) ORDER BY updated_at DESC LIMIT 100"
        ),
        "material" => format!(
            "SELECT {PART_COLUMNS} FROM part WHERE material LIKE ? ORDER BY updated_at DESC LIMIT 100"
        ),
        "vehicle" => format!(
            "SELECT DISTINCT p.id, p.part_number, p.name, p.category_id, p.material, p.status, p.updated_at
             FROM part p
             JOIN fitment f ON f.part_id = p.id
             JOIN vehicle v ON v.id = f.vehicle_id
             WHERE v.make LIKE ? OR v.model LIKE ? OR v.vin LIKE ?
             ORDER BY p.updated_at DESC LIMIT 100"
        ),
        "specs" => format!(
            "SELECT DISTINCT p.id, p.part_number, p.name, p.category_id, p.material, p.status, p.updated_at
             FROM part p
             JOIN part_specification s ON s.part_id = p.id
             WHERE s.value LIKE ? OR s.key LIKE ?
             ORDER BY p.updated_at DESC LIMIT 100"
        ),
        _ => return Ok(vec![]),
    };

    let mut q = sqlx::query_as::<_, PartRow>(&sql);
    q = q.bind(&like);
    match mode {
        "category" | "vehicle" | "specs" => q = q.bind(&like),
        _ => {}
    }
    match mode {
        "vehicle" => q = q.bind(&like),
        _ => {}
    }
    q.fetch_all(pool).await
}

pub async fn get_part(pool: &SqlitePool, id: &str) -> Result<Option<PartDetail>, sqlx::Error> {
    let part = sqlx::query_as::<_, PartDetailRow>(
        "SELECT id, part_number, name, description, material, status, updated_at FROM part WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(part) = part else { return Ok(None) };

    let specifications = sqlx::query_as::<_, SpecRow>(
        "SELECT key, value, unit FROM part_specification WHERE part_id = ? ORDER BY key",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    let images = sqlx::query_as::<_, ImageRow>(
        "SELECT url, alt_text, is_primary FROM part_image WHERE part_id = ? ORDER BY sort_order",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    let fitments = sqlx::query_as::<_, FitmentRow>(
        "SELECT v.make AS vehicle_make, v.model AS vehicle_model, v.year AS vehicle_year
         FROM fitment f JOIN vehicle v ON v.id = f.vehicle_id
         WHERE f.part_id = ? ORDER BY v.make, v.model",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    Ok(Some(PartDetail {
        part,
        specifications,
        images,
        fitments,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn seeded_pool(test_name: &str) -> (SqlitePool, std::path::PathBuf) {
        // Fichier unique par test (exécution parallèle — cf. incident sync S05).
        let dir = std::env::temp_dir().join("partiva-parts-test");
        std::fs::create_dir_all(&dir).unwrap();
        let db_path = dir.join(format!("{test_name}-{}.db", std::process::id()));
        let _ = std::fs::remove_file(&db_path);
        let pool = crate::db::connect(&db_path).await.unwrap();
        sqlx::query(
            "INSERT INTO part (id, part_number, name, material, status, created_at, updated_at)
             VALUES ('p1', 'PTV-1', 'Roulement', 'Acier', 'DRAFT', '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
                    ('p2', 'PTV-2', 'Joint', 'Caoutchouc', 'DRAFT', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z')",
        )
        .execute(&pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO vehicle (id, make, model, year, created_at, updated_at)
             VALUES ('v1', 'Renault', 'Clio', 2010, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
        )
        .execute(&pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO fitment (id, part_id, vehicle_id, created_at)
             VALUES ('f1', 'p1', 'v1', '2026-01-01T00:00:00Z')",
        )
        .execute(&pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO part_specification (id, part_id, key, value, unit, created_at, updated_at)
             VALUES ('s1', 'p1', 'diametre', '52', 'mm', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
        )
        .execute(&pool)
        .await
        .unwrap();
        (pool, db_path)
    }

    #[tokio::test]
    async fn list_parts_orders_by_updated_at_desc() {
        let (pool, db_path) = seeded_pool("list").await;
        let rows = list_parts(&pool, 50, 0).await.unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].id, "p2");
        assert_eq!(rows[0].part_number, "PTV-2");
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }

    #[tokio::test]
    async fn search_reference_and_specs_modes() {
        let (pool, db_path) = seeded_pool("search").await;
        let by_ref = search_parts(&pool, "reference", "PTV-1").await.unwrap();
        assert_eq!(by_ref.len(), 1);
        assert_eq!(by_ref[0].id, "p1");

        let by_specs = search_parts(&pool, "specs", "diametre").await.unwrap();
        assert_eq!(by_specs.len(), 1);
        assert_eq!(by_specs[0].id, "p1");

        let by_vehicle = search_parts(&pool, "vehicle", "Clio").await.unwrap();
        assert_eq!(by_vehicle.len(), 1);
        assert_eq!(by_vehicle[0].id, "p1");

        let unknown = search_parts(&pool, "bogus", "x").await.unwrap();
        assert!(unknown.is_empty());
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }

    #[tokio::test]
    async fn get_part_returns_detail_with_relations() {
        let (pool, db_path) = seeded_pool("detail").await;
        let detail = get_part(&pool, "p1").await.unwrap().expect("p1");
        assert_eq!(detail.part.name, "Roulement");
        assert_eq!(detail.specifications.len(), 1);
        assert_eq!(detail.specifications[0].key, "diametre");
        assert_eq!(detail.fitments.len(), 1);
        assert_eq!(detail.fitments[0].vehicle_model, "Clio");
        assert!(get_part(&pool, "nope").await.unwrap().is_none());
        pool.close().await;
        let _ = std::fs::remove_file(&db_path);
    }
}
