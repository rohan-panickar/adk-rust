# ADK-UI vNext Work Breakdown Structure (WBS)

*Priority: 🔴 P0 | Target: Q2–Q4 2026 | A2UI v0.9 | Catalog Delivery: Hybrid*

> **📋 Status**: Active | **Last Updated**: 2026-01-25

## How We’ll Execute

- One task at a time, fully done before starting the next.
- Each task has a concrete output artifact.
- Dependencies must be cleared before the next task begins.

---

## WBS

### 0. Foundation Decisions (Done)
- 0.1 Confirm A2UI version (v0.9 primary, v0.8 fallback)
- 0.2 Confirm catalog delivery model (hybrid)

---

### 1. A2UI Core (Rust)

**1.1 A2UI Envelope Types**
- **Output**: `adk-ui/src/a2ui/messages.rs`
- **Includes**: createSurface, updateComponents, updateDataModel, deleteSurface
- **Depends on**: none
- **Status**: ✅ Done (2026-01-25)

**1.2 JSONL Encoding Helpers**
- **Output**: `adk-ui/src/a2ui/encoding.rs`
- **Includes**: stream helpers, batching
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

**1.3 Deterministic ID Generator**
- **Output**: `adk-ui/src/a2ui/ids.rs`
- **Includes**: stable IDs for tools + templates
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

**1.4 Data Binding Types**
- **Output**: `adk-ui/src/a2ui/bindings.rs`
- **Includes**: DynamicString + path rules
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

**1.5 A2UI Schema Validation**
- **Output**: `adk-ui/src/a2ui/validator.rs`
- **Includes**: v0.9 schema validation (v0.8 fallback)
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

---

### 2. Catalog System (Hybrid)

**2.1 Default Catalog Mapping**
- **Output**: `adk-ui/catalog/default_catalog.json` (v0.9)
- **Includes**: ADK component → A2UI component mapping
- **Depends on**: 1.1, 1.4
- **Status**: ✅ Done (2026-01-25)

**2.2 Catalog Metadata Spec**
- **Output**: `adk-ui/catalog/metadata.json`
- **Includes**: version, license, signature fields
- **Depends on**: 2.1
- **Status**: ✅ Done (2026-01-25)

**2.3 Catalog Registry Client**
- **Output**: `adk-ui/src/catalog_registry.rs`
- **Includes**: local + remote lookup
- **Depends on**: 2.2
- **Status**: ✅ Done (2026-01-25)

**2.4 KitSpec Schema**
- **Output**: `docs/roadmap/adk-ui-kit-spec.md` (already drafted)
- **Depends on**: none

**2.5 Kit Generator (Catalog + Tokens + Templates)**
- **Output**: `adk-ui/src/kit/generator.rs`
- **Depends on**: 2.1, 2.4
- **Status**: ✅ Done (2026-01-25)

---

### 3. Working UI Loop (Events + Data)

**3.1 A2UI Action Event Mapping**
- **Output**: `adk-ui/src/a2ui/events.rs`
- **Includes**: surfaceId, sourceComponentId, timestamp, context
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

**3.2 Data Model Helpers**
- **Output**: `adk-ui/src/a2ui/data_model.rs`
- **Includes**: updateDataModel builders
- **Depends on**: 1.4
- **Status**: ✅ Done (2026-01-25)

**3.3 Form Submission Semantics**
- **Output**: `adk-ui/src/tools/render_form.rs` updates
- **Includes**: binding paths + action context mapping
- **Depends on**: 1.4, 3.1
- **Status**: ✅ Done (2026-01-25)

---

### 4. React Renderer (A2UI)

**4.1 A2UI Surface Store**
- **Output**: `packages/adk-ui-react/src/a2ui/store.ts`
- **Depends on**: 1.1
- **Status**: ✅ Done (2026-01-25)

**4.2 JSONL Parser**
- **Output**: `packages/adk-ui-react/src/a2ui/parser.ts`
- **Depends on**: 4.1
- **Status**: ✅ Done (2026-01-25)

**4.3 Binding Resolution**
- **Output**: `packages/adk-ui-react/src/a2ui/bindings.ts`
- **Depends on**: 1.4, 4.1
- **Status**: ✅ Done (2026-01-25)

**4.4 Event Emission (A2UI Action)**
- **Output**: `packages/adk-ui-react/src/a2ui/events.ts`
- **Depends on**: 3.1
- **Status**: ✅ Done (2026-01-25)

**4.5 Renderer Integration**
- **Output**: `packages/adk-ui-react/src/Renderer.tsx` updates
- **Includes**: patch/apply updates, input_change, tab_change
- **Depends on**: 4.1–4.4
- **Status**: ✅ Done (2026-01-25)

---

### 5. Generative UI Tools

**5.1 render_screen Tool**
- **Output**: `adk-ui/src/tools/render_screen.rs`
- **Depends on**: 1.1, 2.1
- **Status**: ✅ Done (2026-01-25)

**5.2 render_page Tool**
- **Output**: `adk-ui/src/tools/render_page.rs`
- **Depends on**: 5.1
- **Status**: ✅ Done (2026-01-25)

**5.3 render_kit Tool**
- **Output**: `adk-ui/src/tools/render_kit.rs`
- **Depends on**: 2.5
- **Status**: ✅ Done (2026-01-25)

---

### 6. Adoption & Examples

**6.1 Quickstart (Prompt → UI)**
- **Output**: `docs/quickstart/adk-ui.md`
- **Depends on**: 5.1
- **Status**: ✅ Done (2026-01-25)

**6.2 Working UI Examples**
- **Output**: `examples/ui_working/*`
- **Depends on**: 3.3, 4.5
- **Status**: ✅ Done (2026-01-25)

**6.3 Catalog Gallery**
- **Output**: `docs/catalogs/index.md`
- **Depends on**: 2.3
- **Status**: ✅ Done (2026-01-25)

---

## Execution Order (One Task at a Time)

1. **1.1 A2UI Envelope Types**
2. **1.2 JSONL Encoding Helpers**
3. **1.3 Deterministic ID Generator**
4. **1.4 Data Binding Types**
5. **1.5 A2UI Schema Validation**
6. **2.1 Default Catalog Mapping**
7. **2.2 Catalog Metadata Spec**
8. **2.3 Catalog Registry Client**
9. **2.5 Kit Generator**
10. **3.1 A2UI Action Event Mapping**
11. **3.2 Data Model Helpers**
12. **3.3 Form Submission Semantics**
13. **4.1 Surface Store**
14. **4.2 JSONL Parser**
15. **4.3 Binding Resolution**
16. **4.4 Event Emission**
17. **4.5 Renderer Integration**
18. **5.1 render_screen Tool**
19. **5.2 render_page Tool**
20. **5.3 render_kit Tool**
21. **6.1 Quickstart**
22. **6.2 Working UI Examples**
23. **6.3 Catalog Gallery**

---

## Note
This WBS is a living document. Task order may be adjusted as dependencies evolve.
