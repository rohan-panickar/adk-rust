use adk_3d_ui::{app_router, protocol::UiEventAck, server::AppState};

async fn spawn_server() -> (String, tokio::task::JoinHandle<()>) {
    let state = AppState::default();
    let app = app_router(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind test listener");
    let addr = listener.local_addr().expect("listener addr");

    let handle = tokio::spawn(async move {
        axum::serve(listener, app).await.expect("server run");
    });

    (format!("http://{}", addr), handle)
}

#[tokio::test]
async fn dangerous_prompt_requires_approval_event_path() {
    let (base, handle) = spawn_server().await;
    let client = reqwest::Client::new();

    let create = client
        .post(format!("{}/api/3d/session", base))
        .send()
        .await
        .expect("session create response");
    let created: serde_json::Value = create.json().await.expect("session json");
    let session_id = created
        .get("session_id")
        .and_then(serde_json::Value::as_str)
        .expect("session_id field");

    let run = client
        .post(format!("{}/api/3d/run/{}", base, session_id))
        .json(&serde_json::json!({
            "prompt": "rollback payments now"
        }))
        .send()
        .await
        .expect("run response");
    assert!(run.status().is_success());

    let approve = client
        .post(format!("{}/api/3d/event/{}", base, session_id))
        .json(&serde_json::json!({
            "seq": 2,
            "event": {
                "type": "approve_action",
                "action_id": "action-1",
                "approved": true
            }
        }))
        .send()
        .await
        .expect("approve response");

    assert!(approve.status().is_success());
    let ack: UiEventAck = approve.json().await.expect("approve ack");
    assert!(ack.ok);

    handle.abort();
}
