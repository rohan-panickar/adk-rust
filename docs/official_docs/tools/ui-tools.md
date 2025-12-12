# UI Tools

The `adk-ui` crate enables AI agents to dynamically generate rich user interfaces through tool calls. Agents can render forms, cards, alerts, tables, charts, and more - all through a type-safe Rust API that serializes to JSON for frontend consumption.

## Overview

UI tools allow agents to:

- Collect user input through dynamic forms
- Display information with cards, alerts, and notifications
- Present data in tables and charts
- Show progress for multi-step operations
- Create dashboard layouts with multiple components
- Request user confirmation before actions

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
adk-rust = { version = "0.1", features = ["ui"] }
# Or use individual crates:
adk-ui = "0.1"
adk-agent = "0.1"
adk-model = "0.1"
```

### Basic Usage

```rust
use adk_rust::prelude::*;
use adk_rust::ui::UiToolset;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let model = Arc::new(GeminiModel::from_env("gemini-2.0-flash")?);

    // Get all 8 UI tools
    let ui_tools = UiToolset::all_tools();

    // Create AI agent with UI tools
    let mut builder = LlmAgentBuilder::new("ui_agent")
        .model(model)
        .instruction(r#"
            You are a helpful assistant that uses UI components to interact with users.
            Use render_form for collecting information.
            Use render_card for displaying results.
            Use render_alert for notifications.
            Use render_confirm before destructive actions.
        "#);

    for tool in ui_tools {
        builder = builder.tool(tool);
    }

    let agent = builder.build()?;
    Ok(())
}
```

## Available Tools

### render_form

Render interactive forms to collect user input.

```json
{
  "title": "Registration Form",
  "description": "Create your account",
  "fields": [
    {"name": "username", "label": "Username", "type": "text", "required": true},
    {"name": "email", "label": "Email", "type": "email", "required": true},
    {"name": "password", "label": "Password", "type": "password", "required": true},
    {"name": "newsletter", "label": "Subscribe to newsletter", "type": "switch"}
  ],
  "submit_label": "Register"
}
```

**Field types**: `text`, `email`, `password`, `number`, `date`, `select`, `multiselect`, `switch`, `slider`

### render_card

Display information cards with optional action buttons.

```json
{
  "title": "Order Confirmed",
  "description": "Order #12345",
  "content": "Your order has been placed successfully. Expected delivery: Dec 15, 2025.",
  "actions": [
    {"label": "Track Order", "action_id": "track", "variant": "primary"},
    {"label": "Cancel", "action_id": "cancel", "variant": "danger"}
  ]
}
```

**Button variants**: `primary`, `secondary`, `danger`, `ghost`, `outline`

### render_alert

Show notifications and status messages.

```json
{
  "title": "Payment Successful",
  "description": "Your payment of $99.00 has been processed.",
  "variant": "success"
}
```

**Variants**: `info`, `success`, `warning`, `error`

### render_confirm

Request user confirmation before actions.

```json
{
  "title": "Delete Account",
  "message": "Are you sure you want to delete your account? This action cannot be undone.",
  "confirm_label": "Delete",
  "cancel_label": "Keep Account",
  "variant": "danger"
}
```

### render_table

Display tabular data.

```json
{
  "title": "Recent Orders",
  "columns": [
    {"header": "Order ID", "accessor_key": "id"},
    {"header": "Date", "accessor_key": "date"},
    {"header": "Amount", "accessor_key": "amount"},
    {"header": "Status", "accessor_key": "status"}
  ],
  "data": [
    {"id": "#12345", "date": "2025-12-10", "amount": "$99.00", "status": "Delivered"},
    {"id": "#12346", "date": "2025-12-11", "amount": "$149.00", "status": "Shipped"}
  ]
}
```

### render_chart

Create data visualizations.

```json
{
  "title": "Monthly Sales",
  "chart_type": "bar",
  "x_key": "month",
  "y_keys": ["revenue", "profit"],
  "data": [
    {"month": "Jan", "revenue": 4000, "profit": 2400},
    {"month": "Feb", "revenue": 3000, "profit": 1398},
    {"month": "Mar", "revenue": 5000, "profit": 3800}
  ]
}
```

**Chart types**: `bar`, `line`, `area`, `pie`

### render_progress

Show task progress with optional steps.

```json
{
  "title": "Installing Dependencies",
  "value": 65,
  "description": "Installing package 13 of 20...",
  "steps": [
    {"label": "Download", "completed": true},
    {"label": "Extract", "completed": true},
    {"label": "Install", "current": true},
    {"label": "Configure", "completed": false}
  ]
}
```

### render_layout

Create dashboard layouts with multiple sections.

```json
{
  "title": "System Status",
  "description": "Current system health overview",
  "sections": [
    {
      "title": "Services",
      "type": "stats",
      "stats": [
        {"label": "API Server", "value": "Healthy", "status": "operational"},
        {"label": "Database", "value": "Degraded", "status": "warning"},
        {"label": "Cache", "value": "Down", "status": "error"}
      ]
    },
    {
      "title": "Recent Errors",
      "type": "table",
      "columns": [{"header": "Time", "key": "time"}, {"header": "Error", "key": "error"}],
      "rows": [{"time": "10:30", "error": "Connection timeout"}]
    }
  ]
}
```

**Section types**: `stats`, `table`, `chart`, `alert`, `text`

## Filtered Tools

Select only the tools your agent needs:

```rust
let toolset = UiToolset::new()
    .without_chart()      // Disable charts
    .without_table()      // Disable tables
    .without_progress();  // Disable progress

