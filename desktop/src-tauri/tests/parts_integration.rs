// E8P-S08 — Test d'intégration des commandes parts (Bloc F).
// BDD SQLite temporaire seedée — 6 modes de recherche + pagination + fiche.

use app_lib::parts;

async fn seeded_pool() -> (sqlx::SqlitePool, tempfile::TempDir) {
    let dir = tempfile::tempdir().unwrap();
    let db_path = dir.path().join("parts-integration.db");
    let pool = app_lib::db::connect(&db_path).await.unwrap();

    sqlx::query(
        "INSERT INTO part_category (id, name, slug, created_at, updated_at)
         VALUES ('c1', 'Roulements', 'roulements', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
    )
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO part (id, part_number, name, category_id, material, status, created_at, updated_at)
         VALUES ('p1', 'PTV-ROU-001', 'Roulement à billes', 'c1', 'Acier', 'DRAFT',
                 '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
                ('p2', 'PTV-JOI-002', 'Joint torique', NULL, 'Caoutchouc', 'DRAFT',
                 '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z'),
                ('p3', 'PTV-ROU-003', 'Roulement conique', 'c1', 'Acier', 'DRAFT',
                 '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
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
         VALUES ('s1', 'p2', 'diametre', '45', 'mm',
                 '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
    )
    .execute(&pool)
    .await
    .unwrap();

    (pool, dir)
}

#[tokio::test]
async fn six_search_modes_return_expected_rows() {
    let (pool, _dir) = seeded_pool().await;

    // 1. référence
    let by_ref = parts::search_parts(&pool, "reference", "ROU-001").await.unwrap();
    assert_eq!(by_ref.len(), 1);
    assert_eq!(by_ref[0].id, "p1");

    // 2. nom (2 pièces contiennent « Roulement »)
    let by_name = parts::search_parts(&pool, "name", "Roulement").await.unwrap();
    assert_eq!(by_name.len(), 2);

    // 3. catégorie
    let by_cat = parts::search_parts(&pool, "category", "Roulements").await.unwrap();
    assert_eq!(by_cat.len(), 2);
    assert!(by_cat.iter().all(|p| p.category_id.as_deref() == Some("c1")));

    // 4. matière
    let by_mat = parts::search_parts(&pool, "material", "Caoutchouc").await.unwrap();
    assert_eq!(by_mat.len(), 1);
    assert_eq!(by_mat[0].id, "p2");

    // 5. véhicule (JOIN fitment/vehicle)
    let by_veh = parts::search_parts(&pool, "vehicle", "Clio").await.unwrap();
    assert_eq!(by_veh.len(), 1);
    assert_eq!(by_veh[0].id, "p1");

    // 6. specs (JOIN part_specification)
    let by_specs = parts::search_parts(&pool, "specs", "diametre").await.unwrap();
    assert_eq!(by_specs.len(), 1);
    assert_eq!(by_specs[0].id, "p2");

    // mode inconnu → liste vide (pas d'erreur)
    let unknown = parts::search_parts(&pool, "bogus", "x").await.unwrap();
    assert!(unknown.is_empty());
}

#[tokio::test]
async fn list_and_get_part() {
    let (pool, _dir) = seeded_pool().await;

    let page = parts::list_parts(&pool, 2, 0).await.unwrap();
    assert_eq!(page.len(), 2);
    assert_eq!(page[0].id, "p2", "tri updated_at DESC");

    let page2 = parts::list_parts(&pool, 2, 2).await.unwrap();
    assert_eq!(page2.len(), 1);
    assert_eq!(page2[0].id, "p3", "tri updated_at DESC — p1 (01-02) avant p3 (01-01)");

    let detail = parts::get_part(&pool, "p1").await.unwrap().expect("p1");
    assert_eq!(detail.fitments.len(), 1);
    assert_eq!(detail.fitments[0].vehicle_model, "Clio");
    assert!(get_absent(&pool).await);
}

async fn get_absent(pool: &sqlx::SqlitePool) -> bool {
    parts::get_part(pool, "inexistant").await.unwrap().is_none()
}
