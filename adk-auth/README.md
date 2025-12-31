# adk-auth

Access control and authentication for Rust Agent Development Kit (ADK-Rust).

[![Crates.io](https://img.shields.io/crates/v/adk-auth.svg)](https://crates.io/crates/adk-auth)
[![Documentation](https://docs.rs/adk-auth/badge.svg)](https://docs.rs/adk-auth)
[![License](https://img.shields.io/crates/l/adk-auth.svg)](LICENSE)

## Overview

`adk-auth` provides enterprise-grade access control for AI agents:

- **Role-Based Access** - Define roles with tool/agent permissions
- **Permission Scopes** - Fine-grained allow/deny rules (deny precedence)
- **Audit Logging** - Log all access attempts to JSONL files
- **Middleware Integration** - Wrap tools with automatic permission checks

## Quick Start

```rust
use adk_auth::{Permission, Role, AccessControl, AuthMiddleware, FileAuditSink};
use std::sync::Arc;

// 1. Define roles
let admin = Role::new("admin")
    .allow(Permission::AllTools)
    .allow(Permission::AllAgents);

let user = Role::new("user")
    .allow(Permission::Tool("search".into()))
    .deny(Permission::Tool("code_exec".into()));

// 2. Build access control
let ac = AccessControl::builder()
    .role(admin)
    .role(user)
    .assign("alice@example.com", "admin")
    .assign("bob@example.com", "user")
    .build()?;

// 3. Create middleware with audit logging
let audit = FileAuditSink::new("/var/log/adk/audit.jsonl")?;
let middleware = AuthMiddleware::with_audit(ac, audit);

// 4. Protect tools
let protected_tools = middleware.protect_all(tools);
```

## Core Types

### Permission

```rust
pub enum Permission {
    Tool(String),     // Specific tool
    AllTools,         // All tools (wildcard)
    Agent(String),    // Specific agent
    AllAgents,        // All agents (wildcard)
}
```

### Role

```rust
let role = Role::new("analyst")
    .allow(Permission::Tool("search".into()))
    .allow(Permission::Tool("chart".into()))
    .deny(Permission::Tool("admin_panel".into()));
```

### AccessControl

```rust
let ac = AccessControl::builder()
    .role(admin)
    .role(analyst)
    .assign("alice", "admin")
    .assign("bob", "analyst")
    .build()?;

// Check permission
ac.check("bob", &Permission::Tool("search".into()))?;
```

## Middleware

### Protect Single Tool

```rust
use adk_auth::ToolExt;

let protected = my_tool.with_access_control(Arc::new(ac));
```

### Protect with Audit Logging

```rust
let protected = my_tool.with_access_control_and_audit(
    Arc::new(ac),
    Arc::new(audit_sink),
);
```

### Batch Protection

```rust
let middleware = AuthMiddleware::with_audit(ac, FileAuditSink::new("audit.jsonl")?);
let protected_tools = middleware.protect_all(tools);
```

## Audit Output

```json
{"timestamp":"2025-01-01T00:00:00Z","user":"bob","session_id":"sess-123","event_type":"tool_access","resource":"search","outcome":"allowed"}
{"timestamp":"2025-01-01T00:00:01Z","user":"bob","session_id":"sess-123","event_type":"tool_access","resource":"exec","outcome":"denied"}
```

## Features

| Feature | Description |
|---------|-------------|
| Role-Based Access | Define roles with tool/agent permissions |
| Permission Scopes | Fine-grained allow/deny rules |
| Deny Precedence | Deny rules always override allow |
| Audit Logging | JSONL logs with user, session, outcome |
| ProtectedTool | Wrapper that enforces permissions |
| AuthMiddleware | Batch protect multiple tools |

## License

Apache-2.0

## Part of ADK-Rust

This crate is part of the [ADK-Rust](https://adk-rust.com) framework for building AI agents in Rust.
