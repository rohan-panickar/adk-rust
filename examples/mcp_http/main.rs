// MCP HTTP Transport Example
//
// This example demonstrates connecting to real remote MCP servers
// using the streamable HTTP transport.
//
// Features demonstrated:
// - HTTP transport for remote MCP servers
// - Fetch MCP server (web content fetching)
// - Sequential Thinking MCP server (structured problem-solving)
//
// To run this example:
//   cargo run --example mcp_http --features http-transport
//
// Remote MCP servers used:
// - https://remote.mcpservers.org/fetch/mcp - Web content fetching
// - https://remote.mcpservers.org/sequentialthinking/mcp - Structured thinking

use adk_agent::LlmAgentBuilder;
use adk_core::{
    Agent, Content, InvocationContext, Part, ReadonlyContext, RunConfig, Session, State, Toolset,
};
use adk_model::GeminiModel;
use adk_tool::{McpHttpClientBuilder, McpTaskConfig};
use async_trait::async_trait;
use futures::StreamExt;
use serde_json::Value;
use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::time::Duration;

// Mock session for the example
struct MockSession;
impl Session for MockSession {
    fn id(&self) -> &str {
        "mcp-http-session"
    }
    fn app_name(&self) -> &str {
        "mcp-http-example"
    }
    fn user_id(&self) -> &str {
        "user"
    }
    fn state(&self) -> &dyn State {
        &MockState
    }
    fn conversation_history(&self) -> Vec<Content> {
        Vec::new()
    }
}

struct MockState;
impl State for MockState {
    fn get(&self, _key: &str) -> Option<Value> {
        None
    }
    fn set(&mut self, _key: String, _value: Value) {}
    fn all(&self) -> HashMap<String, Value> {
        HashMap::new()
    }
}

struct MockContext {
    session: MockSession,
    user_content: Content,
}

impl MockContext {
    fn new(text: &str) -> Self {
        Self {
            session: MockSession,
            user_content: Content {
                role: "user".to_string(),
                parts: vec![Part::Text {
                    text: text.to_string(),
                }],
            },
        }
    }
}

#[async_trait]
impl ReadonlyContext for MockContext {
    fn invocation_id(&self) -> &str {
        "mcp-http-inv"
    }
    fn agent_name(&self) -> &str {
        "mcp-http-agent"
    }
    fn user_id(&self) -> &str {
        "user"
    }
    fn app_name(&self) -> &str {
        "mcp-http-example"
    }
    fn session_id(&self) -> &str {
        "mcp-http-session"
    }
    fn branch(&self) -> &str {
        "main"
    }
    fn user_content(&self) -> &Content {
        &self.user_content
    }
}

#[async_trait]
impl adk_core::CallbackContext for MockContext {
    fn artifacts(&self) -> Option<Arc<dyn adk_core::Artifacts>> {
        None
    }
}

