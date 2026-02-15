# Migration Guide: mikefaille/adk-rust → zavora-ai/adk-rust

This document compares Mike's fork (`mikefaille/adk-rust`) with our implementation (`zavora-ai/adk-rust` branch `feat/realtime-audio-transport`) and identifies what Mike needs to change to migrate.

## TL;DR

Our implementation covers all the same functionality as Mike's fork but with different design choices. The core `RealtimeSession` trait, `EventHandler`, `RealtimeRunner`, `RealtimeAgent`, events, and audio types are API-compatible. The main differences are in:

1. **WebRTC crate** — Mike uses `rtc` (v0.8.5), we use `str0m` (v0.16)
2. **Feature flag names** — Mike: `webrtc`, `vertex`; Ours: `openai-webrtc`, `vertex-live`
3. **GeminiLiveBackend location** — Mike: defined in `adk-gemini`; Ours: defined in `adk-realtime`
4. **LiveKit module structure** — Mike: single `livekit.rs`; Ours: `livekit/` directory with `mod.rs`, `handler.rs`, `bridge.rs`
5. **Audio transport in events** — Mike: `Bytes` (from `bytes` crate); Ours: `Vec<u8>`

---

## Detailed Comparison

### 1. Feature Flags (Cargo.toml)

| Feature | Mike's Fork | Our Implementation |
|---------|------------|-------------------|
| OpenAI WebSocket | `openai` | `openai` |
| Gemini Live | `gemini` | `gemini` |
| Vertex AI | `vertex` (forwards to `adk-gemini/vertex`) | `vertex-live` (uses `google-cloud-auth` directly) |
| LiveKit | `livekit` | `livekit` |
| WebRTC | `webrtc` (generic, uses `rtc` crate) | `openai-webrtc` (OpenAI-specific, uses `str0m` crate) |
| All features | `full` = openai + gemini + livekit + adk | `full` = openai + gemini + vertex-live + livekit + openai-webrtc |

**Migration action:** Update any `--features webrtc` to `--features openai-webrtc`. Update `--features vertex` to `--features vertex-live`.

### 2. WebRTC Crate: `rtc` vs `str0m`

| Aspect | Mike (`rtc` v0.8.5) | Ours (`str0m` v0.16) |
|--------|---------------------|---------------------|
| Architecture | Sans-IO with `RTCPeerConnection` | Sans-IO with `Rtc` |
| UDP I/O | Manual `UdpSocket` + event loop | Manual I/O driving via `poll_output()` |
| RTP | Manual `Packet` construction with `Header` | `writer(mid).write(pt, wallclock, rtp_time, data)` |
| SSRC | Manual random SSRC generation | Managed by str0m internally |
| ICE | Manual `CandidateHostConfig` + gathering loop | Handled by str0m's SDP API |
| Data channel | `pc.data_channel(id).send_text()` | `rtc.channel(id).write(reliable, bytes)` |
| SDP | `create_offer()` / `set_remote_description()` | `sdp_api().apply()` / `accept_answer()` |
| Opus encoding | Manual in event loop with `audiopus` | Encapsulated in `OpusCodec` struct |

**Migration action:** If Mike has custom code using `rtc` APIs directly, it needs to be rewritten for `str0m`. Our `OpenAIWebRTCSession` in `adk-realtime/src/openai/webrtc.rs` is the drop-in replacement — it handles the full SDP signaling, Opus encoding, data channel, and `RealtimeSession` trait implementation.

### 3. GeminiLiveBackend Enum

**Mike's approach:** Defined in `adk-gemini/src/types.rs`, three variants:
```rust
pub enum GeminiLiveBackend {
    Studio { api_key: String },
    #[cfg(feature = "vertex")]
    Vertex(VertexContext),           // Pre-authenticated with token
    #[cfg(feature = "vertex")]
    VertexADC { project, location }, // ADC auto-discovery
}
```

**Our approach:** Defined in `adk-realtime/src/gemini/session.rs`, two variants:
```rust
pub enum GeminiLiveBackend {
    Studio { api_key: String },
    #[cfg(feature = "vertex-live")]
    Vertex { credentials, region, project_id }, // google-cloud-auth Credentials
}
```

