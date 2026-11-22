// A7.1-c — Recherche de composants (catalogue local `components` + index FTS5).
// FTS5 (BM25, stemming porter) en primaire, repli LIKE si l'index est vide ou absent.

use sqlx::SqlitePool;

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct ComponentRow {
    pub id: String,
    pub mpn: Option<String>,
    pub manufacturer: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub footprint: Option<String>,
    pub symbol: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub supplier: Option<String>,
    pub stock: Option<i64>,
}

const SELECT_COLUMNS: &str = "id, mpn, manufacturer, description, category, footprint, symbol, \
     price, currency, supplier, stock";

/// Échappe une entrée utilisateur pour FTS5 : phrase entre guillemets,
/// guillemets internes doublés (évite les erreurs de syntaxe `MATCH`).
fn escape_fts5_query(query: &str) -> String {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    format!("\"{}\"", trimmed.replace('"', "\"\""))
}

/// Recherche FTS5 (BM25) sur `components_fts`.
pub async fn search_components_fts(
    pool: &SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<ComponentRow>, sqlx::Error> {
    let phrase = escape_fts5_query(query);
    if phrase.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_as::<_, ComponentRow>(&format!(
        "SELECT c.{SELECT_COLUMNS} \
         FROM components_fts f \
         JOIN components c ON c.id = f.component_id \
         WHERE components_fts MATCH ? \
         ORDER BY bm25(components_fts) \
         LIMIT ?"
    ))
    .bind(phrase)
    .bind(limit.clamp(1, 100))
    .fetch_all(pool)
    .await
}

/// Repli LIKE (insensible à la casse ASCII) sur les champs textuels.
pub async fn search_components_like(
    pool: &SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<ComponentRow>, sqlx::Error> {
    let like = format!("%{}%", query.trim());

    sqlx::query_as::<_, ComponentRow>(&format!(
        "SELECT {SELECT_COLUMNS} FROM components \
         WHERE description LIKE ? OR mpn LIKE ? OR category LIKE ? \
            OR symbol LIKE ? OR footprint LIKE ? OR manufacturer LIKE ? \
         LIMIT ?"
    ))
    .bind(&like)
    .bind(&like)
    .bind(&like)
    .bind(&like)
    .bind(&like)
    .bind(&like)
    .bind(limit.clamp(1, 100))
    .fetch_all(pool)
    .await
}

/// Recherche de composants : FTS5 en primaire, repli LIKE si vide ou en erreur.
pub async fn search_components(
    pool: &SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<ComponentRow>, sqlx::Error> {
  let limit = limit.clamp(1, 100);
  if query.trim().is_empty() {
    return Ok(Vec::new());
  }

  match search_components_fts(pool, query, limit).await {
    Ok(rows) if !rows.is_empty() => return Ok(rows),
    Ok(_) => {}
    Err(error) => {
      log::warn!("[components] FTS5 indisponible, repli LIKE : {error}");
    }
  }

  search_components_like(pool, query, limit).await
}