#[async_trait]
impl InvocationContext for MockContext {
    fn agent(&self) -> Arc<dyn Agent> {
        unimplemented!()
    }
    fn memory(&self) -> Option<Arc<dyn adk_core::Memory>> {
        None
    }
    fn session(&self) -> &dyn Session {
        &self.session
    }
    fn run_config(&self) -> &RunConfig {
        unimplemented!()
    }
    fn end_invocation(&self) {}
    fn ended(&self) -> bool {
        false
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("MCP HTTP Transport Example");
    println!("==========================\n");

    // Check for API key
    let api_key = match env::var("GEMINI_API_KEY") {
        Ok(key) => key,
        Err(_) => {
            println!("❌ GEMINI_API_KEY not set");
            println!("\nTo run this example:");
            println!("  GEMINI_API_KEY=your_key cargo run --example mcp_http --features http-transport");
            return Ok(());
        }
    };

    // Remote MCP server endpoints
    let fetch_server = "https://remote.mcpservers.org/fetch/mcp";
    let thinking_server = "https://remote.mcpservers.org/sequentialthinking/mcp";

    println!("Connecting to remote MCP servers...\n");

    // Connect to Fetch MCP server
    println!("1. Connecting to Fetch MCP server: {}", fetch_server);
    let fetch_toolset = match McpHttpClientBuilder::new(fetch_server)
        .timeout(Duration::from_secs(30))
        .connect()
        .await
    {
        Ok(toolset) => {
            println!("   ✅ Connected to Fetch server!\n");
            Some(toolset)
        }
        Err(e) => {
            println!("   ❌ Failed to connect: {}\n", e);
            None
        }
    };

    // Connect to Sequential Thinking MCP server
    println!(
        "2. Connecting to Sequential Thinking MCP server: {}",
        thinking_server
    );
    let thinking_toolset = match McpHttpClientBuilder::new(thinking_server)
        .timeout(Duration::from_secs(30))
        .connect()
        .await
    {
        Ok(toolset) => {
            // Add task support for long-running thinking operations
            let toolset_with_tasks = toolset.with_task_support(
                McpTaskConfig::enabled()
                    .poll_interval(Duration::from_secs(1))
                    .timeout(Duration::from_secs(120)),
            );
            println!("   ✅ Connected to Sequential Thinking server!\n");
            Some(toolset_with_tasks)
        }
        Err(e) => {
            println!("   ❌ Failed to connect: {}\n", e);
            None
        }
    };

    // Collect tools from connected servers
    let ctx = Arc::new(MockContext::new("init")) as Arc<dyn ReadonlyContext>;
    let mut all_tools = Vec::new();

    if let Some(ref toolset) = fetch_toolset {
        match toolset.tools(ctx.clone()).await {
            Ok(tools) => {
                println!("Fetch server tools:");
                for tool in &tools {
                    println!("  - {}: {}", tool.name(), tool.description());
                }
                all_tools.extend(tools);
            }
            Err(e) => println!("Failed to list Fetch tools: {}", e),
        }
    }

    if let Some(ref toolset) = thinking_toolset {
        match toolset.tools(ctx.clone()).await {
            Ok(tools) => {
                println!("\nSequential Thinking server tools:");
                for tool in &tools {
                    println!("  - {}: {}", tool.name(), tool.description());
                }
                all_tools.extend(tools);
            }
            Err(e) => println!("Failed to list Sequential Thinking tools: {}", e),
        }
    }

    if all_tools.is_empty() {
        println!("\n❌ No tools available. Check your network connection.");
        return Ok(());
    }

    println!("\n✅ Total tools available: {}\n", all_tools.len());

    // Create model and agent
    let model = Arc::new(GeminiModel::new(&api_key, "gemini-1.5-flash")?);

    let mut agent_builder = LlmAgentBuilder::new("mcp-http-agent")
        .description("Agent with remote MCP tools for web fetching and structured thinking")
        .model(model)
        .instruction(
            "You are a helpful assistant with access to remote MCP tools:\n\n\
             1. **Fetch tools** - Retrieve and process web content:\n\
                - Use 'fetch' to get content from URLs (converts HTML to markdown)\n\n\
             2. **Sequential Thinking tools** - Structured problem-solving:\n\
                - Use for complex reasoning tasks that benefit from step-by-step thinking\n\n\
             When asked to fetch web content, use the fetch tool.\n\
             When asked to solve complex problems, use sequential thinking.",
        );

    for tool in all_tools {
        agent_builder = agent_builder.tool(tool);
    }

    let agent = agent_builder.build()?;

    println!("✅ Agent created with remote MCP tools\n");

    // Run a demo query
    let demo_query = "Fetch the content from https://example.com and summarize what you find.";
    println!("Demo query: {}\n", demo_query);

    let ctx = Arc::new(MockContext::new(demo_query));
    let mut stream: std::pin::Pin<
        Box<dyn futures::Stream<Item = adk_core::Result<adk_core::Event>> + Send>,
    > = agent.run(ctx).await?;

    println!("Agent response:");
    println!("--------------");
    while let Some(result) = stream.next().await {
        if let Ok(event) = result
            && let Some(content) = event.llm_response.content
        {
            for part in content.parts {
                if let Part::Text { text } = part {
                    print!("{}", text);
                }
            }
        }
    }
    println!("\n");

    println!("✅ Example complete!");

    Ok(())
}
