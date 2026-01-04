# Model Providers

ADK-Rust supports multiple LLM providers through the `adk-model` crate. All providers implement the `Llm` trait, making them interchangeable in your agents.

## Supported Providers

| Provider | Models | Feature Flag |
|----------|--------|--------------|
| **Gemini** | gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash | (default) |
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo | `openai` |
| **Anthropic** | claude-opus-4, claude-sonnet-4, claude-3.5-sonnet | `anthropic` |
| **DeepSeek** | deepseek-chat, deepseek-reasoner | `deepseek` |
| **Groq** | llama-3.3-70b, mixtral-8x7b, gemma2-9b | `groq` |
| **Ollama** | llama3.2, mistral, qwen2.5, gemma2 (local) | `ollama` |

## Installation

```toml
[dependencies]
# All providers
adk-model = { version = "{{version}}", features = ["all-providers"] }

# Or individual providers
adk-model = { version = "{{version}}", features = ["openai"] }
adk-model = { version = "{{version}}", features = ["anthropic"] }
adk-model = { version = "{{version}}", features = ["deepseek"] }
adk-model = { version = "{{version}}", features = ["groq"] }
adk-model = { version = "{{version}}", features = ["ollama"] }
```

## Environment Variables

```bash
# Google Gemini
export GOOGLE_API_KEY="your-api-key"

# OpenAI
export OPENAI_API_KEY="your-api-key"

# Anthropic
export ANTHROPIC_API_KEY="your-api-key"

# DeepSeek
export DEEPSEEK_API_KEY="your-api-key"

# Groq
export GROQ_API_KEY="your-api-key"

# Ollama (no API key needed - local server)
# Start with: ollama serve
```

## Gemini (Google)

Google's Gemini models are the default provider.

```rust
use adk_model::GeminiModel;
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

let api_key = std::env::var("GOOGLE_API_KEY")?;
let model = GeminiModel::new(&api_key, "gemini-2.5-flash")?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

## OpenAI

```rust
use adk_model::openai::{OpenAIClient, OpenAIConfig};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

let api_key = std::env::var("OPENAI_API_KEY")?;
let model = OpenAIClient::new(OpenAIConfig::new(api_key, "gpt-4o"))?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

## Anthropic (Claude)

```rust
use adk_model::anthropic::{AnthropicClient, AnthropicConfig};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

let api_key = std::env::var("ANTHROPIC_API_KEY")?;
let model = AnthropicClient::new(AnthropicConfig::new(api_key, "claude-sonnet-4-20250514"))?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

## DeepSeek

DeepSeek models with unique features like thinking mode and context caching.

```rust
use adk_model::deepseek::{DeepSeekClient, DeepSeekConfig};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

let api_key = std::env::var("DEEPSEEK_API_KEY")?;

// Standard chat model
let model = DeepSeekClient::new(DeepSeekConfig::chat(api_key))?;

// Or reasoning model with chain-of-thought
let reasoner = DeepSeekClient::new(DeepSeekConfig::reasoner(api_key))?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

### DeepSeek-Specific Features

**Thinking Mode**: The `deepseek-reasoner` model outputs chain-of-thought reasoning:

```rust
let model = DeepSeekClient::new(DeepSeekConfig::reasoner(api_key))?;
// Output includes <thinking>...</thinking> tags with reasoning
```

**Context Caching**: Automatic 10x cost reduction for repeated prefixes (system instructions, documents).

**Tool Calling**: Full function calling support compatible with ADK tools.

## Groq (Ultra-Fast)

Groq provides ultra-fast inference using LPU (Language Processing Unit) technology.

```rust
use adk_model::groq::{GroqClient, GroqConfig};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

let api_key = std::env::var("GROQ_API_KEY")?;
let model = GroqClient::new(GroqConfig::llama70b(api_key))?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

### Groq-Specific Features

**Ultra-Fast Inference**: LPU-based inference delivers industry-leading speed.

**Large Context**: Support for up to 128K tokens depending on the model.

**Tool Calling**: Full function calling support with all models.

### Available Models

```rust
// LLaMA models
GroqConfig::llama70b(api_key)     // llama-3.3-70b-versatile
GroqConfig::llama8b(api_key)      // llama-3.1-8b-instant

// Mixtral
GroqConfig::mixtral(api_key)      // mixtral-8x7b-32768

// Gemma
GroqConfig::gemma9b(api_key)      // gemma2-9b-it
```

## Ollama (Local)

Ollama enables running LLMs locally without API keys or internet connectivity.

```rust
use adk_model::ollama::{OllamaModel, OllamaConfig};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

// Requires: ollama serve && ollama pull llama3.2
let model = OllamaModel::new(OllamaConfig::new("llama3.2"))?;

let agent = LlmAgentBuilder::new("assistant")
    .model(Arc::new(model))
    .build()?;
```

### Ollama Setup

1. **Install Ollama**: Download from [ollama.com](https://ollama.com)

2. **Start Server**:
   ```bash
   ollama serve
   ```

3. **Pull Models**:
   ```bash
   ollama pull llama3.2
   ollama pull qwen2.5:7b
   ollama pull mistral
   ```

### Recommended Models

| Model | Size | Strengths |
|-------|------|-----------|
| `llama3.2` | 3B | Fast, general purpose |
| `qwen2.5:7b` | 7B | Excellent tool calling |
| `mistral` | 7B | Code and reasoning |
| `gemma2` | 9B | Google's efficient model |

### Ollama-Specific Features

**Local Inference**: Complete privacy - data never leaves your machine.

**Tool Calling**: Full function calling support (uses non-streaming for reliability).

**Custom Models**: Support for custom fine-tuned models via Ollama.

**Configuration**:
```rust
let config = OllamaConfig::new("qwen2.5:7b")
    .with_base_url("http://localhost:11434")  // Custom Ollama server
    .with_temperature(0.7)
    .with_max_tokens(2048);
```

## Examples

- `cargo run --example quickstart` - Gemini
- `cargo run --example openai_basic --features openai` - OpenAI
- `cargo run --example anthropic_basic --features anthropic` - Anthropic
- `cargo run --example deepseek_basic --features deepseek` - DeepSeek
- `cargo run --example deepseek_reasoner --features deepseek` - Thinking mode
- `cargo run --example deepseek_tools --features deepseek` - Tool calling
- `cargo run --example groq_basic --features groq` - Groq ultra-fast
- `cargo run --example ollama_basic --features ollama` - Local Ollama
- `cargo run --example ollama_tools --features ollama` - Ollama with tools

## Related

- [LlmAgent](../agents/llm-agent.md) - Using models with agents
- [Function Tools](../tools/function-tools.md) - Adding tools to agents
