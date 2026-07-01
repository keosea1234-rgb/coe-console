import { useCallback, useEffect, useState } from 'react';
import { LEARNING_SEED } from '../data/learningSeed';
import { TEMPLATE_SEED } from '../data/templateSeed';
import type { CategoryTemplate, LearningResource } from './templateTypes';

interface ResourceState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

async function fetchTemplates(): Promise<CategoryTemplate[]> {
  // Phase 2: swap seed data source for Supabase table `templates` when backend is enabled.
  return TEMPLATE_SEED;
}

async function fetchLearningResources(): Promise<LearningResource[]> {
  // Phase 2: swap seed data source for Supabase table `learning_resources` when backend is enabled.
  return LEARNING_SEED;
}

function useSeedResource<T>(load: () => Promise<T[]>, label: string): ResourceState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void load()
        .then((items) => {
          if (!cancelled) setData(items);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setData([]);
            setError(err instanceof Error ? err.message : `Unable to load ${label}.`);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [label, load, version]);

  return { data, loading, error, refetch };
}

export function useTemplates(): ResourceState<CategoryTemplate> {
  return useSeedResource(fetchTemplates, 'templates');
}

export function useLearningResources(): ResourceState<LearningResource> {
  return useSeedResource(fetchLearningResources, 'learning resources');
}
