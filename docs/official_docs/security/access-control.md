# Access Control

Enterprise-grade access control for AI agents using `adk-auth`.

## Overview

`adk-auth` provides role-based access control (RBAC) with audit logging and SSO support for ADK agents.

## Installation

```toml
[dependencies]
adk-auth = "0.1.8"

# For SSO/OAuth support
adk-auth = { version = "0.1.8", features = ["sso"] }
```

## Quick Start

```rust
use adk_auth::{Permission, Role, AccessControl, AuthMiddleware};

// Define roles
let admin = Role::new("admin").allow(Permission::AllTools);
let analyst = Role::new("analyst")
    .allow(Permission::Tool("search".into()))
    .deny(Permission::Tool("code_exec".into()));

// Build access control
let ac = AccessControl::builder()
    .role(admin)
    .role(analyst)
    .assign("alice@company.com", "admin")
    .assign("bob@company.com", "analyst")
    .build()?;

// Protect tools
let middleware = AuthMiddleware::new(ac);
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

Roles combine allowed and denied permissions. **Deny rules take precedence.**

```rust
let role = Role::new("data_analyst")
    .allow(Permission::Tool("query_database".into()))
    .allow(Permission::Tool("generate_chart".into()))
    .deny(Permission::Tool("delete_data".into()));
```

## SSO Integration

Enable the `sso` feature for JWT/OIDC support:

### Providers

| Provider | Usage |
|----------|-------|
| Google | `GoogleProvider::new(client_id)` |
| Azure AD | `AzureADProvider::new(tenant_id, client_id)` |
| Okta | `OktaProvider::new(domain, client_id)` |
| Auth0 | `Auth0Provider::new(domain, audience)` |
| Generic OIDC | `OidcProvider::from_discovery(issuer, client_id).await` |

### Example

```rust
use adk_auth::sso::{GoogleProvider, ClaimsMapper, SsoAccessControl};

// Create provider
let provider = GoogleProvider::new("your-client-id");

// Map IdP groups to adk-auth roles
let mapper = ClaimsMapper::builder()
    .map_group("AdminGroup", "admin")
    .map_group("Users", "viewer")
    .default_role("guest")
    .user_id_from_email()
    .build();

// Build SSO access control
let sso = SsoAccessControl::builder()
    .validator(provider)
    .mapper(mapper)
    .access_control(ac)
    .build()?;

// Validate token and check permission
let claims = sso.check_token(
    bearer_token,
    &Permission::Tool("search".into()),
).await?;

println!("User: {}", claims.email.unwrap());
```

## Audit Logging

```rust
use adk_auth::FileAuditSink;

let audit = FileAuditSink::new("/var/log/adk/audit.jsonl")?;
let middleware = AuthMiddleware::with_audit(ac, audit);
```

Output:
```json
{"timestamp":"2025-01-01T10:30:00Z","user":"bob","resource":"search","outcome":"allowed"}
{"timestamp":"2025-01-01T10:30:01Z","user":"bob","resource":"code_exec","outcome":"denied"}
```

### Custom Audit Sink

```rust
#[async_trait]
impl AuditSink for MyAuditSink {
    async fn log(&self, event: AuditEvent) -> Result<(), AuthError> {
        // Send to database, external service, etc.
        Ok(())
    }
}
```

## Examples

```bash
# Core RBAC
cargo run --example auth_basic
cargo run --example auth_audit

# SSO (requires --features sso)
cargo run --example auth_sso --features sso
cargo run --example auth_jwt --features sso
cargo run --example auth_oidc --features sso
cargo run --example auth_google --features sso
```

## Best Practices

1. **Deny by default** - Only grant permissions explicitly needed
2. **Use explicit denies** - Critical tools should have explicit deny rules
3. **Enable audit logging** - Required for compliance and debugging
4. **Validate tokens** - Always validate JWT tokens server-side
5. **Use HTTPS** - JWKS endpoints require secure connections
