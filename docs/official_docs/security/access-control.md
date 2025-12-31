# Access Control

Enterprise-grade access control for AI agents using `adk-auth`.

## Overview

`adk-auth` provides role-based access control (RBAC) with audit logging for ADK agents. Control which users can access which tools, and log all access attempts for compliance.

## Installation

```toml
[dependencies]
adk-auth = "0.1.8"
```

## Quick Start

```rust
use adk_auth::{Permission, Role, AccessControl, AuthMiddleware, FileAuditSink};

// Define roles
let admin = Role::new("admin")
    .allow(Permission::AllTools);

let analyst = Role::new("analyst")
    .allow(Permission::Tool("search".into()))
    .allow(Permission::Tool("summarize".into()))
    .deny(Permission::Tool("code_exec".into()));

// Build access control
let ac = AccessControl::builder()
    .role(admin)
    .role(analyst)
    .assign("alice@company.com", "admin")
    .assign("bob@company.com", "analyst")
    .build()?;

// Create middleware with audit logging
let audit = FileAuditSink::new("/var/log/adk/audit.jsonl")?;
let middleware = AuthMiddleware::with_audit(ac, audit);

// Protect tools
let protected_tools = middleware.protect_all(tools);
```

## Permission Types

| Permission | Description |
|-----------|-------------|
| `Tool("name")` | Access to a specific tool |
| `AllTools` | Access to all tools (wildcard) |
| `Agent("name")` | Access to a specific agent |
| `AllAgents` | Access to all agents (wildcard) |

## Defining Roles

Roles combine allowed and denied permissions. **Deny rules take precedence over allow rules.**

```rust
let role = Role::new("data_analyst")
    .allow(Permission::Tool("query_database".into()))
    .allow(Permission::Tool("generate_chart".into()))
    .deny(Permission::Tool("delete_data".into()));
```

### Multi-Role Users

Users can have multiple roles. Access is granted if **any** role allows the permission (unless explicitly denied).

```rust
let ac = AccessControl::builder()
    .role(reader)
    .role(writer)
    .assign("alice", "reader")
    .assign("alice", "writer")  // Alice has both roles
    .build()?;
```

## Protecting Tools

### Option 1: AuthMiddleware (Recommended)

```rust
let middleware = AuthMiddleware::new(ac);
let protected_tools = middleware.protect_all(tools);
```

### Option 2: With Audit Logging

```rust
let audit = FileAuditSink::new("audit.jsonl")?;
let middleware = AuthMiddleware::with_audit(ac, audit);
let protected_tools = middleware.protect_all(tools);
```

### Option 3: Single Tool

```rust
use adk_auth::ToolExt;

let protected = my_tool.with_access_control(Arc::new(ac));
```

## Audit Logging

All access attempts are logged in JSONL format:

```json
{"timestamp":"2025-01-01T10:30:00Z","user":"bob","session_id":"sess-abc","event_type":"tool_access","resource":"search","outcome":"allowed"}
{"timestamp":"2025-01-01T10:30:01Z","user":"bob","session_id":"sess-abc","event_type":"tool_access","resource":"code_exec","outcome":"denied"}
```

### Custom Audit Sink

Implement `AuditSink` for custom logging:

```rust
#[async_trait]
impl AuditSink for MyAuditSink {
    async fn log(&self, event: AuditEvent) -> Result<(), AuthError> {
        // Send to database, external service, etc.
        Ok(())
    }
}
```

## Error Handling

```rust
match ac.check("user", &Permission::Tool("dangerous".into())) {
    Ok(()) => println!("Access granted"),
    Err(AccessDenied { user, permission }) => {
        println!("Access denied for {} to {}", user, permission);
    }
}
```

## Best Practices

1. **Deny by default** - Only grant permissions explicitly needed
2. **Use explicit denies** - Critical tools should have explicit deny rules
3. **Enable audit logging** - Required for compliance and debugging
4. **Multi-role carefully** - Avoid permission escalation through role combinations
