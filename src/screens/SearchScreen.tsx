import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import FilterChips from '../components/FilterChips';
import SearchBar from '../components/SearchBar';
import SearchResultList from '../components/SearchResultList';
import {useSearchApi} from '../hooks/useSearchApi';
import {useSearchFilters} from '../hooks/useSearchFilters';
import type {SearchFilterKey} from '../types/search';

const filterOptions: Array<{key: SearchFilterKey; label: string}> = [
  {key: 'type', label: 'Type'},
  {key: 'distance', label: 'Distance'},
  {key: 'rating', label: 'Rating'},
];

function SearchScreen() {
  const [query, setQuery] = useState('');
  const {filters, activeFilterKey, setActiveFilterKey, setFilters} = useSearchFilters();
  const searchApi = useSearchApi();

  const activeFilterDescription = useMemo(() => {
    if (activeFilterKey === 'type') {
      return `Type: ${filters.type}`;
    }
    if (activeFilterKey === 'distance') {
      return `Distance: ${filters.distanceKm}km`;
    }
    return `Min rating: ${filters.minRating}`;
  }, [activeFilterKey, filters.distanceKm, filters.minRating, filters.type]);

  const onSelectFilter = (key: SearchFilterKey) => {
    setActiveFilterKey(key);
    setFilters(previous => {
      if (key === 'type') {
        const nextType = previous.type === 'all' ? 'places' : previous.type === 'places' ? 'events' : 'all';
        return {...previous, type: nextType};
      }
      if (key === 'distance') {
        const nextDistance = previous.distanceKm >= 30 ? 10 : previous.distanceKm + 10;
        return {...previous, distanceKm: nextDistance};
      }
      const nextRating = previous.minRating >= 5 ? 1 : previous.minRating + 1;
      return {...previous, minRating: nextRating};
    });
  };

  const onSubmitSearch = async () => {
    await searchApi.executeSearch(query, filters);
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>Search</Text>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={onSubmitSearch} placeholder="Search places or events" />
        <FilterChips options={filterOptions} activeKey={activeFilterKey} onSelect={onSelectFilter} />
        <Text style={styles.filterInfo}>{activeFilterDescription}</Text>
        {searchApi.loading ? <Text style={styles.status}>Searching...</Text> : null}
        {searchApi.error ? <Text style={styles.error}>{searchApi.error}</Text> : null}
        <View style={styles.results}>
          <SearchResultList results={searchApi.results} emptyText="Use search + filters to see results." />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 10,
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterInfo: {
    fontSize: 12,
    color: '#334155',
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#B91C1C',
  },
  results: {
    flex: 1,
    minHeight: 120,
  },
});

export default SearchScreen;
