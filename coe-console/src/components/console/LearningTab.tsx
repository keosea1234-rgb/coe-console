import { useMemo, useState } from 'react';
import { useLearningResources } from '../../domain/templateLibrary';
import {
  LEARNING_RESOURCE_TYPES,
  LEARNING_TOPICS,
  type LearningResource,
  type LearningResourceType,
} from '../../domain/templateTypes';
import { theme } from '../../styles/theme';
import { SegmentedControl } from '../common/primitives';
import { LearningResourceCard } from './LearningResourceCard';
import { EmptyState, LibrarySkeleton, LoadError } from './LibraryStates';
import { SearchFilterBar } from './SearchFilterBar';

type ResourceTypeFilter = 'all' | LearningResourceType;

const RESOURCE_FILTER_OPTIONS: { value: ResourceTypeFilter; label: string }[] = [
  { value: 'all', label: 'All resources' },
  ...LEARNING_RESOURCE_TYPES.map((type) => ({
    value: type,
    label: type === 'quickref' ? 'Quick refs' : `${type.charAt(0).toUpperCase()}${type.slice(1)}s`,
  })),
];

function matchesLearningSearch(resource: LearningResource, query: string): boolean {
  if (!query) return true;
  const haystack = [
    resource.title,
    resource.description,
    resource.topic,
    resource.type,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function LearningTab() {
  const { data: resources, loading, error, refetch } = useLearningResources();
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState<ResourceTypeFilter>('all');

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      resources.filter((resource) => {
        if (resourceType !== 'all' && resource.type !== resourceType) return false;
        return matchesLearningSearch(resource, normalizedSearch);
      }),
    [normalizedSearch, resourceType, resources],
  );

  const groups = useMemo(
    () =>
      LEARNING_TOPICS.map((topic) => ({
        topic,
        resources: filtered.filter((resource) => resource.topic === topic),
      })).filter((group) => group.resources.length > 0),
    [filtered],
  );

  const hasActiveFilters = !!search || resourceType !== 'all';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchLabel="Search learning"
        searchPlaceholder="Search by topic, workflow, or keyword"
        resultLabel={loading ? 'Loading resources' : `${filtered.length} of ${resources.length} resources`}
        onClear={() => {
          setSearch('');
          setResourceType('all');
        }}
        clearDisabled={!hasActiveFilters}
      >
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
            Resource type
          </span>
          <SegmentedControl options={RESOURCE_FILTER_OPTIONS} value={resourceType} onChange={setResourceType} />
        </div>
      </SearchFilterBar>

      {loading && <LibrarySkeleton count={4} />}
      {!loading && error && <LoadError message={error} onRetry={refetch} />}

      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title="No learning resources found"
          detail="Adjust the search or resource type filter to find matching eSourcing learning material."
        />
      )}

      {!loading &&
        !error &&
        groups.map((group) => (
          <section key={group.topic} style={{ display: 'grid', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 14.5, color: theme.ink, fontWeight: 850, letterSpacing: 0 }}>
                {group.topic}
              </h2>
              <span style={{ color: theme.textSecondary, fontSize: 11.5, fontFamily: theme.mono }}>
                {group.resources.length} resource{group.resources.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="library-grid">
              {group.resources.map((resource) => (
                <LearningResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
