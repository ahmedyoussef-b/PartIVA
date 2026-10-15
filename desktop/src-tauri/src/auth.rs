// E8P-S06 — Auth desktop : login BetterAuth + stockage du token de session au keyring OS
// (D-E8P-S06-2 = A, D-E8P-S01-9). Windows Credential Manager en V1 (OS-V1 = Windows).
// Le token n'est JAMAIS logué (Sécurité #7) ni exposé au state JS : il transite par
// le keyring et n'est utilisé que côté Rust pour les appels sync.
use crate::sync::SyncError;

const SERVICE: &str = "com.partiva.desktop";
const ACCOUNT: &str = "session-token";
/// Base d'auth web — publique pour les tests d'intégration (wiremock).
pub const AUTH_BASE_URL: &str = "https://part-iva.vercel.app/api/auth";
/// Origine web — headers posés pour aligner la requête Rust sur celle du
/// navigateur (E8P-S09-ter : élimine l'hypothèse « format de requête divergent »).
const WEB_ORIGIN: &str = "https://part-iva.vercel.app";

fn entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())
}

pub fn save_token(token: &str) -> Result<(), String> {
    entry()?
        .set_password(token)
        .map_err(|e| format!("keyring set: {e}"))
}

pub fn load_token() -> Result<Option<String>, String> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("keyring get: {e}")),
    }
}

pub fn logout() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("keyring delete: {e}")),
    }
}

/// Jeton de sync : keyring en priorité (login interactif), repli sur
/// PARTIVA_SYNC_TOKEN pour le dev (D-E8P-S05-1 = A).
pub fn resolve_token() -> Result<String, SyncError> {
    if let Some(token) = load_token().map_err(SyncError::Payload)? {
        return Ok(token);
    }
    std::env::var("PARTIVA_SYNC_TOKEN").map_err(|_| SyncError::MissingToken)
}

/// Extrait le token de session BetterAuth d'un en-tête Set-Cookie.
/// Format attendu : `better-auth.session_token=<token>.<signature>; Path=/; …`
/// BetterAuth signe le cookie `<token>.<signature>` — la partie avant le premier
/// point est le token brut accepté en `Authorization: Bearer`.
/// Tolère les valeurs repliées par virgule (plusieurs cookies dans un même en-tête).
pub fn extract_session_token(set_cookie: &str) -> Option<String> {
    set_cookie
        .split([';', ','])
        .map(str::trim)
        .find_map(|part| part.strip_prefix("better-auth.session_token="))
        .map(|value| value.split('.').next().unwrap_or(value).to_owned())
        .filter(|token| !token.is_empty())
}

/// Login interactif : POST email/password vers BetterAuth, extraction du token
/// depuis le Set-Cookie, stockage immédiat au keyring. Le token n'est pas renvoyé.
/// `base` : URL de base de l'API auth (production en prod, mock wiremock en test).
///
/// E8P-S09-bis — messages d'erreur détaillés (incident prod : message générique
/// « Identifiants invalides ou service injoignable » masquait la cause réelle —
/// mot de passe vide à cause de l'autofill sur champ contrôlé).
pub async fn login(
    http: &reqwest::Client,
    email: &str,
    password: &str,
    base: &str,
) -> Result<(), String> {
    if email.trim().is_empty() || password.is_empty() {
        return Err("Email ou mot de passe vide".to_string());
    }

    let response = http
        .post(format!("{base}/sign-in/email"))
        .header("Origin", WEB_ORIGIN)
        .header("Referer", format!("{WEB_ORIGIN}/login"))
        .header("User-Agent", "PartIVA-Desktop/0.1.0")
        .header("Accept", "application/json")
        .json(&serde_json::json!({ "email": email, "password": password }))
        .send()
        .await
        .map_err(|e| format!("Service injoignable : {e}"))?;

    let status = response.status();
    if status == reqwest::StatusCode::UNAUTHORIZED {
        // E8P-S09-ter — le corps BetterAuth est inclus : distingue credentials
        // invalides d'une politique serveur (origine, CSRF, rate limit…).
        let body = response.text().await.unwrap_or_default();
        let snippet: String = body.chars().take(200).collect();
        return Err(format!("Identifiants invalides (réponse service : {snippet})"));
    }
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        let snippet: String = body.chars().take(200).collect();
        return Err(format!("Service auth HTTP {} : {snippet}", status.as_u16()));
    }

    let set_cookie = response
        .headers()
        .get_all(reqwest::header::SET_COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .map(str::to_owned)
        .collect::<Vec<_>>();
    let token = set_cookie
        .iter()
        .find_map(|header| extract_session_token(header))
        .ok_or("Session non renvoyée par le service (cookie de session absent)")?;
    save_token(&token)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_token_from_signed_session_cookie() {
        let cookie = "better-auth.session_token=abc123.sigsuffix; Path=/; HttpOnly; SameSite=Lax";
        assert_eq!(
            extract_session_token(cookie).as_deref(),
            Some("abc123"),
            "la signature après le premier point doit être retirée"
        );
    }

    #[test]
    fn extracts_token_when_multiple_cookies_present() {
        let cookie = "other=1; Path=/, better-auth.session_token=tok42.sig; Path=/; HttpOnly";
        assert_eq!(extract_session_token(cookie).as_deref(), Some("tok42"));
    }

    #[test]
    fn returns_none_without_session_cookie() {
        assert!(extract_session_token("other=1; Path=/").is_none());
        assert!(extract_session_token("").is_none());
    }
}
