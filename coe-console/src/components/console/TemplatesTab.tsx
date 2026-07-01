import { useMemo, useState } from 'react';
import { CATEGORIES } from '../../domain/categories';
import { useTemplates } from '../../domain/templateLibrary';
import { DOCUMENT_TYPES, type CategoryTemplate, type DocumentType } from '../../domain/templateTypes';
import { theme } from '../../styles/theme';
import { FilterSelect, SegmentedControl } from '../common/primitives';
import { EmptyState, LibrarySkeleton, LoadError } from './LibraryStates';
import { SearchFilterBar } from './SearchFilterBar';
import { TemplateCard } from './TemplateCard';

type TemplateDocumentFilter = 'all' | DocumentType;

const DOCUMENT_FILTER_OPTIONS: { value: TemplateDocumentFilter; label: string }[] = [
  { value: 'all', label: 'All documents' },
  ...DOCUMENT_TYPES.map((type) => ({ value: type, label: type })),
];

function matchesTemplateSearch(template: CategoryTemplate, query: string): boolean {
  if (!query) return true;
  const haystack = [
    template.title,
    template.category,
    template.description,
    template.documentType,
    template.fileFormat,
    template.fileName,
    template.owner,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function TemplatesTab() {
  const { data: templates, loading, error, refetch } = useTemplates();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [documentFilter, setDocumentFilter] = useState<TemplateDocumentFilter>('all');

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      templates.filter((template) => {
        if (categoryFilter && template.category !== categoryFilter) return false;
        if (documentFilter !== 'all' && template.documentType !== documentFilter) return false;
        return matchesTemplateSearch(template, normalizedSearch);
      }),
    [categoryFilter, documentFilter, normalizedSearch, templates],
  );

  const groups = useMemo(() => {
    const categories = categoryFilter
      ? CATEGORIES.filter((category) => category.name === categoryFilter)
      : CATEGORIES;

    return categories
      .map((category) => ({
        category,
        templates: filtered.filter((template) => template.category === category.name),
      }))
      .filter((group) => categoryFilter || group.templates.length > 0);
  }, [categoryFilter, filtered]);

  const hasActiveFilters = !!search || !!categoryFilter || documentFilter !== 'all';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchLabel="Search templates"
        searchPlaceholder="Search by title, category, owner, or keyword"
        resultLabel={loading ? 'Loading templates' : `${filtered.length} of ${templates.length} templates`}
        onClear={() => {
          setSearch('');
          setCategoryFilter('');
          setDocumentFilter('all');
        }}
        clearDisabled={!hasActiveFilters}
      >
        <label style={{ display: 'grid', gap: 5, minWidth: 190 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: theme.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
          >
            Category
          </span>
          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All categories"
            options={CATEGORIES.map((category) => ({ value: category.name, label: category.name }))}
          />
        </label>

        <div style={{ display: 'grid', gap: 5 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: theme.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
          >
            Document type
          </span>
          <SegmentedControl options={DOCUMENT_FILTER_OPTIONS} value={documentFilter} onChange={setDocumentFilter} />
        </div>
      </SearchFilterBar>

      {loading && <LibrarySkeleton />}
      {!loading && error && <LoadError message={error} onRetry={refetch} />}

      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title="No templates found"
          detail="Adjust the search, category, or document type filters to find matching RFI and RFQ templates."
        />
      )}

      {!loading &&
        !error &&
        groups.map((group) => (
          <section key={group.category.id} style={{ display: 'grid', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: group.category.color,
                    flexShrink: 0,
                  }}
                />
                <h2 style={{ margin: 0, fontSize: 14.5, color: theme.ink, fontWeight: 850, letterSpacing: 0 }}>
                  {group.category.name}
                </h2>
              </div>
              <span style={{ color: theme.textSecondary, fontSize: 11.5, fontFamily: theme.mono }}>
                {group.templates.length} template{group.templates.length === 1 ? '' : 's'}
              </span>
            </div>

            {group.templates.length === 0 ? (
              <EmptyState
                title="No templates in this category"
                detail="This category is ready for templates when the CoE adds source files to the library."
              />
            ) : (
              <div className="library-grid">
                {group.templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
