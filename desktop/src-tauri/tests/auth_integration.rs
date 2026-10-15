// E8P-S08 — Tests d'intégration auth (Bloc D).
// Mock HTTP BetterAuth (wiremock) + keyring OS réel (Windows uniquement — CI non couverte).

use reqwest::Client;

/// Teste le flux login complet contre un serveur mock : réponse 200 avec un
/// Set-Cookie signé → extraction du token → stockage keyring → relecture → logout.
/// Limitations : keyring OS réel (Windows Credential Manager) — le test écrit puis
/// supprime une entrée de test ; non exécutable sur un système sans keyring (CI).
#[cfg(windows)]
#[tokio::test]
async fn login_extracts_token_and_stores_in_keyring() {
    use wiremock::matchers::{body_string_contains, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/sign-in/email"))
        .and(body_string_contains("ops@partiva.dev"))
        .respond_with(
            ResponseTemplate::new(200)
                .insert_header(
                    "Set-Cookie",
                    // E8P-S09-quater-bis — nom réel en production HTTPS
                    "__Secure-better-auth.session_token=tok-integration-42.sigvalue; Path=/; Secure; HttpOnly",
                )
                .set_body_json(serde_json::json!({ "user": { "id": "u1" } })),
        )
        .mount(&server)
        .await;

    let http = Client::new();
    app_lib::auth::login(&http, "ops@partiva.dev", "secret", &server.uri())
        .await
        .expect("login doit réussir");

    let stored = app_lib::auth::load_token().expect("load_token");
    assert_eq!(stored.as_deref(), Some("tok-integration-42"));

    // cleanup : on retire l'entrée de test du keyring
    app_lib::auth::logout().expect("logout");
    assert_eq!(app_lib::auth::load_token().unwrap(), None);
}

/// Le serveur mock renvoie 401 → le login échoue sans écrire au keyring.
#[tokio::test]
async fn login_rejects_invalid_credentials() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/sign-in/email"))
        .respond_with(ResponseTemplate::new(401).set_body_json(serde_json::json!({
            "message": "Invalid email or password"
        })))
        .mount(&server)
        .await;

    let http = Client::new();
    let result = app_lib::auth::login(&http, "bad@partiva.dev", "wrong", &server.uri()).await;
    let err = result.expect_err("login doit échouer en 401");
    assert!(err.contains("Identifiants invalides"), "erreur : {err}");
}