**Key differences:**
- Mike has `Vertex` (pre-authenticated token) + `VertexADC` (auto-discovery) as separate variants
- We have a single `Vertex` variant that takes `google-cloud-auth::Credentials` — the caller decides how to obtain credentials (ADC, service account, etc.)
- Mike's `GeminiLiveBackend` lives in `adk-gemini`; ours lives in `adk-realtime`
- Mike depends on `adk-gemini` features (`vertex`) for auth; we use `google-cloud-auth` directly

**Migration action:** Replace `GeminiLiveBackend::VertexADC { project, location }` with:
```rust
let credentials = google_cloud_auth::credentials::Builder::default().build()?;
GeminiLiveBackend::Vertex { credentials, region: location, project_id: project }
```

### 4. Gemini Session — `send_text()` Implementation

**Mike:** Uses `client_content` with `turns` array (correct Gemini Live API format):
```rust
client_content: Some(GeminiClientContent {
    turns: vec![GeminiTurn {
        role: "user",
        parts: vec![GeminiPart { text: Some(text) }],
    }],
    turn_complete: true,
})
```

**Ours:** Check our `adk-realtime/src/gemini/session.rs` — should use the same `client_content` pattern. If it still uses `realtime_input.text`, that's a bug from the original codebase that Mike fixed.

**Migration action:** Verify our Gemini `send_text()` uses `client_content` format. If not, adopt Mike's pattern.

### 5. Events — Audio Data Type

**Mike:** Uses `bytes::Bytes` for audio in events:
```rust
ClientEvent::AudioDelta { audio: Bytes, format: AudioFormat, ... }
ServerEvent::AudioDelta { delta: Bytes, ... }
```

**Ours:** Uses `Vec<u8>`:
```rust
ClientEvent::AudioDelta { audio: Vec<u8>, ... }
ServerEvent::AudioDelta { delta: Vec<u8>, ... }
```

**Mike's `ClientEvent::AudioDelta`** also carries a `format: AudioFormat` field (skipped in serde). Ours does not.

**Migration action:** If Mike's code passes `Bytes` to event constructors, convert with `.to_vec()` or `Bytes::from(vec)`. The `format` field on `AudioDelta` is `#[serde(skip)]` in Mike's code so it doesn't affect wire format.

### 6. LiveKit Module Structure

**Mike:** Single file `src/livekit.rs` with:
- `LiveKitEventHandler` — wraps `Arc<dyn EventHandler>`, no generic parameter
- `bridge_input(track, runner, sample_rate, channels)` — takes sample rate/channels as params
- `bridge_gemini_input(track, runner)` — convenience wrapper calling `bridge_input` with 16kHz

**Ours:** Directory `src/livekit/` with:
- `handler.rs` — `LiveKitEventHandler<H: EventHandler>` — generic over handler type
- `bridge.rs` — `bridge_input(track, runner)` and `bridge_gemini_input(track, runner)`
- `mod.rs` — re-exports

**Key differences:**
- Mike's `LiveKitEventHandler::new(source, inner)` takes `NativeAudioSource` first, `Arc<dyn EventHandler>` second
- Ours takes `(inner_handler, audio_source, sample_rate, channels)` — more explicit about audio params
- Mike's `bridge_input` takes `sample_rate` and `channels` as parameters; ours infers from context

**Migration action:** Update constructor call order. The functionality is equivalent.

### 7. OpenAI WebRTC Session Architecture

**Mike:** Separate model `OpenAiWebRtcModel` that implements `RealtimeModel`:
```rust
// Separate struct from OpenAIRealtimeModel
pub struct OpenAiWebRtcModel { model_id, api_key }
impl RealtimeModel for OpenAiWebRtcModel { ... }
```
The WebRTC session runs a full `tokio::spawn` event loop (`run_pc_loop`) that handles UDP I/O, RTP packetization, data channel messages, and ICE.

**Ours:** Single `OpenAIRealtimeModel` with `OpenAITransport` enum:
```rust
pub enum OpenAITransport { WebSocket, WebRTC }
// OpenAIRealtimeModel.with_transport(OpenAITransport::WebRTC)
```
The `OpenAIWebRTCSession` implements `RealtimeSession` directly. The I/O loop is the caller's responsibility (str0m is Sans-IO).

