// E9-R4a — Commandes SQLite réelles pour la table `material` (pilote E9-R4a).
// Calqué sur `parts.rs` (style des structs FromRow, query_as, gestion sqlx::Error).
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MaterialRow {
    pub id: String,
    pub slug: String,
    pub code: String,
    pub name: String,
    pub category: String,
    pub density: Option<f64>,
    pub max_temp: Option<i32>,
    pub tensile_strength: Option<i32>,
    pub hardness: Option<String>,
    pub friction_coefficient: Option<f64>,
    pub resistance_chemical: Option<String>,
    pub food_grade: i32,
    pub description: Option<String>,
    pub advantages: String,
    pub common_applications: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn get_materials(pool: &SqlitePool) -> Result<Vec<MaterialRow>, sqlx::Error> {
    sqlx::query_as::<_, MaterialRow>(
        "SELECT id, slug, code, name, category, density, max_temp, tensile_strength, \
                hardness, friction_coefficient, resistance_chemical, food_grade, \
                description, advantages, common_applications, created_at, updated_at \
         FROM material \
         ORDER BY name ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_material_by_slug(
    pool: &SqlitePool,
    slug: &str,
) -> Result<Option<MaterialRow>, sqlx::Error> {
    sqlx::query_as::<_, MaterialRow>(
        "SELECT id, slug, code, name, category, density, max_temp, tensile_strength, \
                hardness, friction_coefficient, resistance_chemical, food_grade, \
                description, advantages, common_applications, created_at, updated_at \
         FROM material \
         WHERE slug = ?",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn get_plastiques(pool: &SqlitePool) -> Result<Vec<MaterialRow>, sqlx::Error> {
    // Retourne tous les matériaux (comportement identique à l'API web /api/plastiques
    // qui n'applique aucun filtre catégorie — voir pull/route.ts). L'enum MaterialCategory
    // ne contient pas de valeur "plastique" explicite ; un filtre LIKE serait partiel et
    // omettrait PTFE/PEEK/PEHD. Retour complet retenu par cohérence avec le web.
    sqlx::query_as::<_, MaterialRow>(
        "SELECT id, slug, code, name, category, density, max_temp, tensile_strength, \
                hardness, friction_coefficient, resistance_chemical, food_grade, \
                description, advantages, common_applications, created_at, updated_at \
         FROM material \
         ORDER BY name ASC",
    )
    .fetch_all(pool)
    .await
}
