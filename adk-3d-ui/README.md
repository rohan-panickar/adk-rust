# adk-3d-ui

`adk-3d-ui` is a minimal 3D UI runtime for ADK-Rust with a simple transport model:

- Server -> client: SSE (`ui_ops`, `toast`, `done`, `error`, `ping`)
- Client -> server: HTTP POST events (`select`, `command`, `approve_action`)

This currently includes:

- Phase 0: protocol and server contract skeleton
- Phase 1: embedded Three.js runtime with incremental `create/patch/remove` op application
- Phase 2: prompt-intent planning with session context (last prompt/command/selection)
- Phase 3 (vertical slice): DevOps-style workbench panel and live status patch loop
- Phase 4: approval-gated action handling with audit trail and execute/reject outcomes
- Phase 5 (partial): reconnect/watchdog hardening to reduce stuck streaming states

## Run

```bash
cargo run -p adk-3d-ui
```

Open `http://127.0.0.1:8099`.

Optional environment variables:

- `ADK_3D_UI_HOST` (default `127.0.0.1`)
- `ADK_3D_UI_PORT` (default `8099`)

### Run via examples launcher

```bash
cargo run --example 3d_ui_ops_center
```

## API

- `POST /api/3d/session` -> create a new session
- `GET /api/3d/stream/{session_id}` -> SSE stream
- `POST /api/3d/event/{session_id}` -> send UI events
- `POST /api/3d/run/{session_id}` -> compile prompt into `ui_ops`

## Manual Validation

1. Open the UI and run: `rollback payments now`
2. Confirm an action card appears with pending action state.
3. Click `Approve Pending Action` and verify:
 - orb state patches to healthy/focused
 - workbench subtitle updates to execution success
4. Run again with a safe prompt and verify no pending action state.

## Troubleshooting

- `status: reconnecting` repeatedly
 - check the server is running on the same host/port shown in the browser URL.
- no render changes after `Run Prompt`
 - inspect runtime log panel for `sse.ui_ops`; if missing, verify `/api/3d/run/{session_id}` returns `accepted: true`.
- pending action buttons stay disabled
 - dangerous prompts must include terms like `restart`, `rollback`, or `scale down`.
- view looks frozen
 - the client watchdog sets status to `timeout` after 15s with no SSE activity; run a new prompt to recover.
- CORS or network failures
 - serve the page from the same process (`/`) instead of loading the html file directly.

## Notes

- The frontend is currently an embedded static page (`ui/index.html`).
- `planner.rs` and `executor.rs` provide the initial prompt->ops pipeline.
- `policy.rs` adds risk-tier tagging for action proposals.
- `server.rs` applies command/select events back into scene patches and short live status updates.
- `session.rs` stores pending actions and per-session action audit entries.
- Client runtime includes SSE reconnect retries and inactivity timeout watchdog.
- Frontend component kinds implemented in v1 runtime:
  - `group`
  - `text3d`
  - `orb`
  - `panel3d`
  - `trail`
  - `command_bar`