**Migration action:** Replace `OpenAiWebRtcModel::new(model_id, api_key)` with:
```rust
OpenAIRealtimeModel::new(api_key, model_id).with_transport(OpenAITransport::WebRTC)
```

### 8. SDP Signaling Flow

**Mike:** Direct SDP exchange — sends offer SDP directly to OpenAI with API key:
```rust
POST /v1/realtime?model=... 
Authorization: Bearer {api_key}
Content-Type: application/sdp
Body: {offer_sdp}
```

**Ours:** Two-step — ephemeral token first, then SDP exchange:
```rust
// Step 1: Get ephemeral token
POST /v1/realtime/sessions
Authorization: Bearer {api_key}
Body: { "model": model_id, "voice": "alloy" }
// Returns: { "client_secret": { "value": "..." } }

// Step 2: SDP exchange with ephemeral token
POST /v1/realtime?model=...
Authorization: Bearer {ephemeral_token}
Content-Type: application/sdp
Body: {offer_sdp}
```

**Migration action:** Our approach follows OpenAI's recommended flow for WebRTC (ephemeral tokens are short-lived and safer). Mike's direct API key approach works but exposes the key to the WebRTC endpoint. No code change needed — this is internal to the session.

### 9. Error Types

**Mike:** No transport-specific error variants:
```rust
pub enum RealtimeError {
    ConnectionError(String),
    MessageError(String),
    AuthError(String),
    // ... generic variants
}
```

**Ours:** Added transport-specific variants:
```rust
pub enum RealtimeError {
    // ... all of Mike's variants, plus:
    OpusCodecError(String),  // Opus encode/decode failures
    WebRTCError(String),     // WebRTC-specific failures
    LiveKitError(String),    // LiveKit bridge failures
}
```

**Migration action:** If Mike's code catches specific error types, the new variants are additive — existing match arms still work. Add new arms for `OpusCodecError`, `WebRTCError`, `LiveKitError` if needed.

### 10. `adk-rust` Facade Crate

**Mike's facade features:**
```toml
realtime = ["dep:adk-realtime"]
livekit = ["realtime", "adk-realtime/livekit"]
# No vertex-live or openai-webrtc forwarding
```

**Our facade features:**
```toml
realtime = ["dep:adk-realtime"]
vertex-live = ["realtime", "adk-realtime/vertex-live"]
livekit = ["realtime", "adk-realtime/livekit"]
openai-webrtc = ["realtime", "adk-realtime/openai-webrtc"]
```

Plus prelude re-exports for `RealtimeAgent`, `RealtimeAgentBuilder`, `RealtimeConfig`, `RealtimeModel`, `RealtimeRunner`, `RealtimeSession`.

**Migration action:** Use `adk-rust` features directly instead of `adk-realtime` features when depending on the facade crate.

### 11. `.cargo/config.toml`

**Mike:** Has a Linux-specific build config:
```toml
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=wild", "-Z", "codegen-backend=cranelift"]
[build]
rustc-wrapper = "sccache"
```

**Ours:** No `.cargo/config.toml` — we don't enforce a specific linker or build cache.

**Migration action:** This is Mike's local dev optimization. Not needed for migration, but can be kept for Linux dev environments.

### 12. `devenv.nix`

**Mike:** Has a Nix development environment file.

**Ours:** No Nix support.

**Migration action:** Not relevant to code migration. Mike can keep his Nix setup.

---

## What Mike Gets By Migrating

1. **Property tests** — 5 proptest suites (100 iterations each) covering Vertex URL construction, LiveKit delegation, Opus round-trip, SDP offer structure, error context preservation
2. **Integration tests** — `#[ignore]` tests for all three transports with timeout guards
3. **Examples** — `vertex_live_voice`, `livekit_bridge`, `openai_webrtc` with READMEs
4. **Ephemeral token flow** — Safer WebRTC signaling (no API key on the wire)
5. **str0m** — More actively maintained Sans-IO WebRTC crate (vs `rtc`)
6. **Comprehensive README** — Architecture diagrams, feature flag docs, testing commands
7. **ROADMAP** — Documented future work and known issues
8. **cmake compatibility docs** — `CMAKE_POLICY_VERSION_MINIMUM=3.5` for audiopus builds

