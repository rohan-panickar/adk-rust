//! Minimal AgentSkills example for `LlmAgentBuilder`.
//!
//! Run:
//!   cargo run --manifest-path examples/Cargo.toml --example skills_llm_minimal

use adk_agent::LlmAgentBuilder;
use adk_core::{Content, Llm, LlmRequest, LlmResponse, LlmResponseStream, Part, Result};
use adk_runner::{Runner, RunnerConfig};
use adk_session::InMemorySessionService;
use async_trait::async_trait;
use futures::{StreamExt, stream};
use std::sync::Arc;

struct MockLlm;

#[async_trait]
impl Llm for MockLlm {
    fn name(&self) -> &str {
        "mock-llm"
    }

    async fn generate_content(&self, _req: LlmRequest, _stream: bool) -> Result<LlmResponseStream> {
        let response = LlmResponse {
            content: Some(Content::new("model").with_text("Mock response")),
            usage_metadata: None,
            finish_reason: None,
            citation_metadata: None,
            partial: false,
            turn_complete: true,
            interrupted: false,
            error_code: None,
            error_message: None,
        };
        Ok(Box::pin(stream::iter(vec![Ok(response)])))
    }
}

fn setup_demo_skills_root() -> Result<std::path::PathBuf> {
    let root = std::env::temp_dir().join("adk_skills_llm_minimal_demo");
    let skills_dir = root.join(".skills");
    std::fs::create_dir_all(&skills_dir)?;
    std::fs::write(
        skills_dir.join("search.md"),
        "---\nname: search\ndescription: Search source code\ntags: [search, code]\n---\nUse rg --files, then rg <pattern>.\n",
    )?;
    Ok(root)
}

#[tokio::main]
async fn main() -> Result<()> {
    let skills_root = setup_demo_skills_root()?;

    let agent = LlmAgentBuilder::new("assistant")
        .description("Assistant with local skills")
        .instruction("Respond briefly")
        .model(Arc::new(MockLlm))
        .with_skills_from_root(&skills_root)?
        .build()?;

    let runner = Runner::new(RunnerConfig {
        app_name: "skills_llm_minimal".to_string(),
        agent: Arc::new(agent),
        session_service: Arc::new(InMemorySessionService::new()),
        artifact_service: None,
        memory_service: None,
        plugin_manager: None,
        run_config: None,
    })?;

    let mut stream = runner
        .run(
            "user".to_string(),
            "session".to_string(),
            Content::new("user").with_text("Please search this repository for TODO markers."),
        )
        .await?;

    while let Some(event) = stream.next().await {
        let event = event?;
        if event.author == "assistant" {
            let text = event
                .llm_response
                .content
                .unwrap_or_else(|| Content { role: "model".to_string(), parts: vec![] })
                .parts
                .iter()
                .filter_map(|p| match p {
                    Part::Text { text } => Some(text.as_str()),
                    _ => None,
                })
                .collect::<Vec<_>>()
                .join("\n");
            println!("{text}");
        }
    }

    Ok(())
}
