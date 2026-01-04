# mistral.rs Integration

Native mistral.rs integration for high-performance local inference with `adk-mistralrs`.

## Overview

`adk-mistralrs` provides native integration with the [mistral.rs](https://github.com/EricLBuehler/mistral.rs) inference engine, enabling:

- **Local Inference**: Run models locally without API dependencies
- **Hardware Acceleration**: CUDA, Metal, and CPU optimizations
- **Quantization**: ISQ, GGUF, and UQFF support for memory efficiency
- **Adapter Support**: LoRA and X-LoRA hot-swapping
- **High Performance**: Optimized for speed and memory usage

## Installation

**Note**: `adk-mistralrs` is git-only due to CUDA dependencies and cannot be published to crates.io.

```toml
[dependencies]
adk-mistralrs = { git = "https://github.com/zavora-ai/adk-rust" }
```

### Hardware Requirements

| Feature | Requirement |
|---------|-------------|
| **CPU** | Any x86_64 or ARM64 |
| **CUDA** | NVIDIA GPU with CUDA 11.8+ |
| **Metal** | Apple Silicon (M1/M2/M3) |
| **Memory** | 4GB+ RAM (depends on model size) |

## Basic Usage

### Simple Model Loading

```rust
use adk_mistralrs::{MistralRsModel, MistralRsConfig, ModelSource};
use adk_agent::LlmAgentBuilder;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load model from HuggingFace
    let config = MistralRsConfig::builder()
        .model_source(ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct"))
        .build();

    let model = MistralRsModel::new(config).await?;

    let agent = LlmAgentBuilder::new("assistant")
        .model(Arc::new(model))
        .build()?;

    Ok(())
}
```

### Configuration Options

```rust
use adk_mistralrs::{MistralRsConfig, ModelSource, ModelArchitecture, DataType, Device};

let config = MistralRsConfig::builder()
    .model_source(ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct"))
    .architecture(ModelArchitecture::Plain)
    .dtype(DataType::Auto)
    .device(Device::Auto)  // Auto-detect best device
    .temperature(0.7)
    .max_tokens(2048)
    .paged_attention(true)  // Enable for long contexts
    .build();
```

## Model Sources

### HuggingFace Hub

```rust
// Standard model
ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct")

// Specific revision
ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct@main")
```

### Local Models

```rust
// Local directory
ModelSource::local("/path/to/model")

// GGUF quantized file
ModelSource::gguf("/path/to/model.gguf")

// UQFF pre-quantized
ModelSource::uqff("/path/to/model.uqff")
```

## Hardware Acceleration

### CUDA (NVIDIA)

```toml
[dependencies]
adk-mistralrs = { git = "https://github.com/zavora-ai/adk-rust", features = ["cuda"] }
```

```rust
use adk_mistralrs::{Device, DeviceConfig};

let config = MistralRsConfig::builder()
    .device(Device::Cuda(0))  // Use GPU 0
    .build();
```

### Metal (Apple Silicon)

```toml
[dependencies]
adk-mistralrs = { git = "https://github.com/zavora-ai/adk-rust", features = ["metal"] }
```

```rust
let config = MistralRsConfig::builder()
    .device(Device::Metal)
    .build();
```

### CPU Optimization

```toml
[dependencies]
adk-mistralrs = { git = "https://github.com/zavora-ai/adk-rust", features = ["mkl"] }
```

## Quantization

### ISQ (In-Situ Quantization)

Reduce memory usage by quantizing models at runtime:

```rust
use adk_mistralrs::QuantizationLevel;

let config = MistralRsConfig::builder()
    .model_source(ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct"))
    .isq(QuantizationLevel::Q4_0)  // 4-bit quantization
    .build();
```

### Quantization Levels

| Level | Memory | Quality | Use Case |
|-------|--------|---------|----------|
| `Q4_0` | Lowest | Good | Resource-constrained |
| `Q4_1` | Low | Better | Balanced |
| `Q8_0` | Medium | High | Quality-focused |
| `Q8_1` | Medium | Highest | Best quality |

### Pre-Quantized Models

```rust
// GGUF quantized model
let config = MistralRsConfig::builder()
    .model_source(ModelSource::gguf("/path/to/model-q4_0.gguf"))
    .build();
```

## Adapter Support

### LoRA Adapters

```rust
use adk_mistralrs::{MistralRsAdapterModel, AdapterConfig};

let config = MistralRsConfig::builder()
    .model_source(ModelSource::huggingface("microsoft/Phi-3.5-mini-instruct"))
    .adapter_config(AdapterConfig::lora("username/my-lora-adapter"))
    .build();

let model = MistralRsAdapterModel::new(config).await?;

// Hot-swap adapters at runtime
model.swap_adapter("another-adapter").await?;
```

### X-LoRA (Mixture of Adapters)

```rust
use std::path::PathBuf;

let config = MistralRsConfig::builder()
    .model_source(ModelSource::huggingface("base-model"))
    .adapter_config(AdapterConfig::xlora(
        "username/xlora-model",
        PathBuf::from("ordering.json")
    ))
    .build();
```

## Performance Optimization

### Memory Management

```rust
let config = MistralRsConfig::builder()
    .paged_attention(true)      // Enable for long contexts
    .isq(QuantizationLevel::Q4_0)  // Reduce memory usage
    .max_tokens(1024)           // Limit output length
    .build();
```

### Batch Processing

```rust
// Process multiple requests efficiently
let requests = vec![
    LlmRequest::new("What is AI?"),
    LlmRequest::new("Explain machine learning"),
];

for request in requests {
    let response = model.generate_content(request, false).await?;
    // Process response
}
```

## Error Handling

```rust
use adk_mistralrs::MistralRsError;

match MistralRsModel::new(config).await {
    Ok(model) => {
        // Use model
    }
    Err(MistralRsError::ModelNotFound { path }) => {
        eprintln!("Model not found at: {}", path);
    }
    Err(MistralRsError::OutOfMemory { details }) => {
        eprintln!("Out of memory: {}. Try reducing context length or enabling ISQ.", details);
    }
    Err(MistralRsError::DeviceNotAvailable { device }) => {
        eprintln!("Device {:?} not available. Falling back to CPU.", device);
    }
    Err(e) => {
        eprintln!("Error: {}", e);
    }
}
```

## Recommended Models

### Small Models (< 4GB)

| Model | Size | Strengths |
|-------|------|-----------|
| `microsoft/Phi-3.5-mini-instruct` | 3.8B | Fast, instruction-following |
| `Qwen/Qwen2.5-3B-Instruct` | 3B | Multilingual, coding |
| `google/gemma-2-2b-it` | 2B | Efficient, Google-trained |

### Medium Models (4-8GB)

| Model | Size | Strengths |
|-------|------|-----------|
| `microsoft/Phi-3.5-medium-instruct` | 14B | Balanced performance |
| `Qwen/Qwen2.5-7B-Instruct` | 7B | Excellent reasoning |
| `mistralai/Mistral-7B-Instruct-v0.3` | 7B | Strong general purpose |

### Large Models (8GB+)

| Model | Size | Strengths |
|-------|------|-----------|
| `Qwen/Qwen2.5-14B-Instruct` | 14B | High quality reasoning |
| `microsoft/Phi-3.5-vision-instruct` | 4.2B | Vision + text |

## Examples

```bash
# Basic usage
cargo run --example mistralrs_basic

# With quantization
cargo run --example mistralrs_quantized

# LoRA adapters
cargo run --example mistralrs_lora

# Multi-model setup
cargo run --example mistralrs_multimodel

# Vision models
cargo run --example mistralrs_vision
```

## Feature Flags

```toml
[features]
default = []

# Hardware acceleration
cuda = ["mistralrs/cuda"]
metal = ["mistralrs/metal"]
mkl = ["mistralrs/mkl"]

# Advanced features
flash-attn = ["cuda", "mistralrs/flash-attn"]
```

## Troubleshooting

### Common Issues

**Out of Memory**: Enable ISQ quantization or use a smaller model.

```rust
.isq(QuantizationLevel::Q4_0)
```

**CUDA Not Found**: Install CUDA toolkit or use CPU.

```rust
.device(Device::Cpu)
```

**Model Loading Slow**: Use pre-quantized GGUF models.

```rust
ModelSource::gguf("/path/to/model-q4_0.gguf")
```

## Related

- [Model Providers](providers.md) - Other LLM providers
- [LlmAgent](../agents/llm-agent.md) - Using models with agents
- [mistral.rs Documentation](https://github.com/EricLBuehler/mistral.rs) - Upstream project
