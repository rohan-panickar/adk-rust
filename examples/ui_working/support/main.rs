use adk_agent::LlmAgentBuilder;
use adk_model::gemini::GeminiModel;
use adk_ui::UiToolset;
use anyhow::Result;
use std::sync::Arc;

const INSTRUCTION: &str = r#"
You are a support intake assistant that renders working UIs.

Use render_screen for the initial intake UI. Build A2UI components with:
- a root component id "root"
- layout via Column/Row
- Button actions using action.event.name

When a user submits, follow up with a confirmation screen or a card/alert.
If a short form is needed, you may use render_form.
"#;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GOOGLE_API_KEY")
        .or_else(|_| std::env::var("GEMINI_API_KEY"))
        .expect("GOOGLE_API_KEY or GEMINI_API_KEY must be set");

    let ui_tools = UiToolset::all_tools();

    let mut builder = LlmAgentBuilder::new("ui_working_support")
        .description("Support intake agent with working UI flows")
        .instruction(INSTRUCTION)
        .model(Arc::new(GeminiModel::new(&api_key, "gemini-2.5-flash")?));

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;

    let app_name = "ui_working_support".to_string();
    let user_id = "user1".to_string();

    println!("=== Working UI: Support Intake ===");
    println!("Try prompts:");
    println!("  - \"Open a support ticket\"");
    println!("  - \"Report a bug in the billing portal\"");
    println!("  - \"My app keeps crashing on launch\"");

    adk_cli::console::run_console(Arc::new(agent), app_name, user_id).await?;

    Ok(())
}
