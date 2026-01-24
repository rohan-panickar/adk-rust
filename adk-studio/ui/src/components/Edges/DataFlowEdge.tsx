import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

/**
 * Data for data flow edges.
 * State keys are populated from runtime SSE events.
 */
interface DataFlowEdgeData {
  animated?: boolean;
  stateKeys?: string[];
  showOverlay?: boolean;
}

/**
 * DataFlowEdge displays state key labels on edges.
 * 
 * State keys are sourced from runtime SSE events (agent input/output state).
 * Labels are only shown when:
 * 1. showOverlay is enabled
 * 2. stateKeys were provided by runtime (not inferred)
 * 
 * This component will be fully implemented in Task 14 (Data Flow Overlays).
 */
export const DataFlowEdge = memo(function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as DataFlowEdgeData | undefined;
  const isAnimated = edgeData?.animated || false;
  const shouldShowLabel = edgeData?.showOverlay && edgeData?.stateKeys && edgeData.stateKeys.length > 0;

  return (
    <>
      {/* Base edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isAnimated ? '#ef4444' : selected ? '#3b82f6' : '#6b7280'}
        strokeWidth={isAnimated ? 3 : selected ? 2.5 : 2}
        strokeDasharray={isAnimated ? '8 4' : 'none'}
        style={{ animation: isAnimated ? 'dashFlow 0.5s linear infinite' : 'none' }}
      />
      
      {/* State key labels (only shown when overlay is enabled and keys exist) */}
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            className="data-flow-label absolute pointer-events-auto px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-md"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {edgeData!.stateKeys!.join(', ')}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Animation keyframes */}
      <style>{`@keyframes dashFlow { to { stroke-dashoffset: -12; } }`}</style>
    </>
  );
});

DataFlowEdge.displayName = 'DataFlowEdge';
