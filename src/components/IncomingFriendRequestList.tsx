import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import type {IncomingFriendRequest} from '../types/friend';

type IncomingFriendRequestListProps = {
  requests: IncomingFriendRequest[];
  emptyText?: string;
  acceptingFriendshipId?: string | null;
  onAccept?: (request: IncomingFriendRequest) => void;
};

function IncomingFriendRequestList({
  requests,
  emptyText = 'No incoming friend requests.',
  acceptingFriendshipId = null,
  onAccept,
}: IncomingFriendRequestListProps) {
  if (requests.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.list}>
      {requests.map(item => {
        const isAccepting = acceptingFriendshipId === item.friendshipId;
        return (
          <View key={item.friendshipId} style={styles.card}>
            <View style={styles.avatar} />
            <View style={styles.textWrap}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.hint}>Sent you a friend request</Text>
            </View>
            {onAccept ? (
              <Pressable
                style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
                onPress={() => onAccept(item)}
                disabled={isAccepting}>
                {isAccepting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.acceptText}>Accept</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  empty: {
    fontSize: 12,
    color: '#64748B',
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
    backgroundColor: '#FDE68A',
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
  hint: {
    fontSize: 12,
    color: '#64748B',
  },
  acceptButton: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default IncomingFriendRequestList;
