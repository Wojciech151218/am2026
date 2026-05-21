import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
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
    <Pressable
      key={item.id}
      style={styles.card}
      onPress={() => onPressItem?.(item)}
      disabled={!onPressItem}>
      <View style={styles.main}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.tags}>{item.tags.join(' • ')}</Text>
      </View>
      {actionLabel && onPressAction ? (
        <Pressable style={styles.actionButton} onPress={() => onPressAction(item)}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
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
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#334155',
  },
  tags: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButton: {
    borderRadius: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SearchResultList;
