import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {SearchFilterKey} from '../types/search';

type FilterOption = {
  key: SearchFilterKey;
  label: string;
};

type FilterChipsProps = {
  options: FilterOption[];
  activeKey: SearchFilterKey;
  onSelect: (key: SearchFilterKey) => void;
};

function FilterChips({options, activeKey, onSelect}: FilterChipsProps) {
  return (
    <View style={styles.row}>
      {options.map(option => {
        const isActive = option.key === activeKey;
        return (
          <Pressable
            key={option.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(option.key)}>
            <Text style={[styles.text, isActive && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  text: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  textActive: {
    color: '#1D4ED8',
  },
});

export default FilterChips;
