import {useState} from 'react';
import type {Dispatch, SetStateAction} from 'react';
import type {SearchFilterKey, SearchFilters} from '../types/search';

type UseSearchFiltersResult = {
  filters: SearchFilters;
  activeFilterKey: SearchFilterKey;
  setActiveFilterKey: (key: SearchFilterKey) => void;
  setFilters: Dispatch<SetStateAction<SearchFilters>>;
};

const initialFilters: SearchFilters = {
  type: 'all',
  distanceKm: 20,
  minRating: 3,
};

export function useSearchFilters(): UseSearchFiltersResult {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [activeFilterKey, setActiveFilterKey] = useState<SearchFilterKey>('type');

  return {filters, activeFilterKey, setActiveFilterKey, setFilters};
}
