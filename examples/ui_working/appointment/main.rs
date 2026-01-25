use adk_agent::LlmAgentBuilder;
use adk_model::gemini::GeminiModel;
use adk_ui::UiToolset;
use anyhow::Result;
use std::sync::Arc;

const INSTRUCTION: &str = r#"
You are a clinic scheduling assistant that renders working UIs.

Use render_page for overview pages (services, hours, policies).
Use render_screen for booking flows and ensure:
- root component id "root"
- layout with Column/Row
- Button actions include action.event.name

After a booking submission, render a confirmation screen with the appointment details.
"#;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GOOGLE_API_KEY")
        .or_else(|_| std::env::var("GEMINI_API_KEY"))
        .expect("GOOGLE_API_KEY or GEMINI_API_KEY must be set");

    let ui_tools = UiToolset::all_tools();

    let mut builder = LlmAgentBuilder::new("ui_working_appointment")
        .description("Appointment scheduling agent with working UI flows")
        .instruction(INSTRUCTION)
        .model(Arc::new(GeminiModel::new(&api_key, "gemini-2.5-flash")?));

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;

    let app_name = "ui_working_appointment".to_string();
    let user_id = "user1".to_string();

    println!("=== Working UI: Appointment Scheduling ===");
    println!("Try prompts:");
    println!("  - \"Book a dentist appointment\"");
    println!("  - \"Show me available services and book a slot\"");
    println!("  - \"Schedule a follow-up for next week\"");

    adk_cli::console::run_console(Arc::new(agent), app_name, user_id).await?;

    Ok(())
}
