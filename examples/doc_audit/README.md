# Documentation Audit Example

This example demonstrates how to use the ADK documentation audit system to validate documentation against actual crate implementations.

## Features Demonstrated

- **Full Audit**: Complete validation of all documentation files
- **Single File Validation**: Validate individual documentation files
- **Incremental Audit**: Audit only changed files for CI/CD integration
- **Multiple Output Formats**: Console, JSON, and Markdown reports

## Usage

### Full Documentation Audit

Run a complete audit of all documentation:

```bash
cargo run --example doc-audit-example -- full --workspace . --docs docs --format console
```

### Validate Single File

Validate a specific documentation file:

```bash
cargo run --example doc-audit-example -- validate docs/README.md
```

### Incremental Audit

Audit only specific changed files (useful for CI/CD):

```bash
cargo run --example doc-audit-example -- incremental --workspace . --docs docs file1.md file2.md
```

## Output Formats

### Console (Default)
Human-readable output with colored indicators and suggestions.

### JSON
Machine-readable format for integration with other tools:

```bash
cargo run --example doc-audit-example -- full --format json > audit-report.json
```

### Markdown
Documentation-friendly format for reports:

```bash
cargo run --example doc-audit-example -- full --format markdown > audit-report.md
```

## Exit Codes

- `0`: Audit passed (no critical issues)
- `1`: Audit failed (critical issues found)

## Integration with CI/CD

Add to your CI pipeline to ensure documentation stays current:

```yaml
# .github/workflows/docs-audit.yml
name: Documentation Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Run documentation audit
        run: cargo run --example doc-audit-example -- full --format json
```

## Configuration

The audit system can be configured through:

- Command-line arguments
- Configuration files (`.adk-doc-audit.toml`)
- Environment variables

See the main `adk-doc-audit` crate documentation for detailed configuration options.