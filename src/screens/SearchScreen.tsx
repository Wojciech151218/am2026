import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import SearchBar from '../components/SearchBar';
import SearchResultList from '../components/SearchResultList';
import {googleMapsUrl} from '../api/googleGeocoding';
import {useFriendLocationsSearchQuery} from '../hooks/db/useFriendLocationsSearchQuery';
import type {FriendLocationSearchResult} from '../types/search';

function SearchScreen() {
  const [query, setQuery] = useState('');
  const searchApi = useFriendLocationsSearchQuery();
  const {executeSearch} = searchApi;

  const onSubmitSearch = async () => {
    await executeSearch(query);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      executeSearch(query).catch(() => null);
    }, 250);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, executeSearch]);

  const onOpenResult = (item: FriendLocationSearchResult) => {
    if (item.placeCoordinates) {
      Linking.openURL(googleMapsUrl(item.placeCoordinates)).catch(() => null);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>Search</Text>
        <Text style={styles.subheading}>Latest friend places and nearby Google Maps results</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={onSubmitSearch}
          placeholder="Friend name, place, city, or POI"
        />
        {searchApi.loading ? <Text style={styles.status}>Searching...</Text> : null}
        {searchApi.error ? <Text style={styles.error}>{searchApi.error}</Text> : null}
        <View style={styles.results}>
          <SearchResultList
            results={searchApi.results}
            onPressItem={onOpenResult}
            emptyText="Type to find friend places and nearby Google Maps places."
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
