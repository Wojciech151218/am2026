import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import LocationPressableCard from './LocationPressableCard';
import type {SearchResult} from '../types/search';

type SearchResultListProps<T extends SearchResult> = {
  results: T[];
  actionLabel?: string;
  onPressAction?: (item: T) => void;
  onPressItem?: (item: T) => void;
  emptyText?: string;
  /** Use inside a parent ScrollView to avoid nested VirtualizedList warnings. */
  nested?: boolean;
};

function SearchResultList<T extends SearchResult>({
  results,
  actionLabel,
  onPressAction,
  onPressItem,
  emptyText,
  nested = false,
}: SearchResultListProps<T>) {
  const renderItem = (item: T) => (
    <LocationPressableCard
      key={item.id}
      title={item.title}
      subtitle={item.subtitle}
      tags={item.tags}
      highlighted={(item as {isFriendResult?: boolean}).isFriendResult ?? false}
      onPress={onPressItem ? () => onPressItem(item) : undefined}
      actionLabel={actionLabel}
      onPressAction={onPressAction ? () => onPressAction(item) : undefined}
    />
  );

  if (nested) {
    if (results.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>{emptyText ?? 'No results yet.'}</Text>
        </View>
      );
    }
    return <View style={styles.list}>{results.map(renderItem)}</View>;
  }

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      ListEmptyComponent={<Text style={styles.empty}>{emptyText ?? 'No results yet.'}</Text>}
      contentContainerStyle={results.length === 0 ? styles.emptyWrap : styles.list}
      renderItem={({item}) => renderItem(item)}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  emptyWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  empty: {
    color: '#64748B',
    fontSize: 14,
  },
});

export default SearchResultList;
