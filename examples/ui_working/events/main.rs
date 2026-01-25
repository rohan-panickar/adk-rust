use adk_agent::LlmAgentBuilder;
use adk_model::gemini::GeminiModel;
use adk_ui::UiToolset;
use anyhow::Result;
use std::sync::Arc;

const INSTRUCTION: &str = r#"
You are an event RSVP assistant with working UI flows.

Use render_page to show event details and agenda.
Use render_screen to collect RSVP details (name, guests, dietary, sessions).
Ensure A2UI components include root id "root" and valid Button actions.

After submission, render a confirmation screen and a calendar link button.
"#;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GOOGLE_API_KEY")
        .or_else(|_| std::env::var("GEMINI_API_KEY"))
        .expect("GOOGLE_API_KEY or GEMINI_API_KEY must be set");

    let ui_tools = UiToolset::all_tools();

    let mut builder = LlmAgentBuilder::new("ui_working_events")
        .description("Event RSVP agent with working UI flows")
        .instruction(INSTRUCTION)
        .model(Arc::new(GeminiModel::new(&api_key, "gemini-2.5-flash")?));

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;

    let app_name = "ui_working_events".to_string();
    let user_id = "user1".to_string();

    println!("=== Working UI: Event RSVP ===");
    println!("Try prompts:");
    println!("  - \"RSVP for the product launch\"");
    println!("  - \"Show event agenda and let me register\"");
    println!("  - \"I want two seats and a vegetarian meal\"");

    adk_cli::console::run_console(Arc::new(agent), app_name, user_id).await?;

    Ok(())
}
