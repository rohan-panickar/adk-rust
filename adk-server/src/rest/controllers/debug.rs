use crate::ServerConfig;
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use serde::Serialize;


#[derive(Clone)]
pub struct DebugController {
    #[allow(dead_code)] // Reserved for future debug functionality
    config: ServerConfig,
}

impl DebugController {
    pub fn new(config: ServerConfig) -> Self {
        Self { config }
    }
}

#[derive(Serialize)]
pub struct GraphResponse {
    #[serde(rename = "dotSrc")]
    pub dot_src: String,
}

#[derive(Serialize)]
pub struct TraceResponse {
    pub spans: Vec<adk_telemetry::memory::SpanData>,
}

pub async fn get_trace(
    State(controller): State<DebugController>,
    Path(event_id): Path<String>,
) -> Result<Json<Vec<adk_telemetry::memory::SpanData>>, StatusCode> {
    if let Some(storage) = &controller.config.trace_storage {
        if let Some(spans) = storage.get_trace(&event_id) {
            return Ok(Json(spans));
        }
    }
    
    // Return empty list if not found or no storage
    Ok(Json(Vec::new()))
}

pub async fn get_session_traces(
    State(controller): State<DebugController>,
    Path(session_id): Path<String>,
) -> Result<Json<Vec<adk_telemetry::memory::SpanData>>, StatusCode> {
    if let Some(storage) = &controller.config.trace_storage {
        if let Some(spans) = storage.get_trace(&session_id) {
            return Ok(Json(spans));
        }
    }
    
    Ok(Json(Vec::new()))
}

pub async fn get_graph(
    State(_controller): State<DebugController>,
    Path((_app_name, _user_id, _session_id, _event_id)): Path<(String, String, String, String)>,
) -> Result<Json<GraphResponse>, StatusCode> {
    // Stub: Return a simple DOT graph
    let dot_src = "digraph G { Agent -> User [label=\"response\"]; }".to_string();
    Ok(Json(GraphResponse { dot_src }))
}
