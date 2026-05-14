import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import type {Friend} from '../types/friend';

type FriendListProps = {
  friends: Friend[];
};

function FriendList({friends}: FriendListProps) {
  return (
    <FlatList
      data={friends}
      keyExtractor={item => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      renderItem={({item}) => (
        <View style={styles.card}>
          <View style={styles.avatar} />
          <View style={styles.textWrap}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={[styles.status, item.isOnline ? styles.online : styles.offline]}>
              {item.isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.location}>
              {item.sharedLocation ? item.sharedLocation.label : 'Location not shared'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#BFDBFE',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  online: {
    color: '#15803D',
  },
  offline: {
    color: '#64748B',
  },
  location: {
    fontSize: 12,
    color: '#334155',
  },
});

export default FriendList;
