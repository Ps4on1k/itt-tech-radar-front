import { create } from 'zustand';
import type { TechRadarEntity } from '../types';
import type { FilterState, SortState } from '../types';

interface TechRadarState {
  // Data
  technologies: TechRadarEntity[];
  statistics: {
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    bySubtype: Record<string, number>;
  } | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Filters
  filters: FilterState;
  sort: SortState;

  // Actions
  setTechnologies: (technologies: TechRadarEntity[]) => void;
  addTechnology: (technology: TechRadarEntity) => void;
  updateTechnology: (id: string, technology: Partial<TechRadarEntity>) => void;
  deleteTechnology: (id: string) => void;
  setStatistics: (stats: TechRadarState['statistics']) => void;

  // Loading actions
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;

  // Filter actions
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setSort: (sort: Partial<SortState>) => void;

  // Refresh
  refresh: () => Promise<void>;
}

export const useTechRadarStore = create<TechRadarState>()((set) => ({
  technologies: [],
  statistics: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  filters: {},
  sort: { sortOrder: 'asc' },

  setTechnologies: (technologies) => set({ technologies }),
  addTechnology: (technology) =>
    set((state) => ({ technologies: [...state.technologies, technology] })),
  updateTechnology: (id, update) =>
    set((state) => ({
      technologies: state.technologies.map((tech) =>
        tech.id === id ? { ...tech, ...update } : tech
      ),
    })),
  deleteTechnology: (id) =>
    set((state) => ({
      technologies: state.technologies.filter((tech) => tech.id !== id),
    })),
  setStatistics: (statistics) => set({ statistics }),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  setSort: (sort) => set((state) => ({ sort: { ...state.sort, ...sort } })),

  refresh: async () => {
    // This will be called from components with actual API calls
    set({ isRefreshing: true });
    // API call would go here
    set({ isRefreshing: false });
  },
}));

// Helper function to get current state without hooks
export const getTechRadarState = () => useTechRadarStore.getState();