// Or use forms only
let forms_only = UiToolset::forms_only();
```

## Handling UI Events

When users interact with rendered UI (submit forms, click buttons), events are sent back to the agent:

```rust
use adk_ui::{UiEvent, UiEventType};

// UiEvent structure
pub struct UiEvent {
    pub event_type: UiEventType,  // FormSubmit, ButtonClick, InputChange
    pub action_id: Option<String>,
    pub data: Option<HashMap<String, Value>>,
}

// Convert to message for agent
let message = ui_event.to_message();
```

## Streaming UI Updates

For real-time UI updates, use `UiUpdate` to patch components by ID:

```rust
use adk_ui::{UiUpdate, UiOperation};

let update = UiUpdate {
    target_id: "progress-bar".to_string(),
    operation: UiOperation::Patch,
    payload: Some(Component::Progress(Progress {
        id: Some("progress-bar".to_string()),
        value: 75,
        label: Some("75%".to_string()),
    })),
};
```

**Operations**: `Replace`, `Patch`, `Append`, `Remove`

## Component Schema

All 23 component types support optional `id` fields for streaming updates:

**Atoms**: Text, Button, Icon, Image, Badge
**Inputs**: TextInput, NumberInput, Select, MultiSelect, Switch, DateInput, Slider
**Layouts**: Stack, Grid, Card, Container, Divider, Tabs
**Data**: Table, List, KeyValue, CodeBlock
**Visualization**: Chart (bar, line, area, pie)
**Feedback**: Alert, Progress

## React Client

A reference React implementation is provided in `examples/ui_react_client/`:

```bash
# Start the UI server
GOOGLE_API_KEY=... cargo run --example ui_server

# Start the React client
cd examples/ui_react_client
npm install && npm run dev -- --host
```

The React client includes:
- TypeScript types matching the Rust schema
- Component renderer for all 23 types
- Markdown rendering support
- Dark mode support
- Form submission handling

## Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Agent     │ ──[render_* tool]──│ UiResponse  │
│  (LLM)      │                    │   (JSON)    │
└─────────────┘                    └──────┬──────┘
       ▲                                  │
       │                                  │ SSE
       │                                  ▼
       │                           ┌─────────────┐
       └────── UiEvent ◄───────────│   Client    │
              (user action)        │  (React)    │
                                   └─────────────┘
```

## Examples

Three examples demonstrate UI tools:

| Example | Description | Run Command |
|---------|-------------|-------------|
| `ui_agent` | Console demo | `cargo run --example ui_agent` |
| `ui_server` | HTTP server with SSE | `cargo run --example ui_server` |
| `ui_react_client` | React frontend | `cd examples/ui_react_client && npm run dev` |

## Sample Prompts

Test the UI tools with these prompts:

```
# Forms
"I want to register for an account"
"Create a contact form"

# Cards
"Show me my profile"
"Display a product card for a laptop"

# Alerts
"Show a success message"
"Display a warning about expiring session"

# Confirmation
"I want to delete my account"

# Tables
"Show my recent orders"
"List all users"

# Charts
"Show monthly sales chart"
"Display traffic trends"

# Progress
"Show upload progress at 75%"

# Dashboards
"Show system status dashboard"
```
