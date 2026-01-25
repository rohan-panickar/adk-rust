# ADK-UI vNext: A2UI-Compatible Generative UI

*Priority: 🔴 P0 | Target: Q2-Q4 2026 | Effort: 10–12 weeks*

> **📋 Status**: Planning | **Last Updated**: 2026-01-25

## Overview

Make `adk-ui` fully compatible with A2UI while preserving the unique ADK strength: **working, feedback-driven UIs**. The vNext plan introduces A2UI message envelopes, catalog compatibility, and a **generative UI kit pipeline** so users can prompt single screens, full pages, or complete UI kits without hard-coded catalogs.

## Why Now

**Market reality**
- A2UI is emerging as a standard for agent-to-UI interchange.
- Adoption depends on compatibility, safety, and a low-friction UX for prompt → UI.

**ADK opportunity**
- ADK already supports tool-driven UI and bidirectional events.
- We can provide a **catalog economy** and **generative UI kits**, not just a renderer.

## Current ADK-UI Snapshot (Implemented)

**What exists today**
- Rust schema + 28 components, 10 render tools, templates.
- React renderer (`packages/adk-ui-react`).
- UiEvent for form submission + button clicks.
- Streaming update concept (`UiUpdate`) but not fully wired in renderer or tools.

**Key gaps**
- No A2UI envelopes (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`).
- No data model binding (`literal` vs `path`) or data updates.
- IDs are optional; tools omit IDs, breaking incremental updates.
- Renderer does not apply incremental updates or input-change events.

## Product Spec (A2UI-Compatible Generative UI)

### Goals
- **A2UI compatibility** for messages, catalogs, events, and incremental updates.
- **Generative UI**: prompt → screen/page/kit with a default catalog.
- **Working UIs**: preserve ADK’s core loop: collect data, send back to agent, continue workflow.
- **Catalog economy**: catalogs are first-class artifacts for monetization and reuse.

### Non-Goals
- Not a general web framework.
- Not a full design tool replacement.
- Not a closed renderer; compatibility with A2UI renderers stays intact.

### Primary Users
- Product builders and AI engineers who want fast UI generation.
- Teams that need safe, auditable UI interchange across trust boundaries.
- Businesses selling branded or domain-specific UI catalogs/kits.

### Key User Journeys
1. **Prompt → Screen**: “Create a sign-in screen” → rendered UI using default catalog.
2. **Prompt → Page**: “Build a pricing page” → structured layout + components.
3. **Prompt → UI Kit**: “Make a fintech UI kit” → tokens + catalog + templates.
4. **Working Forms**: agent renders a form, user submits, agent receives data, responds with next step.

### Feature Pillars
1. **A2UI Protocol Compatibility**
   - A2UI envelopes, surfaces, and data model updates.
   - Catalog negotiation (standard + custom).
   - Strict schema validation.
2. **Generative UI & UI Kit Synthesis**
   - Default catalog for instant adoption.
   - Prompted kit generation (themes, tokens, component skins).
   - Catalog registry + versioning.
3. **Working, Stateful UI**
   - Forms and inputs emit events with data and context.
   - Agent can update UI incrementally based on user input.
4. **Adoption-first UX**
   - Simple prompt-based API.
   - High-quality examples and starter templates.
   - Copy-paste “Hello UI” in < 5 minutes.

### Adoption Targets
- 1 command to run a prompt → UI demo.
- 5 templates that show “working UIs” (forms + follow-up agent actions).
- Clear path from default catalog → premium/custom catalog.

### Acceptance Criteria
- A2UI validation passes for all emitted messages.
- Renderer supports incremental updates and data model binding.
- Forms submit data back to agent reliably (no broken submit path).
- Users can generate a UI kit from a prompt and render it with default catalog.

## Architecture (A2UI-Compatible)

```
Agent + Tools
  ├─ (Prompt) → UI Spec → A2UI Messages (JSONL)
  │     ├─ createSurface (catalogId)
  │     ├─ updateComponents (ID-based)
  │     ├─ updateDataModel (bindings)
  │     └─ deleteSurface
  └─ UiEvent ← Client (actions + context)

Catalog Registry
  ├─ default catalog
  ├─ generated kit catalogs
  └─ signed/paid catalogs

Renderer
  ├─ A2UI parser + validator
  ├─ data model store
  └─ component registry
```

## A2UI Compatibility Plan

**Message Layer**
- Add A2UI envelope types in `adk-ui` (v0.9 primary, v0.8 compat).
- Emit JSONL streams that A2UI renderers can consume directly.

**Catalog Layer**
- Ship a **default catalog** aligned to ADK component set.
- Support custom catalogs and generated catalogs.
- Add catalog metadata: version, license, signature.

**Data Model + Binding**
- Add `literalString` and `path` support in schema.
- Implement `updateDataModel` + binding resolution.

**Events**
- Map UiEvent to A2UI action schema (surfaceId, sourceComponentId, timestamp, context).
- Preserve ADK’s “form submit → agent continues” flow.

## Generative UI Kits (Market Edge)

**What this means**
- A prompt can generate a **full UI kit**: tokens, component styles, templates, and catalog JSON.
- Catalogs become reusable artifacts and the business model.

**Capabilities**
- **Default catalog** for immediate use (no setup).
- **Kit generator** that outputs:
  - A2UI catalog JSON (components + theme schema)
  - design tokens (colors, typography, spacing)
  - templates (auth, dashboard, settings)
  - renderer theme config (CSS variables / Tailwind tokens)

**Business model**
- Paid catalogs and industry kits.
- Catalog registry with licensing + analytics.
- Signed catalogs + access control.

## Design Direction (Renderer + UX)

**Principles**
- Clear, safe, and deterministic rendering.
- A2UI compatibility is the baseline.
- “Working UI” UX first (forms, steps, confirmation).

**Visual Language**
- Clean, minimal, readable defaults.
- Themeable via tokens from catalog.
- Default catalog is professional, neutral, and accessible.

**Renderer Enhancements**
- Input bindings + validation messaging.
- Incremental update handling.
- Catalog registry integration.

## Task Plan (10–12 Weeks)

### Phase 1 — Spec Alignment & Core Types (Week 1–2)
- Implement A2UI envelope types in `adk-ui`.
- Define surface + component ID strategy (deterministic IDs).
- Add data model binding types.
- Add A2UI schema validator integration.

### Phase 2 — Catalog & Generator (Week 3–4)
- Build default catalog JSON aligned to ADK components.
- Implement catalog registry (local + remote).
- Create catalog generator (kit spec → catalog + tokens).
- Add catalog metadata (version, license).

### Phase 3 — Renderer Compatibility (Week 5–6)
- Add A2UI message ingestion to `adk-ui-react`.
- Implement data model binding + updates.
- Fix form submission flow; emit `input_change` + `tab_change`.
- Add incremental component updates (patch/replace).

### Phase 4 — Generative UI Tools (Week 7–8)
- Update render tools to emit A2UI envelopes.
- Add prompt modes: screen, page, kit.
- Introduce “kit prompt” workflow that outputs catalog + templates.

### Phase 5 — Adoption + Examples (Week 9–10)
- Ship 5 “working UI” examples (form → agent flow).
- Add prompt-driven quickstart in docs.
- Add catalog gallery + registry CLI.

### Phase 6 — Hardening (Week 11–12)
- Compatibility tests against A2UI schemas.
- Regression tests for forms and events.
- Performance + payload size tuning.

## Design + Engineering Tasks (Workstreams)

**Rust Core (adk-ui)**
- A2UI envelopes + JSONL output.
- Binding model (`literalString`, `path`).
- Catalog generator + registry client.
- Event mapping to A2UI action schema.

**Renderer (adk-ui-react)**
- A2UI parser + surface state store.
- Data model updates + binding resolution.
- Correct form submission + input events.
- Catalog theme integration.

**Tooling + DX**
- `adk-ui` prompt modes: screen/page/kit.
- CLI: `adk-ui catalog build` and `adk-ui catalog publish`.
- Examples: prompt → UI, prompt → kit, working form flow.

**Documentation**
- New A2UI compatibility guide.
- “Generate a UI kit in 3 prompts” guide.
- Catalog registry + licensing docs.

## Validation & Metrics

**Compatibility**
- 100% A2UI schema validation pass for sample messages.
- Works with A2UI reference renderer.

**Adoption**
- Time to first UI < 5 minutes.
- 3 working demos with form → agent feedback loop.

**Quality**
- No broken submit flow.
- Incremental updates in < 100ms for typical payloads.

## Deliverables
- A2UI-compatible message pipeline in Rust + React.
- Default catalog and generator.
- Prompt-driven UI/kit generation flows.
- Catalog registry + licensing hooks.
- Docs + samples focused on adoption.

---

## Related Documents
- [ADK-UI A2UI Architecture Plan](./adk-ui-a2ui-architecture.md)
- [ADK-UI vNext Task Plan](./adk-ui-task-plan.md)
- [ADK-UI Kit Spec (Generative Catalogs)](./adk-ui-kit-spec.md)

---

## Note
This is a roadmap document. APIs and examples here are illustrative and subject to change during implementation.
