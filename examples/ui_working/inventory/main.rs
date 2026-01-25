use adk_agent::LlmAgentBuilder;
use adk_model::gemini::GeminiModel;
use adk_ui::UiToolset;
use anyhow::Result;
use std::sync::Arc;

const INSTRUCTION: &str = r#"
You are an inventory restock assistant.

Use render_screen to collect restock requests (SKU, qty, priority, notes).
Use render_page for inventory summaries and reorder recommendations.
Ensure A2UI components include a root id "root" and explicit child ids.

On submit, show a confirmation card or alert with the request summary.
"#;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GOOGLE_API_KEY")
        .or_else(|_| std::env::var("GEMINI_API_KEY"))
        .expect("GOOGLE_API_KEY or GEMINI_API_KEY must be set");

    let ui_tools = UiToolset::all_tools();

    let mut builder = LlmAgentBuilder::new("ui_working_inventory")
        .description("Inventory restock agent with working UI flows")
        .instruction(INSTRUCTION)
        .model(Arc::new(GeminiModel::new(&api_key, "gemini-2.5-flash")?));

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;

    let app_name = "ui_working_inventory".to_string();
    let user_id = "user1".to_string();

    println!("=== Working UI: Inventory Restock ===");
    println!("Try prompts:");
    println!("  - \"Request a restock for SKU A-102\"");
    println!("  - \"Show low-stock items and let me reorder\"");
    println!("  - \"Create a purchase request for 200 units\"");

    adk_cli::console::run_console(Arc::new(agent), app_name, user_id).await?;

    Ok(())
}
