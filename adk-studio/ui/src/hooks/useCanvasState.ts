import { useState, useCallback } from 'react';
import { Viewport } from '@xyflow/react';

export interface CanvasUIState {
  showMinimap: boolean;
  showDataFlowOverlay: boolean;
  showConsole: boolean;
}

const defaultUIState: CanvasUIState = {
  showMinimap: true,
  showDataFlowOverlay: false,
  showConsole: true,
};

/**
 * Hook for managing canvas-specific UI state.
 * Separates canvas UI concerns from project/execution state.
 */
export function useCanvasState() {
  // Viewport state (managed by ReactFlow, but we track for persistence)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  
  // UI visibility state
  const [uiState, setUIState] = useState<CanvasUIState>(defaultUIState);

  // Minimap toggle
  const toggleMinimap = useCallback(() => {
    setUIState(s => ({ ...s, showMinimap: !s.showMinimap }));
  }, []);

  // Data flow overlay toggle
  const toggleDataFlowOverlay = useCallback(() => {
    setUIState(s => ({ ...s, showDataFlowOverlay: !s.showDataFlowOverlay }));
  }, []);

  // Console toggle
  const toggleConsole = useCallback(() => {
    setUIState(s => ({ ...s, showConsole: !s.showConsole }));
  }, []);

  // Set specific UI state
  const setShowMinimap = useCallback((show: boolean) => {
    setUIState(s => ({ ...s, showMinimap: show }));
  }, []);

  const setShowDataFlowOverlay = useCallback((show: boolean) => {
    setUIState(s => ({ ...s, showDataFlowOverlay: show }));
  }, []);

  const setShowConsole = useCallback((show: boolean) => {
    setUIState(s => ({ ...s, showConsole: show }));
  }, []);

  // Handle viewport changes from ReactFlow
  const onViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  return {
    // Viewport
    viewport,
    setViewport,
    onViewportChange,
    
    // UI state
    showMinimap: uiState.showMinimap,
    showDataFlowOverlay: uiState.showDataFlowOverlay,
    showConsole: uiState.showConsole,
    
    // Toggles
    toggleMinimap,
    toggleDataFlowOverlay,
    toggleConsole,
    
    // Setters
    setShowMinimap,
    setShowDataFlowOverlay,
    setShowConsole,
  };
}
