/**
 * TransformPanel Component for ADK Studio
 * 
 * Properties panel for configuring Transform action nodes.
 * Provides UI for transform type selection, expression editing,
 * built-in operations, and type coercion.
 * 
 * Requirements: 5.1, 5.2, 5.3, 12.2
 */

import React, { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import type { 
  TransformNodeConfig, 
  TransformType,
  BuiltinOperation,
  BuiltinOperationType,
  TypeCoercion,
  CoercionTargetType,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/transformPanel.css';

// ============================================
// Constants
// ============================================

const TRANSFORM_TYPES: readonly TransformType[] = ['jsonpath', 'jmespath', 'template', 'javascript'];

const TRANSFORM_TYPE_CONFIG: Record<TransformType, { 
  label: string; 
  description: string; 
  icon: string;
  placeholder: string;
}> = {
  jsonpath: { 
    label: 'JSONPath', 
    description: 'Query JSON data using JSONPath expressions',
    icon: '🔍',
    placeholder: '$.data.items[*].name',
  },
  jmespath: { 
    label: 'JMESPath', 
    description: 'Query JSON with JMESPath expressions',
    icon: '🔎',
    placeholder: 'data.items[*].name',
  },
  template: { 
    label: 'Template', 
    description: 'Transform using Handlebars-style templates',
    icon: '📄',
    placeholder: '{{#each items}}{{name}}, {{/each}}',
  },
  javascript: { 
    label: 'JavaScript', 
    description: 'Custom JavaScript transformation (sandboxed)',
    icon: '📜',
    placeholder: 'return input.items.map(item => item.name);',
  },
};

const BUILTIN_OPERATIONS: readonly BuiltinOperationType[] = [
  'pick', 'omit', 'rename', 'flatten', 'sort', 'unique'
];

const OPERATION_CONFIG: Record<BuiltinOperationType, {
  label: string;
  description: string;
  icon: string;
  configFields: string[];
}> = {
  pick: {
    label: 'Pick',
    description: 'Select specific fields from object',
    icon: '✂️',
    configFields: ['fields'],
  },
  omit: {
    label: 'Omit',
    description: 'Exclude specific fields from object',
    icon: '🚫',
    configFields: ['fields'],
  },
  rename: {
    label: 'Rename',
    description: 'Rename object fields',
    icon: '✏️',
    configFields: ['from', 'to'],
  },
  flatten: {
    label: 'Flatten',
    description: 'Flatten nested objects',
    icon: '📋',
    configFields: ['depth'],
  },
  sort: {
    label: 'Sort',
    description: 'Sort array by field',
    icon: '🔢',
    configFields: ['field', 'order'],
  },
  unique: {
    label: 'Unique',
    description: 'Remove duplicate values from array',
    icon: '🎯',
    configFields: ['field'],
  },
};

const COERCION_TYPES: readonly CoercionTargetType[] = [
  'string', 'number', 'boolean', 'array', 'object'
];

const COERCION_TYPE_LABELS: Record<CoercionTargetType, string> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  array: 'Array',
  object: 'Object',
};

// ============================================
// Helper Components
// ============================================

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="transform-panel-section">
      <button 
        className="transform-panel-section-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="transform-panel-section-toggle">{isOpen ? '▼' : '▶'}</span>
        <span className="transform-panel-section-title">{title}</span>
      </button>
      {isOpen && (
        <div className="transform-panel-section-content">
          {children}
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div className="transform-panel-field">
      <label className="transform-panel-label">
        {label}
        {required && <span className="transform-panel-required">*</span>}
        {hint && <span className="transform-panel-hint">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export interface TransformPanelProps {
  /** Current Transform node configuration */
  node: TransformNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: TransformNodeConfig) => void;
}

/**
 * TransformPanel provides configuration UI for Transform action nodes.
 * 
 * Features:
 * - Transform type selector (JSONPath, JMESPath, Template, JavaScript) (Requirement 5.1)
 * - Expression editor with syntax highlighting hints (Requirement 5.1)
 * - Built-in operations list with add/remove (Requirement 5.2)
 * - Type coercion configuration (Requirement 5.3)
 * - Standard properties panel integration
 * 
 * @see Requirements 5.1, 5.2, 5.3, 12.2
 */
export function TransformPanel({ node, onChange }: TransformPanelProps) {
  const [useOperations, setUseOperations] = useState(
    (node.operations?.length ?? 0) > 0
  );
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateTransformType = useCallback((transformType: TransformType) => {
    onChange({ ...node, transformType });
  }, [node, onChange]);
  
  const updateExpression = useCallback((expression: string) => {
    onChange({ ...node, expression });
  }, [node, onChange]);
  
  const updateOperations = useCallback((operations: BuiltinOperation[]) => {
    onChange({ ...node, operations });
  }, [node, onChange]);
  
  const updateTypeCoercion = useCallback((typeCoercion: TypeCoercion | undefined) => {
    if (typeCoercion === undefined) {
      const { typeCoercion: _, ...rest } = node;
      onChange(rest as TransformNodeConfig);
    } else {
      onChange({ ...node, typeCoercion });
    }
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  const handleModeToggle = useCallback((useOps: boolean) => {
    setUseOperations(useOps);
    if (useOps) {
      // Clear expression when switching to operations mode
      onChange({ ...node, expression: '', operations: node.operations || [] });
    } else {
      // Clear operations when switching to expression mode
      onChange({ ...node, operations: undefined });
    }
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="transform-panel">
      {/* Transform Type Selection (Requirement 5.1) */}
      <CollapsibleSection title="Transform Type" defaultOpen>
        <div className="transform-type-selector">
          {TRANSFORM_TYPES.map((type) => {
            const config = TRANSFORM_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                className={`transform-type-option ${node.transformType === type ? 'selected' : ''}`}
                onClick={() => updateTransformType(type)}
              >
                <span className="transform-type-icon">{config.icon}</span>
                <span className="transform-type-label">{config.label}</span>
                <span className="transform-type-description">{config.description}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      
      {/* Mode Toggle: Expression vs Operations */}
      <CollapsibleSection title="Transform Mode" defaultOpen>
        <div className="transform-mode-toggle">
          <button
            type="button"
            className={`transform-mode-option ${!useOperations ? 'selected' : ''}`}
            onClick={() => handleModeToggle(false)}
          >
            <span className="transform-mode-icon">📝</span>
            <span className="transform-mode-label">Expression</span>
            <span className="transform-mode-hint">Write custom expression</span>
          </button>
          <button
            type="button"
            className={`transform-mode-option ${useOperations ? 'selected' : ''}`}
            onClick={() => handleModeToggle(true)}
          >
            <span className="transform-mode-icon">🔧</span>
            <span className="transform-mode-label">Operations</span>
            <span className="transform-mode-hint">Use built-in operations</span>
          </button>
        </div>
      </CollapsibleSection>
      
      {/* Expression Editor (Requirement 5.1) */}
      {!useOperations && (
        <ExpressionSection
          transformType={node.transformType}
          expression={node.expression}
          onChange={updateExpression}
        />
      )}
      
      {/* Built-in Operations (Requirement 5.2) */}
      {useOperations && (
        <OperationsSection
          operations={node.operations || []}
          onChange={updateOperations}
        />
      )}
      
      {/* Type Coercion (Requirement 5.3) */}
      <TypeCoercionSection
        typeCoercion={node.typeCoercion}
        onChange={updateTypeCoercion}
      />
      
      {/* Standard Properties */}
      <StandardPropertiesPanel
        properties={node}
        onChange={updateStandardProperties}
        showIdentity
      />
    </div>
  );
}

// ============================================
// Expression Section Component
// ============================================

interface ExpressionSectionProps {
  transformType: TransformType;
  expression: string;
  onChange: (expression: string) => void;
}

/**
 * Expression editor section with syntax hints.
 * @see Requirement 5.1
 */
function ExpressionSection({ transformType, expression, onChange }: ExpressionSectionProps) {
  const config = TRANSFORM_TYPE_CONFIG[transformType];
  
  return (
    <CollapsibleSection title="Expression" defaultOpen>
      <Field label="Transform Expression" required hint={config.label}>
        <textarea
          className="transform-panel-expression"
          value={expression}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          rows={6}
          spellCheck={false}
        />
      </Field>
      
      {/* Syntax hints based on transform type */}
      <div className="transform-panel-hints">
        <ExpressionHints transformType={transformType} />
      </div>
    </CollapsibleSection>
  );
}

/**
 * Syntax hints for different transform types.
 */
function ExpressionHints({ transformType }: { transformType: TransformType }) {
  switch (transformType) {
    case 'jsonpath':
      return (
        <div className="transform-hint-box">
          <div className="transform-hint-title">JSONPath Syntax</div>
          <ul className="transform-hint-list">
            <li><code>$</code> - Root object</li>
            <li><code>$.field</code> - Access field</li>
            <li><code>$[0]</code> - Array index</li>
            <li><code>$[*]</code> - All array elements</li>
            <li><code>$.items[?(@.price &gt; 10)]</code> - Filter</li>
          </ul>
        </div>
      );
    case 'jmespath':
      return (
        <div className="transform-hint-box">
          <div className="transform-hint-title">JMESPath Syntax</div>
          <ul className="transform-hint-list">
            <li><code>field</code> - Access field</li>
            <li><code>field.nested</code> - Nested access</li>
            <li><code>[0]</code> - Array index</li>
            <li><code>[*].name</code> - Project field from array</li>
            <li><code>[?price &gt; `10`]</code> - Filter</li>
          </ul>
        </div>
      );
    case 'template':
      return (
        <div className="transform-hint-box">
          <div className="transform-hint-title">Template Syntax</div>
          <ul className="transform-hint-list">
            <li><code>{'{{field}}'}</code> - Variable</li>
            <li><code>{'{{#each items}}...{{/each}}'}</code> - Loop</li>
            <li><code>{'{{#if condition}}...{{/if}}'}</code> - Conditional</li>
            <li><code>{'{{#with object}}...{{/with}}'}</code> - Context</li>
          </ul>
        </div>
      );
    case 'javascript':
      return (
        <div className="transform-hint-box">
          <div className="transform-hint-title">JavaScript Context</div>
          <ul className="transform-hint-list">
            <li><code>input</code> - Input data from state</li>
            <li><code>return value;</code> - Return transformed value</li>
            <li>Standard JS methods available</li>
            <li>Runs in sandboxed environment</li>
          </ul>
        </div>
      );
    default:
      return null;
  }
}

// ============================================
// Operations Section Component
// ============================================

interface OperationsSectionProps {
  operations: BuiltinOperation[];
  onChange: (operations: BuiltinOperation[]) => void;
}

/**
 * Built-in operations list editor.
 * @see Requirement 5.2
 */
function OperationsSection({ operations, onChange }: OperationsSectionProps) {
  
  const handleAdd = (type: BuiltinOperationType) => {
    const newOp: BuiltinOperation = {
      type,
      config: getDefaultConfig(type),
    };
    onChange([...operations, newOp]);
  };
  
  const handleRemove = (index: number) => {
    const newOps = [...operations];
    newOps.splice(index, 1);
    onChange(newOps);
  };
  
  const handleUpdate = (index: number, config: Record<string, unknown>) => {
    const newOps = [...operations];
    newOps[index] = { ...newOps[index], config };
    onChange(newOps);
  };
  
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOps = [...operations];
    [newOps[index - 1], newOps[index]] = [newOps[index], newOps[index - 1]];
    onChange(newOps);
  };
  
  const handleMoveDown = (index: number) => {
    if (index === operations.length - 1) return;
    const newOps = [...operations];
    [newOps[index], newOps[index + 1]] = [newOps[index + 1], newOps[index]];
    onChange(newOps);
  };
  
  return (
    <CollapsibleSection title="Operations" defaultOpen>
      {operations.length === 0 ? (
        <div className="transform-panel-empty">
          <span className="transform-panel-empty-icon">🔧</span>
          <span className="transform-panel-empty-text">No operations defined</span>
          <span className="transform-panel-empty-hint">Add operations to transform data</span>
        </div>
      ) : (
        <div className="transform-operations-list">
          {operations.map((op, index) => (
            <OperationRow
              key={index}
              operation={op}
              index={index}
              total={operations.length}
              onUpdate={(config) => handleUpdate(index, config)}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>
      )}
      
      {/* Add operation dropdown */}
      <div className="transform-add-operation">
        <span className="transform-add-label">Add operation:</span>
        <div className="transform-add-buttons">
          {BUILTIN_OPERATIONS.map((type) => {
            const config = OPERATION_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                className="transform-add-button"
                onClick={() => handleAdd(type)}
                title={config.description}
              >
                <span className="transform-add-icon">{config.icon}</span>
                <span className="transform-add-text">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </CollapsibleSection>
  );
}

/**
 * Get default config for an operation type.
 */
function getDefaultConfig(type: BuiltinOperationType): Record<string, unknown> {
  switch (type) {
    case 'pick':
    case 'omit':
      return { fields: [] };
    case 'rename':
      return { from: '', to: '' };
    case 'flatten':
      return { depth: 1 };
    case 'sort':
      return { field: '', order: 'asc' };
    case 'unique':
      return { field: '' };
    default:
      return {};
  }
}

// ============================================
// Operation Row Component
// ============================================

interface OperationRowProps {
  operation: BuiltinOperation;
  index: number;
  total: number;
  onUpdate: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * Single operation row with configuration.
 */
function OperationRow({ 
  operation, 
  index, 
  total, 
  onUpdate, 
  onRemove,
  onMoveUp,
  onMoveDown,
}: OperationRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = OPERATION_CONFIG[operation.type];
  
  return (
    <div className={`transform-operation-row ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="transform-operation-header">
        <button
          type="button"
          className="transform-operation-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        
        <span className="transform-operation-icon">{config.icon}</span>
        <span className="transform-operation-label">{config.label}</span>
        <span className="transform-operation-index">#{index + 1}</span>
        
        <div className="transform-operation-actions">
          <button
            type="button"
            className="transform-operation-action"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="transform-operation-action"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="transform-operation-remove"
            onClick={onRemove}
            title="Remove operation"
          >
            ×
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="transform-operation-body">
          <OperationConfig
            type={operation.type}
            config={operation.config}
            onChange={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Operation Config Component
// ============================================

interface OperationConfigProps {
  type: BuiltinOperationType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

/**
 * Operation-specific configuration fields.
 */
function OperationConfig({ type, config, onChange }: OperationConfigProps) {
  switch (type) {
    case 'pick':
    case 'omit':
      return (
        <FieldsConfig
          label={type === 'pick' ? 'Fields to pick' : 'Fields to omit'}
          fields={(config.fields as string[]) || []}
          onChange={(fields) => onChange({ ...config, fields })}
        />
      );
    
    case 'rename':
      return (
        <div className="transform-config-rename">
          <Field label="From field">
            <input
              type="text"
              className="transform-panel-input"
              value={(config.from as string) || ''}
              onChange={(e) => onChange({ ...config, from: e.target.value })}
              placeholder="originalName"
            />
          </Field>
          <span className="transform-config-arrow">→</span>
          <Field label="To field">
            <input
              type="text"
              className="transform-panel-input"
              value={(config.to as string) || ''}
              onChange={(e) => onChange({ ...config, to: e.target.value })}
              placeholder="newName"
            />
          </Field>
        </div>
      );
    
    case 'flatten':
      return (
        <Field label="Depth" hint="levels to flatten">
          <input
            type="number"
            className="transform-panel-input"
            value={(config.depth as number) || 1}
            onChange={(e) => onChange({ ...config, depth: parseInt(e.target.value, 10) || 1 })}
            min={1}
            max={10}
          />
        </Field>
      );
    
    case 'sort':
      return (
        <div className="transform-config-sort">
          <Field label="Sort by field">
            <input
              type="text"
              className="transform-panel-input"
              value={(config.field as string) || ''}
              onChange={(e) => onChange({ ...config, field: e.target.value })}
              placeholder="fieldName"
            />
          </Field>
          <Field label="Order">
            <select
              className="transform-panel-select"
              value={(config.order as string) || 'asc'}
              onChange={(e) => onChange({ ...config, order: e.target.value })}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </Field>
        </div>
      );
    
    case 'unique':
      return (
        <Field label="Unique by field" hint="leave empty for primitive arrays">
          <input
            type="text"
            className="transform-panel-input"
            value={(config.field as string) || ''}
            onChange={(e) => onChange({ ...config, field: e.target.value })}
            placeholder="fieldName (optional)"
          />
        </Field>
      );
    
    default:
      return null;
  }
}

/**
 * Fields list editor for pick/omit operations.
 */
function FieldsConfig({ 
  label, 
  fields, 
  onChange 
}: { 
  label: string; 
  fields: string[]; 
  onChange: (fields: string[]) => void;
}) {
  const [newField, setNewField] = useState('');
  
  const handleAdd = () => {
    if (newField.trim() && !fields.includes(newField.trim())) {
      onChange([...fields, newField.trim()]);
      setNewField('');
    }
  };
  
  const handleRemove = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onChange(newFields);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };
  
  return (
    <div className="transform-fields-config">
      <label className="transform-panel-label">{label}</label>
      
      {fields.length > 0 && (
        <div className="transform-fields-list">
          {fields.map((field, index) => (
            <span key={index} className="transform-field-tag">
              <code>{field}</code>
              <button
                type="button"
                className="transform-field-remove"
                onClick={() => handleRemove(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className="transform-field-add">
        <input
          type="text"
          className="transform-panel-input"
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add field name"
        />
        <button
          type="button"
          className="transform-field-add-btn"
          onClick={handleAdd}
          disabled={!newField.trim()}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================
// Type Coercion Section Component
// ============================================

interface TypeCoercionSectionProps {
  typeCoercion?: TypeCoercion;
  onChange: (typeCoercion: TypeCoercion | undefined) => void;
}

/**
 * Type coercion configuration section.
 * @see Requirement 5.3
 */
function TypeCoercionSection({ typeCoercion, onChange }: TypeCoercionSectionProps) {
  const [enabled, setEnabled] = useState(!!typeCoercion);
  
  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled) {
      onChange({ targetType: 'string' });
    } else {
      onChange(undefined);
    }
  };
  
  return (
    <CollapsibleSection title="Type Coercion" defaultOpen={false}>
      <Field label="Enable Type Coercion">
        <label className="transform-panel-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span className="transform-panel-toggle-slider" />
          <span className="transform-panel-toggle-label">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {enabled && typeCoercion && (
        <Field label="Target Type" hint="convert result to">
          <select
            className="transform-panel-select"
            value={typeCoercion.targetType}
            onChange={(e) => onChange({ targetType: e.target.value as CoercionTargetType })}
          >
            {COERCION_TYPES.map((type) => (
              <option key={type} value={type}>
                {COERCION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <div className="transform-panel-field-help">
            The transformation result will be coerced to the selected type.
          </div>
        </Field>
      )}
    </CollapsibleSection>
  );
}

export default TransformPanel;
