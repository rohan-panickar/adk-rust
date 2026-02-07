//! Minimal AgentSkills example for workflow agents.
//!
//! Run:
//!   cargo run --manifest-path examples/Cargo.toml --example skills_workflow_minimal

use adk_agent::{CustomAgentBuilder, SequentialAgent};
use adk_core::{Content, Event, Part, Result};
use adk_runner::{Runner, RunnerConfig};
use adk_session::InMemorySessionService;
use futures::StreamExt;
use std::sync::Arc;

fn setup_demo_skills_root() -> Result<std::path::PathBuf> {
    let root = std::env::temp_dir().join("adk_skills_workflow_minimal_demo");
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

    let echo = CustomAgentBuilder::new("echo")
        .description("Echoes current user content")
        .handler(|ctx| async move {
            let text = ctx
                .user_content()
                .parts
                .iter()
                .find_map(|p| p.text())
                .unwrap_or_default()
                .to_string();

            let mut event = Event::new(ctx.invocation_id());
            event.author = "echo".to_string();
            event.llm_response.content = Some(Content::new("assistant").with_text(text));
            Ok(Box::pin(futures::stream::iter(vec![Ok(event)])) as adk_core::EventStream)
        })
        .build()?;

    let workflow = SequentialAgent::new("workflow", vec![Arc::new(echo)])
        .with_skills_from_root(&skills_root)?;

    let runner = Runner::new(RunnerConfig {
        app_name: "skills_workflow_minimal".to_string(),
        agent: Arc::new(workflow),
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
        if let Some(content) = event.llm_response.content {
            let text = content
                .parts
                .iter()
                .filter_map(|p| match p {
                    Part::Text { text } => Some(text.as_str()),
                    _ => None,
                })
                .collect::<Vec<_>>()
                .join("\n");
            println!("{} -> {}", event.author, text);
        }
    }

    Ok(())
}
