# ADK-UI Catalog Gallery

This page lists the built-in catalogs and how to add your own.

## Built-in catalogs

### Default catalog (ADK standard)
- **Catalog ID**: `zavora.ai:adk-ui/default@0.1.0`
- **Location**: `adk-ui/catalog/default_catalog.json`
- **Metadata**: `adk-ui/catalog/metadata.json`
- **Notes**: This is the default catalog used by `render_screen` and `render_page` when no catalog is specified.

### A2UI v0.9 reference catalog
- **Catalog**: `adk-ui/catalog/a2ui/v0_9/standard_catalog.json`
- **Common types**: `adk-ui/catalog/a2ui/v0_9/common_types.json`
- **Notes**: Reference-only. Use for validation or diffing against the standard A2UI catalog.

## Generated catalogs (UI kits)

Use `render_kit` to generate:
- `catalog.json` (A2UI catalog)
- `tokens.json` (design tokens)
- `templates.json` (prefab layouts)
- `theme.css` (CSS variables)

Catalog IDs follow:
```
zavora.ai:adk-ui/kit/<slug>@<version>
```

## Using a catalog

Pass a catalog ID when rendering:

```json
{
  "catalog_id": "zavora.ai:adk-ui/default@0.1.0",
  "components": [ ... ]
}
```

If no catalog is supplied, the renderer uses the default catalog registered in `CatalogRegistry`.

## Adding a local catalog

Register a local catalog in code:

```rust
use adk_ui::CatalogRegistry;

let mut registry = CatalogRegistry::new();
registry.register_local(
    "zavora.ai:adk-ui/custom@0.1.0",
    "path/to/catalog.json",
    None,
);
```

## Registry catalogs (hybrid model)

The catalog registry supports remote catalogs when the `remote-catalogs` feature is enabled. This is intended for paid or organization-managed catalogs.
