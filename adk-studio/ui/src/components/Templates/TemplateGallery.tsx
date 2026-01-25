/**
 * TemplateGallery component for ADK Studio v2.0
 * 
 * Displays curated templates with category filters.
 * Allows users to select templates to load onto the canvas.
 * 
 * Requirements: 6.7
 */

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { TEMPLATES, CATEGORY_LABELS, getCategories } from './templates';
import { TemplateCard } from './TemplateCard';
import type { Template, TemplateCategory } from './templates';

interface TemplateGalleryProps {
  /** Callback when a template is selected */
  onSelect: (template: Template) => void;
  /** Callback when Run button is clicked on a template */
  onRun?: (template: Template) => void;
  /** Callback to close the gallery */
  onClose?: () => void;
  /** Whether to show as a modal */
  isModal?: boolean;
}

/**
 * Template gallery with category filters and search
 */
export function TemplateGallery({ 
  onSelect, 
  onRun, 
  onClose,
  isModal = false 
}: TemplateGalleryProps) {
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates by category and search
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = category === 'all' || template.category === category;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = getCategories();

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <h2 
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Template Gallery
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-opacity-10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="p-4 space-y-3">
        {/* Search input */}
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-default)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: category === 'all' 
                ? 'var(--accent-primary)' 
                : 'var(--bg-secondary)',
              color: category === 'all' 
                ? 'white' 
                : 'var(--text-secondary)',
            }}
          >
            {CATEGORY_LABELS.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: category === cat 
                  ? 'var(--accent-primary)' 
                  : 'var(--bg-secondary)',
                color: category === cat 
                  ? 'white' 
                  : 'var(--text-secondary)',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: 'var(--text-muted)' }}
          >
            <p>No templates found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelect(template)}
                onRun={onRun ? () => onRun(template) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div 
        className="p-3 border-t text-center text-sm"
        style={{ 
          borderColor: 'var(--border-default)',
          color: 'var(--text-muted)',
        }}
      >
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );

  // Render as modal or inline
  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-4xl max-h-[80vh] rounded-lg shadow-xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface-panel)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {content}
    </div>
  );
}
