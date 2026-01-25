# ADK-UI Quickstart (A2UI v0.9)

This guide gets you from a prompt to a rendered A2UI screen using the ADK-UI tools and React renderer.

## 1) Add dependencies

If you are in the ADK monorepo, use workspace dependencies. Otherwise:

```toml
[dependencies]
adk-ui = "<version>"
adk-core = "<version>"
adk-agent = "<version>"
```

For the React renderer:

```bash
npm install @zavora-ai/adk-ui-react
```

## 2) Enable UI tools in your agent

`render_screen` emits A2UI JSONL (createSurface + updateComponents).

```rust
use adk_agent::LlmAgentBuilder;
use adk_ui::UiToolset;

let tools = UiToolset::all_tools();
let mut builder = LlmAgentBuilder::new("ui_agent")
    .instruction(
        "You render UI with A2UI. Use render_screen for screens, render_page for multi-section pages, and render_kit for UI kits.",
    );

for tool in tools {
    builder = builder.tool(tool);
}

let _agent = builder.build()?;
```

## 3) Prompt → Screen (A2UI JSONL)

Prompt your agent:

```
Create a login screen with email + password fields and a primary Sign In button.
```

The model should call `render_screen` and return JSONL like:

```
{"createSurface":{"surfaceId":"main","catalogId":"zavora.ai:adk-ui/default@0.1.0","sendDataModel":true}}
{"updateComponents":{"surfaceId":"main","components":[{"id":"root","component":"Column",...}]}}
```

## 4) Render in React

Use the A2UI store + parser, then render the surface:

```tsx
import {
  A2uiStore,
  A2uiSurfaceRenderer,
  applyParsedMessages,
  parseJsonl,
} from "@zavora-ai/adk-ui-react";

const store = new A2uiStore();

function renderFromJsonl(jsonl: string) {
  const parsed = parseJsonl(jsonl);
  applyParsedMessages(store, parsed);
}

export function App({ jsonl }: { jsonl: string }) {
  renderFromJsonl(jsonl);
  return (
    <A2uiSurfaceRenderer
      store={store}
      surfaceId="main"
      onAction={(payload) => {
        // Send payload.action back to your agent/server
        console.log("A2UI action:", payload);
      }}
    />
  );
}
```

## 5) Next steps

- Use `render_page` for multi-section pages.
- Use `render_kit` to generate catalog + tokens + templates.
- Feed action events back to the agent to keep the “working UI” loop.
