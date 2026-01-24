import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import dagre from 'dagre';
import type { LayoutDirection, LayoutMode } from '../types/layout';
import { useStore } from '../store';

/**
 * Hook for managing canvas layout.
 * Supports both free-form and fixed (auto-layout) modes.
 * 
 * In free mode: Nodes can be placed anywhere, manual positioning
 * In fixed mode: Nodes are auto-arranged using Dagre layout
 */
export function useLayout() {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
  
  // Layout state from store
  const layoutMode = useStore(s => s.layoutMode);
  const layoutDirection = useStore(s => s.layoutDirection);
  const snapToGrid = useStore(s => s.snapToGrid);
  const gridSize = useStore(s => s.gridSize);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  
  // Layout actions from store
  const setLayoutMode = useStore(s => s.setLayoutMode);
  const setLayoutDirection = useStore(s => s.setLayoutDirection);
  const setSnapToGrid = useStore(s => s.setSnapToGrid);
  const setGridSize = useStore(s => s.setGridSize);

  // Padding accounts for side panel (~320px) when node is selected
  const getPadding = useCallback(() => {
    return selectedNodeId ? { top: 0.1, left: 0.1, bottom: 0.1, right: 0.35 } : 0.1;
  }, [selectedNodeId]);

  // Apply Dagre auto-layout
  const doLayout = useCallback((direction: LayoutDirection) => {
    const nodes = getNodes();
    const edges = getEdges();
    if (nodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node => g.setNode(node.id, { width: 180, height: 100 }));
    edges.forEach(edge => g.setEdge(edge.source, edge.target));
    dagre.layout(g);

    setNodes(nodes.map(node => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - 90, y: pos.y - 50 } };
    }));

    setTimeout(() => fitView({ padding: getPadding(), maxZoom: 0.9 }), 50);
  }, [getNodes, getEdges, setNodes, fitView, getPadding]);

  // Toggle layout direction (TB <-> LR)
  const toggleDirection = useCallback(() => {
    const newDirection: LayoutDirection = layoutDirection === 'LR' ? 'TB' : 'LR';
    setLayoutDirection(newDirection);
    // Auto-apply layout when in fixed mode
    if (layoutMode === 'fixed') {
      doLayout(newDirection);
    }
  }, [layoutDirection, layoutMode, setLayoutDirection, doLayout]);

  // Toggle layout mode (free <-> fixed)
  const toggleMode = useCallback(() => {
    const newMode: LayoutMode = layoutMode === 'free' ? 'fixed' : 'free';
    setLayoutMode(newMode);
    // Apply layout when switching to fixed mode
    if (newMode === 'fixed') {
      doLayout(layoutDirection);
    }
  }, [layoutMode, layoutDirection, setLayoutMode, doLayout]);

  // Legacy: Toggle layout (direction) - for backward compatibility
  const toggleLayout = useCallback(() => {
    toggleDirection();
  }, [toggleDirection]);

  // Apply layout without toggling (uses current direction)
  const applyLayout = useCallback(() => {
    doLayout(layoutDirection);
  }, [doLayout, layoutDirection]);

  // Fit all nodes in view
  const fitToView = useCallback(() => {
    fitView({ padding: getPadding(), duration: 300, maxZoom: 0.9 });
  }, [fitView, getPadding]);

  // Snap position to grid
  const snapPosition = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }, [snapToGrid, gridSize]);

  return {
    // State
    layoutMode,
    layoutDirection,
    snapToGrid,
    gridSize,
    
    // Mode actions
    setLayoutMode,
    toggleMode,
    
    // Direction actions
    setLayoutDirection,
    toggleDirection,
    toggleLayout, // Legacy alias for toggleDirection
    
    // Grid actions
    setSnapToGrid,
    setGridSize,
    snapPosition,
    
    // Layout actions
    applyLayout,
    fitToView,
  };
}
