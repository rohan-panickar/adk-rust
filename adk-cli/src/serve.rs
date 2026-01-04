use adk_core::AgentLoader;
use adk_server::{ServerConfig, create_app};
use adk_session::InMemorySessionService;
use anyhow::Result;
use std::sync::Arc;

#[allow(dead_code)] // Part of CLI API, not currently used
pub async fn run_serve(agent_loader: Arc<dyn AgentLoader>, port: u16) -> Result<()> {
    // Initialize telemetry
    let trace_storage = Arc::new(adk_telemetry::memory::SharedTraceStorage::new());
    if let Err(e) = adk_telemetry::init_with_storage("adk-server", trace_storage.clone()) {
        eprintln!("Failed to initialize telemetry: {}", e);
    }

    let session_service = Arc::new(InMemorySessionService::new());

    let mut config = ServerConfig::new(agent_loader, session_service);
    config.trace_storage = Some(trace_storage);

    let app = create_app(config);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    println!("ADK Server starting on http://{}", addr);
    println!("Press Ctrl+C to stop");

    axum::serve(listener, app).await?;

    Ok(())
}
