use adk_agent::LlmAgentBuilder;
use adk_model::gemini::GeminiModel;
use adk_ui::UiToolset;
use anyhow::Result;
use std::sync::Arc;

const INSTRUCTION: &str = r#"
You are a facilities maintenance assistant.

Use render_screen to intake work orders (location, issue type, urgency, contact).
Use render_page for maintenance guidelines or status summaries.
Ensure A2UI components include root id "root".

After intake, render a confirmation with next steps and an emergency contact action.
"#;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GOOGLE_API_KEY")
        .or_else(|_| std::env::var("GEMINI_API_KEY"))
        .expect("GOOGLE_API_KEY or GEMINI_API_KEY must be set");

    let ui_tools = UiToolset::all_tools();

    let mut builder = LlmAgentBuilder::new("ui_working_facilities")
        .description("Facilities maintenance agent with working UI flows")
        .instruction(INSTRUCTION)
        .model(Arc::new(GeminiModel::new(&api_key, "gemini-2.5-flash")?));

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;

    let app_name = "ui_working_facilities".to_string();
    let user_id = "user1".to_string();

    println!("=== Working UI: Facilities Maintenance ===");
    println!("Try prompts:");
    println!("  - \"Report a leaking pipe on floor 3\"");
    println!("  - \"Create a maintenance work order\"");
    println!("  - \"Show safety instructions for a power outage\"");

    adk_cli::console::run_console(Arc::new(agent), app_name, user_id).await?;

    Ok(())
}
