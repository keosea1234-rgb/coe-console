import { CATEGORY_BY_NAME } from './categories';
import type { ClientState, ConsoleSet } from './storeTypes';
import type { Filters } from './selectors';

function emptyFilters(): Filters {
  return {
    regions: [],
    fys: [],
    categories: [],
    subcategories: [],
    types: [],
  };
}

export function createClientStateSlice(set: ConsoleSet): ClientState {
  return {
    filters: emptyFilters(),

    setFilters: (patch) =>
      set((state) => ({ filters: { ...state.filters, ...patch } })),

    toggleFy: (fy) =>
      set((state) => {
        const has = state.filters.fys.includes(fy);
        return {
          filters: {
            ...state.filters,
            fys: has ? state.filters.fys.filter((x) => x !== fy) : [...state.filters.fys, fy],
          },
        };
      }),

    toggleCategory: (category) =>
      set((state) => {
        const has = state.filters.categories.includes(category);
        const categories = has
          ? state.filters.categories.filter((x) => x !== category)
          : [...state.filters.categories, category];
        const allowedSubs = new Set(
          categories.flatMap((cat) => CATEGORY_BY_NAME[cat]?.subcategories ?? []),
        );
        return {
          filters: {
            ...state.filters,
            categories,
            subcategories: categories.length
              ? state.filters.subcategories.filter((sub) => allowedSubs.has(sub))
              : [],
          },
        };
      }),

    toggleSubcategory: (subcategory) =>
      set((state) => {
        const has = state.filters.subcategories.includes(subcategory);
        return {
          filters: {
            ...state.filters,
            subcategories: has
              ? state.filters.subcategories.filter((x) => x !== subcategory)
              : [...state.filters.subcategories, subcategory],
          },
        };
      }),

    toggleRegion: (region) =>
      set((state) => {
        const has = state.filters.regions.includes(region);
        return {
          filters: {
            ...state.filters,
            regions: has
              ? state.filters.regions.filter((x) => x !== region)
              : [...state.filters.regions, region],
          },
        };
      }),

    toggleType: (type) =>
      set((state) => {
        const has = state.filters.types.includes(type);
        return {
          filters: {
            ...state.filters,
            types: has ? state.filters.types.filter((x) => x !== type) : [...state.filters.types, type],
          },
        };
      }),

    clearFilters: () => set({ filters: emptyFilters() }),
  };
}
