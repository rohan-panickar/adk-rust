# ADK-UI vNext Task Plan

*Priority: 🔴 P0 | Target: Q2–Q4 2026 | Effort: 10–12 weeks*

> **📋 Status**: Planning | **Last Updated**: 2026-01-25

## Goals
- A2UI v0.9 compatibility end-to-end (messages, catalogs, events).
- Generative UI (screen/page/kit) with a default catalog.
- Preserve “working UI” loop (forms → user input → agent).
- Drive adoption with fast onboarding + examples.

---

## Epics & Tasks

### Epic 1 — A2UI Core (Rust)
**Outcome**: `adk-ui` emits A2UI JSONL messages.

- Add A2UI envelope types (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`).
- Implement JSONL encoding + streaming helpers.
- Add schema validation against A2UI v0.9 (fallback v0.8).
- Add deterministic ID generator for components.
- Add `DynamicString` (`literal` | `path`) bindings.

**Acceptance**
- Sample payloads validate against A2UI schemas.
- Deterministic IDs for tool outputs.

---

### Epic 2 — Catalog System (Hybrid)
**Outcome**: Default local catalog + remote registry + kit generator.

- Ship `default_catalog.json` aligned to ADK components.
- Implement hybrid catalog registry (local + remote).
- Add catalog metadata (version, license, signature).
- Build kit generator: `KitSpec → catalog + tokens + templates`.

**Acceptance**
- Default catalog renders in A2UI reference renderer.
- Kit generation outputs all artifacts.

---

### Epic 3 — Working UI Loop (Events + Data)
**Outcome**: “form → agent → next UI” works reliably.

- Map UiEvent to A2UI `action` event schema.
- Add data model store + `updateDataModel` helper in Rust.
- Ensure form inputs bind to paths + action context.
- Add validation for form-related components.

**Acceptance**
- Form submissions include context + sourceComponentId + timestamp.
- Inputs update data model without re-render.

---

### Epic 4 — React Renderer A2UI Support
**Outcome**: `adk-ui-react` consumes A2UI JSONL.

- Implement surface store for components + data model.
- Apply `updateComponents` and `updateDataModel`.
- Resolve bindings for text, labels, etc.
- Fix form submission path and emit `input_change` + `tab_change`.
- Add patch/replace handling for streaming updates.

**Acceptance**
- A2UI JSONL renders correctly.
- Updates applied without full rerender.

---

### Epic 5 — Generative UI Tools
**Outcome**: Prompt → screen/page/kit.

- Add `render_screen`, `render_page`, `render_kit` tools.
- Add prompt templates to guide model output.
- Support “default catalog” with no config required.

**Acceptance**
- Prompt-only demo: screen renders without manual catalog config.
- Kit prompt outputs catalog + templates.

---

### Epic 6 — Adoption & Docs
**Outcome**: First-time success in < 5 minutes.

- Quickstart: prompt → UI in one command.
- 5 working examples (forms + agent flows).
- Catalog gallery page + docs.
- CLI helpers: `adk-ui catalog build/publish`.

**Acceptance**
- Time-to-first-render < 5 minutes.
- At least 3 “working UI” demos.

---

## Risks & Mitigations

- **Schema drift**: enforce A2UI schema validation in tests.
- **ID instability**: deterministic ID builder per tool output.
- **Renderer mismatch**: run compatibility tests vs A2UI reference renderer.

---

## Deliverables
- A2UI-compatible message layer in Rust.
- Default + generated catalogs.
- A2UI-capable React renderer.
- Generative UI tools (screen/page/kit).
- Adoption-first docs + examples.

---

## Note
This is a task plan document. Tasks may change as implementation proceeds.
