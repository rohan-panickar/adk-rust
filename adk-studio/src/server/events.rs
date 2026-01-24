//! SSE Event Schema v2.0
//!
//! This module defines the enhanced SSE event types for ADK Studio v2.0,
//! which adds support for state snapshots and data flow overlays.
//!
//! ## Features
//! - State snapshots: Input/output state at each agent execution step
//! - State keys: List of state keys for data flow overlay visualization
//!
//! ## Requirements Traceability
//! - Requirement 5.8: State snapshot capture at each node during execution
//! - Requirement 3.3: State keys sourced from runtime execution events

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// State snapshot captured at agent start/end events.
/// Contains input and output state for timeline debugging and state inspection.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StateSnapshot {
    /// Input state before node execution
    pub input: serde_json::Value,
    /// Output state after node execution
    pub output: serde_json::Value,
}

impl StateSnapshot {
    /// Create a new state snapshot with the given input and output state.
    pub fn new(input: serde_json::Value, output: serde_json::Value) -> Self {
        Self { input, output }
    }

    /// Create a snapshot with only input state (for node_start events).
    pub fn with_input(input: serde_json::Value) -> Self {
        Self {
            input,
            output: serde_json::Value::Object(Default::default()),
        }
    }

    /// Extract top-level keys from the output state for data flow overlays.
    pub fn extract_state_keys(&self) -> Vec<String> {
        match &self.output {
            serde_json::Value::Object(map) => map.keys().cloned().collect(),
            _ => Vec::new(),
        }
    }
}

/// Enhanced trace event for SSE v2.0.
/// Extends the existing trace event format with state snapshot support.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceEventV2 {
    /// Event type: node_start, node_end, state, done
    #[serde(rename = "type")]
    pub event_type: String,

    /// Agent/node name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<String>,

    /// Execution step number
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step: Option<u32>,

    /// Duration in milliseconds (for node_end events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,

    /// Total steps (for done events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_steps: Option<u32>,

    /// v2.0: State snapshot for timeline/inspector
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state_snapshot: Option<StateSnapshot>,

    /// v2.0: State keys for data flow overlays
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state_keys: Option<Vec<String>>,

    /// Legacy state field for backward compatibility
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<serde_json::Value>,
}

impl TraceEventV2 {
    /// Create a node_start event with state snapshot.
    pub fn node_start(node: &str, step: u32, input_state: serde_json::Value) -> Self {
        let snapshot = StateSnapshot::with_input(input_state);
        let state_keys = snapshot.extract_state_keys();
        Self {
            event_type: "node_start".to_string(),
            node: Some(node.to_string()),
            step: Some(step),
            duration_ms: None,
            total_steps: None,
            state_snapshot: Some(snapshot),
            state_keys: if state_keys.is_empty() {
                None
            } else {
                Some(state_keys)
            },
            state: None,
        }
    }

    /// Create a node_end event with state snapshot.
    pub fn node_end(
        node: &str,
        step: u32,
        duration_ms: u64,
        input_state: serde_json::Value,
        output_state: serde_json::Value,
    ) -> Self {
        let snapshot = StateSnapshot::new(input_state, output_state);
        let state_keys = snapshot.extract_state_keys();
        Self {
            event_type: "node_end".to_string(),
            node: Some(node.to_string()),
            step: Some(step),
            duration_ms: Some(duration_ms),
            total_steps: None,
            state_snapshot: Some(snapshot),
            state_keys: if state_keys.is_empty() {
                None
            } else {
                Some(state_keys)
            },
            state: None,
        }
    }

    /// Create a done event with final state snapshot.
    pub fn done(total_steps: u32, input_state: serde_json::Value, output_state: serde_json::Value) -> Self {
        let snapshot = StateSnapshot::new(input_state, output_state);
        let state_keys = snapshot.extract_state_keys();
        Self {
            event_type: "done".to_string(),
            node: None,
            step: None,
            duration_ms: None,
            total_steps: Some(total_steps),
            state_snapshot: Some(snapshot),
            state_keys: if state_keys.is_empty() {
                None
            } else {
                Some(state_keys)
            },
            state: None,
        }
    }

    /// Create a state update event.
    pub fn state_update(output_state: serde_json::Value) -> Self {
        let snapshot = StateSnapshot::new(serde_json::Value::Object(Default::default()), output_state);
        let state_keys = snapshot.extract_state_keys();
        Self {
            event_type: "state".to_string(),
            node: None,
            step: None,
            duration_ms: None,
            total_steps: None,
            state_snapshot: Some(snapshot),
            state_keys: if state_keys.is_empty() {
                None
            } else {
                Some(state_keys)
            },
            state: None,
        }
    }

