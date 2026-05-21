import React, {useMemo, useState} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import FilterChips from '../components/FilterChips';
import SearchBar from '../components/SearchBar';
import SearchResultList from '../components/SearchResultList';
import {googleMapsUrl} from '../api/googleGeocoding';
import {useFriendLocationsSearchQuery} from '../hooks/db/useFriendLocationsSearchQuery';
import {useSearchFilters} from '../hooks/useSearchFilters';
import type {FriendLocationSearchResult, SearchFilterKey} from '../types/search';

const filterOptions: Array<{key: SearchFilterKey; label: string}> = [
  {key: 'type', label: 'Friend'},
  {key: 'distance', label: 'Distance'},
  {key: 'rating', label: 'Rating'},
];

function SearchScreen() {
  const [query, setQuery] = useState('');
  const {filters, activeFilterKey, setActiveFilterKey, setFilters} = useSearchFilters();
  const searchApi = useFriendLocationsSearchQuery();

  const activeFilterDescription = useMemo(() => {
    if (activeFilterKey === 'type') {
      return 'Friend locations and nearby Google Maps places';
    }
    if (activeFilterKey === 'distance') {
      return `Max distance: ${filters.distanceKm} km`;
    }
    return `Min rating: ${filters.minRating}★`;
  }, [activeFilterKey, filters.distanceKm, filters.minRating]);

  const onSelectFilter = (key: SearchFilterKey) => {
    setActiveFilterKey(key);
    setFilters(previous => {
      if (key === 'type') {
        return previous;
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

  const onOpenResult = (item: FriendLocationSearchResult) => {
    if (item.placeCoordinates) {
      Linking.openURL(googleMapsUrl(item.placeCoordinates)).catch(() => null);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>Search</Text>
        <Text style={styles.subheading}>Friend visits and nearby places</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={onSubmitSearch}
          placeholder="Friend name, place, city, or POI"
        />
        <FilterChips options={filterOptions} activeKey={activeFilterKey} onSelect={onSelectFilter} />
        <Text style={styles.filterInfo}>{activeFilterDescription}</Text>
        {searchApi.loading ? <Text style={styles.status}>Searching...</Text> : null}
        {searchApi.error ? <Text style={styles.error}>{searchApi.error}</Text> : null}
        <View style={styles.results}>
          <SearchResultList
            results={searchApi.results}
            onPressItem={onOpenResult}
            emptyText="Search friends' saved locations and nearby Google Maps places."
          />
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
  subheading: {
    fontSize: 13,
    color: '#475569',
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
