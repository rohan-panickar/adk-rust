# ADK-UI A2UI Architecture Plan

*Priority: 🔴 P0 | Effort: 6–8 weeks | Target: Q2–Q3 2026*

> **📋 Status**: Planning | **Last Updated**: 2026-01-25

## Overview

Define the architecture to make `adk-ui` A2UI-compatible while preserving the “working UI” loop (forms → user input → agent action). This plan adds A2UI envelopes, catalog compatibility, data bindings, and a **generative UI kit pipeline** that produces catalogs on demand.

## Decisions (Confirmed)

- **A2UI Version**: v0.9 primary, v0.8 fallback compatibility.
- **Catalog Delivery**: Hybrid (default local catalog + remote registry for premium/kit catalogs).

## Current State (Problems)

```
adk-ui
├── UiResponse (flat components)
├── UiUpdate (patch by id)
└── UiEvent (form_submit, button_click)

adk-ui-react
├── Component renderer
└── No A2UI envelopes / data model
```

**Issues**
- No A2UI envelope messages (create/update surface + data model).
- IDs are optional and tools omit them, so streaming updates are fragile.
- No data bindings or data model updates.
- Renderer does not handle incremental updates or input change events.
- No catalog registry / negotiation.

---

## Target Architecture

```
Agent
 ├─ render_* tools (intent)
 ├─ A2UI output (JSONL)
 └─ UiEvent ← user actions

A2UI Message Layer
 ├─ createSurface
 ├─ updateComponents
 ├─ updateDataModel
 └─ deleteSurface

Catalog Registry
 ├─ default catalog (ADK standard)
 ├─ generated kit catalogs
 └─ licensed / signed catalogs

Renderer (React)
 ├─ A2UI parser + validator
 ├─ surface/component store
 ├─ data model store + bindings
 └─ event emitter (action → agent)
```

---

## Module Plan (Rust)

```
adk-ui/src/
├── a2ui/
│   ├── messages.rs        # A2UI envelopes + JSONL encoding
│   ├── catalog.rs         # Catalog model + metadata
│   ├── bindings.rs        # DynamicString + path bindings
│   ├── events.rs          # A2UI action mapping
│   └── validator.rs       # A2UI schema validation
│
├── kit/
│   ├── kit_spec.rs        # KitSpec input model
│   ├── generator.rs       # KitSpec → catalog + tokens + templates
│   └── defaults.rs        # Default kit presets
│
├── adapters/
│   ├── ui_to_a2ui.rs      # UiResponse → updateComponents
│   └── tool_outputs.rs    # render_* → A2UI message batch
│
└── catalog_registry.rs    # local/remote registry + signatures
```

---

## A2UI Message Strategy

**Message Output**
- `createSurface` emitted once per surface with catalogId.
- `updateComponents` for initial render + patches.
- `updateDataModel` for bound values.
- `deleteSurface` to remove surfaces.

**JSONL Streaming**
- All outputs emitted as JSON Lines.
- Buffer until `createSurface` is sent, then apply updates.

---

## Data Binding Model

Introduce `DynamicString` + typed paths:

```rust
enum DynamicString {
  Literal(String),
  Path(String), // e.g. "/user/name"
}
```

**Rules**
- All content fields accept `literal` or `path`.
- `updateDataModel` updates values without rebuilding components.

---

## Working UI Loop (Core ADK Value)

**Form submission path**
- Inputs bind to `dataModel` paths by name.
- Submit button uses `action` with `context` mapped from bound values.
- Renderer emits A2UI `action` event with context and sourceComponentId.

**Agent flow**
1. Agent renders form via tool.
2. User submits → action event.
3. Agent processes and emits updates or next screen.

---

## Catalog Model (Default + Generative)

### Default Catalog
Baseline catalog aligned to ADK component set and A2UI standard.

### Generated Catalog
`KitSpec → Catalog + Tokens + Templates`

```typescript
type KitSpec = {
  brand: { name: string; vibe: string; industry?: string };
  colors: { primary: string; accent?: string; surface?: string };
  typography: { family: string; scale: string };
  components: {
    button?: { variants: string[] };
    card?: { elevation: string };
    form?: { density: string };
  };
  templates: ("auth" | "dashboard" | "settings")[];
};
```

Outputs:
- `catalog.json` (A2UI schema)
- `tokens.json` (design tokens)
- `templates.json` (prefab screens)
- `theme.css` (renderer theme variables)

---

## Renderer Architecture (React)

```
packages/adk-ui-react/src/
├── a2ui/
│   ├── store.ts           # surface/component/data model store
│   ├── parser.ts          # JSONL message parser
│   ├── bindings.ts        # path resolution
│   └── events.ts          # A2UI action emitter
│
├── components/            # existing component renderers
└── Renderer.tsx           # top-level surface renderer
```

**Renderer capabilities**
- Maintain surface/component registry keyed by id.
- Apply `updateComponents` patches in-place.
- Resolve bindings against data model store.
- Emit A2UI `action` events with context.

---

## Tool Strategy (Prompt → UI)

Add high-level tools that emit A2UI messages:

```
render_screen  # one screen / single surface
render_page    # multi-section page
render_kit     # generate catalog + templates
```

Existing `render_*` tools remain but map to A2UI envelopes.

---

## Implementation Tasks (Architectural)

**A2UI Compatibility**
- Add A2UI envelopes + JSONL output.
- Implement `DynamicString` + `updateDataModel`.
- Enforce deterministic IDs in tool outputs.

**Catalog + Kit**
- Ship default catalog file.
- Implement kit generator → catalog + tokens + templates.
- Add catalog registry + signature verification hooks.

**Renderer**
- Implement surface store + data model.
- Add updateComponents / updateDataModel ingestion.
- Fix form submission + input events.

---

## Acceptance Criteria

- A2UI schemas validate for all generated payloads.
- Incremental updates work with stable IDs.
- Form submit reliably sends data back to agent.
- Kit generator produces catalog + tokens + templates from prompt.

---

## Note
This is an architecture plan. APIs are illustrative and subject to change during implementation.