    /// Convert to JSON string for SSE emission.
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }
}

/// Execution state tracker for capturing state snapshots.
/// Used by the SSE handler to track state across agent executions.
#[derive(Debug, Clone, Default)]
pub struct ExecutionStateTracker {
    /// Current execution state
    current_state: HashMap<String, serde_json::Value>,
    /// Step counter
    step: u32,
    /// Node start times for duration calculation
    node_start_times: HashMap<String, std::time::Instant>,
}

impl ExecutionStateTracker {
    /// Create a new execution state tracker.
    pub fn new() -> Self {
        Self::default()
    }

    /// Record node start and return the trace event.
    pub fn node_start(&mut self, node: &str) -> TraceEventV2 {
        self.step += 1;
        self.node_start_times
            .insert(node.to_string(), std::time::Instant::now());
        let input_state = serde_json::to_value(&self.current_state).unwrap_or_default();
        TraceEventV2::node_start(node, self.step, input_state)
    }

    /// Record node end and return the trace event.
    pub fn node_end(&mut self, node: &str, output_state: serde_json::Value) -> TraceEventV2 {
        let duration_ms = self
            .node_start_times
            .remove(node)
            .map(|start| start.elapsed().as_millis() as u64)
            .unwrap_or(0);

        let input_state = serde_json::to_value(&self.current_state).unwrap_or_default();

        // Merge output state into current state
        if let serde_json::Value::Object(map) = &output_state {
            for (k, v) in map {
                self.current_state.insert(k.clone(), v.clone());
            }
        }

        TraceEventV2::node_end(node, self.step, duration_ms, input_state, output_state)
    }

    /// Record execution complete and return the done event.
    pub fn done(&self) -> TraceEventV2 {
        let output_state = serde_json::to_value(&self.current_state).unwrap_or_default();
        TraceEventV2::done(
            self.step,
            serde_json::Value::Object(Default::default()),
            output_state,
        )
    }

    /// Update current state with new values.
    pub fn update_state(&mut self, key: &str, value: serde_json::Value) {
        self.current_state.insert(key.to_string(), value);
    }

    /// Get current step count.
    pub fn current_step(&self) -> u32 {
        self.step
    }

    /// Get current state as JSON value.
    pub fn current_state_value(&self) -> serde_json::Value {
        serde_json::to_value(&self.current_state).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_snapshot_extract_keys() {
        let snapshot = StateSnapshot::new(
            serde_json::json!({"input_key": "value"}),
            serde_json::json!({"output_key1": "value1", "output_key2": "value2"}),
        );
        let keys = snapshot.extract_state_keys();
        assert!(keys.contains(&"output_key1".to_string()));
        assert!(keys.contains(&"output_key2".to_string()));
        assert_eq!(keys.len(), 2);
    }

    #[test]
    fn test_trace_event_node_start() {
        let event = TraceEventV2::node_start("test_agent", 1, serde_json::json!({"query": "test"}));
        assert_eq!(event.event_type, "node_start");
        assert_eq!(event.node, Some("test_agent".to_string()));
        assert_eq!(event.step, Some(1));
        assert!(event.state_snapshot.is_some());
    }

    #[test]
    fn test_trace_event_node_end() {
        let event = TraceEventV2::node_end(
            "test_agent",
            1,
            1500,
            serde_json::json!({"query": "test"}),
            serde_json::json!({"query": "test", "result": "answer"}),
        );
        assert_eq!(event.event_type, "node_end");
        assert_eq!(event.duration_ms, Some(1500));
        assert!(event.state_keys.is_some());
        let keys = event.state_keys.unwrap();
        assert!(keys.contains(&"query".to_string()));
        assert!(keys.contains(&"result".to_string()));
    }

    #[test]
    fn test_execution_state_tracker() {
        let mut tracker = ExecutionStateTracker::new();

        // Start node
        let start_event = tracker.node_start("agent1");
        assert_eq!(start_event.event_type, "node_start");
        assert_eq!(tracker.current_step(), 1);

        // End node with output
        let end_event = tracker.node_end("agent1", serde_json::json!({"result": "done"}));
        assert_eq!(end_event.event_type, "node_end");
        assert!(end_event.duration_ms.is_some());

        // Done
        let done_event = tracker.done();
        assert_eq!(done_event.event_type, "done");
        assert_eq!(done_event.total_steps, Some(1));
    }
}
