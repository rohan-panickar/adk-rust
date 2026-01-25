# ADK-UI Kit Spec (Generative Catalogs)

*Priority: 🔴 P0 | Target: Q2–Q3 2026*

> **📋 Status**: Draft | **Last Updated**: 2026-01-25

## Purpose

Define the schema for **UI kit generation**: a prompt produces a kit that includes
design tokens, a catalog, and templates. The kit can be local (default) or
published to a registry (hybrid delivery).

## KitSpec Schema (Draft)

```json
{
  "name": "Fintech Pro Kit",
  "version": "0.1.0",
  "brand": {
    "vibe": "trustworthy, modern, high-contrast",
    "industry": "fintech"
  },
  "colors": {
    "primary": "#2F6BFF",
    "accent": "#12B981",
    "surface": "#FFFFFF",
    "background": "#F6F8FB",
    "text": "#111827"
  },
  "typography": {
    "family": "Source Sans 3",
    "scale": "classic"
  },
  "density": "comfortable",
  "radius": "md",
  "components": {
    "button": { "variants": ["primary", "secondary", "danger", "ghost"] },
    "card": { "elevation": "soft" },
    "input": { "style": "outlined" },
    "table": { "striped": true }
  },
  "templates": [
    "auth_login",
    "auth_register",
    "dashboard",
    "settings"
  ]
}
```

## Kit Artifacts

**Generated outputs**
- `catalog.json` (A2UI v0.9 catalog)
- `tokens.json` (design tokens)
- `templates.json` (prefab UI layouts)
- `theme.css` (renderer theme variables)

**Optional outputs**
- `tailwind.config.json`
- `figma.tokens.json`

## Default Catalog Strategy (Hybrid)

**Local default catalog**
- Ships with ADK-UI.
- Covers the standard ADK component set.
- Validated against A2UI v0.9 schemas.

**Registry catalogs**
- Generated kits published to a registry.
- Catalog IDs are content-addressed hashes.
- Licensed catalogs require auth tokens.

## Catalog ID Format

```
catalogId: "zavora.ai:kit/fintech-pro@0.1.0#sha256:abcd..."
```

## Template Conventions

Each template references components by ID and binds to data paths.

Example template root:

```json
{
  "templateId": "auth_login",
  "surfaceId": "auth",
  "root": "root",
  "components": [
    { "id": "root", "component": { "Column": { "children": { "explicitList": ["card"] } } } },
    { "id": "card", "component": { "Card": { "child": "form" } } }
  ],
  "dataModel": {
    "/user/email": "",
    "/user/password": ""
  }
}
```

## Prompt Modes

**screen**
- One surface, single screen output.

**page**
- Multiple sections, still single surface.

**kit**
- Generates a KitSpec + artifacts.

## Validation

- `catalog.json` validates against A2UI v0.9 catalog schema.
- `templates.json` validates against A2UI message schema.
- `tokens.json` validates against ADK token schema (to be defined).

---

## Note
This is a draft document. The schema and artifact formats are subject to change.