## What We Should Consider Adopting from Mike

1. ~~**`client_content` for Gemini `send_text()`**~~ — ✅ Already implemented correctly. Our `send_text()` uses `client_content.turns[]` with `turn_complete: true`.
2. ~~**`VertexADC` convenience**~~ — ✅ Added `GeminiLiveBackend::vertex_adc(project_id, region)` convenience constructor that auto-discovers ADC credentials.
3. ~~**`RealtimeSessionExt` trait**~~ — ✅ Already implemented with `send_text_and_wait()`, `send_audio_and_wait()`, `collect_audio()` as a blanket extension trait.
4. ~~**`BoxedSession` type alias**~~ — ✅ Already defined: `type BoxedSession = Box<dyn RealtimeSession>`.
5. ~~**`BoxedModel` type alias**~~ — ✅ Already defined: `type BoxedModel = Arc<dyn RealtimeModel>`. Now re-exported from `lib.rs`.
6. ~~**Data channel message queuing**~~ — ✅ Added pre-open buffering to `OpenAIWebRTCSession`. Messages are queued (up to 50) when the data channel isn't open yet, then flushed in FIFO order via `flush_pending_dc_messages()` when the channel opens.
7. ~~**`AudioFormat` field on `ClientEvent::AudioDelta`**~~ — ✅ Added `format: Option<AudioFormat>` field with `#[serde(skip)]` for in-memory metadata without affecting wire format.

**Additional improvement:** Removed `openai-webrtc` from the `full` feature flag so that `cargo build` with default features doesn't require cmake. Users who want WebRTC opt in explicitly with `--features openai-webrtc` or `--features full-webrtc`.

---

## Step-by-Step Migration for Mike

1. **Switch branch:** `git checkout feat/realtime-audio-transport`
2. **Update feature flags** in any scripts/CI: `webrtc` → `openai-webrtc`, `vertex` → `vertex-live`
3. **Update imports:**
   - `use adk_realtime::openai::OpenAiWebRtcModel` → `use adk_realtime::openai::{OpenAIRealtimeModel, OpenAITransport}`
   - `use adk_gemini::GeminiLiveBackend` → `use adk_realtime::gemini::GeminiLiveBackend`
4. **Update WebRTC model creation:**
   ```rust
   // Before (Mike)
   let model = OpenAiWebRtcModel::new("gpt-4o-realtime-preview", api_key);
   
   // After (ours)
   let model = OpenAIRealtimeModel::new(api_key, "gpt-4o-realtime-preview")
       .with_transport(OpenAITransport::WebRTC);
   ```
5. **Update Vertex AI connection:**
   ```rust
   // Before (Mike)
   let backend = GeminiLiveBackend::VertexADC { project, location };
   
   // After (ours) — convenience constructor (recommended)
   let backend = GeminiLiveBackend::vertex_adc(project, location)?;
   
   // After (ours) — manual credentials construction
   let credentials = google_cloud_auth::credentials::Builder::default().build()?;
   let backend = GeminiLiveBackend::Vertex { credentials, region: location, project_id: project };
   ```
6. **Update LiveKit handler:**
   ```rust
   // Before (Mike)
   let handler = LiveKitEventHandler::new(source, Arc::new(inner));
   
   // After (ours)
   let handler = LiveKitEventHandler::new(inner, source, 24000, 1);
   ```
7. **Update audio event handling** if using `Bytes`:
   ```rust
   // Before (Mike)
   ServerEvent::AudioDelta { delta, .. } => { /* delta is Bytes */ }
   
   // After (ours)
   ServerEvent::AudioDelta { delta, .. } => { /* delta is Vec<u8> */ }
   ```
8. **Build with cmake env var** for WebRTC:
   ```bash
   export CMAKE_POLICY_VERSION_MINIMUM=3.5
   cargo check -p adk-realtime --features openai-webrtc
   ```
9. **Run property tests** to verify:
   ```bash
   cargo test -p adk-realtime --test error_context_tests
   cargo test -p adk-realtime --features vertex-live --test vertex_url_property_tests
   ```
