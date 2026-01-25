/**
 * WaitNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Wait action nodes.
 * Displays wait type and duration preview with comprehensive
 * information about the wait configuration.
 * 
 * Requirements: 9.1, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { WaitNodeConfig, WaitType, TimeUnit } from '../../types/actionNodes';
import '../../styles/waitNode.css';

interface WaitNodeData extends WaitNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: WaitNodeData;
  selected?: boolean;
}

/**
 * Wait type labels for display
 */
const WAIT_TYPE_LABELS: Record<WaitType, string> = {
  fixed: 'Fixed',
  until: 'Until',
  webhook: 'Webhook',
  condition: 'Condition',
};

/**
 * Wait type icons for visual distinction
 */
const WAIT_TYPE_ICONS: Record<WaitType, string> = {
  fixed: '⏱️',
  until: '📅',
  webhook: '🔗',
  condition: '🔄',
};

/**
 * Time unit labels for display
 */
const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  ms: 'ms',
  s: 'sec',
  m: 'min',
  h: 'hr',
};

/**
 * Format duration for display
 */
function formatDuration(duration: number, unit: TimeUnit): string {
  return `${duration}${TIME_UNIT_LABELS[unit]}`;
}

/**
 * Format condition polling info for display
 */
function formatConditionInfo(pollInterval: number, maxWait: number): string {
  const pollSec = Math.round(pollInterval / 1000);
  const maxSec = Math.round(maxWait / 1000);
  return `Poll: ${pollSec}s, Max: ${maxSec}s`;
}

/**
 * WaitNode displays delays and timing with comprehensive preview.
 * 
 * Features:
 * - Wait type badge with icon (Requirement 9.1)
 * - Duration preview for fixed waits (Requirement 9.2)
 * - Condition polling info for condition waits (Requirement 9.3)
 * - Webhook path preview for webhook waits
 * - Timestamp preview for until waits
 * 
 * @see Requirements 9.1, 12.1, 12.3
 */
export const WaitNode = memo(function WaitNode({ data, selected }: Props) {
  const waitType = data.waitType || 'fixed';
  const typeLabel = WAIT_TYPE_LABELS[waitType];
  const typeIcon = WAIT_TYPE_ICONS[waitType];

  /**
   * Get the preview text based on wait type
   */
  const getPreviewText = (): string | null => {
    switch (waitType) {
      case 'fixed':
        if (data.fixed) {
          return formatDuration(data.fixed.duration, data.fixed.unit);
        }
        return null;
      
      case 'until':
        if (data.until?.timestamp) {
          // Show truncated timestamp
          const ts = data.until.timestamp;
          return ts.length > 16 ? ts.substring(0, 16) + '...' : ts;
        }
        return null;
      
      case 'webhook':
        if (data.webhook?.path) {
          const path = data.webhook.path;
          return path.length > 20 ? '...' + path.slice(-17) : path;
        }
        return null;
      
      case 'condition':
        if (data.condition) {
          return formatConditionInfo(
            data.condition.pollInterval,
            data.condition.maxWait
          );
        }
        return null;
      
      default:
        return null;
    }
  };

  const previewText = getPreviewText();

  return (
    <ActionNodeBase
      type="wait"
      label={data.name || 'Wait'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="wait-node-content">
        <div className="wait-node-type">
          <span className="wait-node-type-icon">{typeIcon}</span>
          <span className="wait-node-type-badge">{typeLabel}</span>
        </div>
        {previewText && (
          <div className="wait-node-preview">
            <span className="wait-node-preview-text">{previewText}</span>
          </div>
        )}
      </div>
    </ActionNodeBase>
  );
});

export default WaitNode;
