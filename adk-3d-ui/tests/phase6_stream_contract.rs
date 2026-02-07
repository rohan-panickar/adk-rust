use std::time::Duration;

use adk_3d_ui::{app_router, server::AppState};

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
async fn run_prompt_emits_ui_ops_event_on_sse() {
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

    let mut stream_response = client
        .get(format!("{}/api/3d/stream/{}", base, session_id))
        .send()
        .await
        .expect("stream response");
    assert!(stream_response.status().is_success());

    let run = client
        .post(format!("{}/api/3d/run/{}", base, session_id))
        .json(&serde_json::json!({
            "prompt": "show me platform health and incident blast radius"
        }))
        .send()
        .await
        .expect("run response");
    assert!(run.status().is_success());

    let mut saw_ui_ops = false;
    let mut saw_done = false;
    let deadline = tokio::time::Instant::now() + Duration::from_secs(5);

    while tokio::time::Instant::now() < deadline {
        let next = tokio::time::timeout(Duration::from_millis(400), stream_response.chunk()).await;
        let Ok(chunk_result) = next else {
            continue;
        };
        let Ok(chunk_opt) = chunk_result else {
            break;
        };
        let Some(chunk) = chunk_opt else {
            break;
        };

        let text = String::from_utf8_lossy(&chunk);
        if text.contains("event: ui_ops") || text.contains("\"kind\":\"ui_ops\"") {
            saw_ui_ops = true;
        }
        if text.contains("event: done") || text.contains("\"kind\":\"done\"") {
            saw_done = true;
        }
        if saw_ui_ops && saw_done {
            break;
        }
    }

    assert!(saw_ui_ops, "expected ui_ops event on SSE stream");

    handle.abort();
}
