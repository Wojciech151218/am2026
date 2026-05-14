import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import FriendList from '../components/FriendList';
import SearchBar from '../components/SearchBar';
import SearchResultList from '../components/SearchResultList';
import {useFriendSearchApi} from '../hooks/useFriendSearchApi';
import {useFriendsApi} from '../hooks/useFriendsApi';
import {useSearchFilters} from '../hooks/useSearchFilters';
import type {FriendSearchResult} from '../types/friend';

function SocialScreen() {
  const [query, setQuery] = useState('');
  const friendSearchApi = useFriendSearchApi();
  const friendsApi = useFriendsApi();
  const {filters} = useSearchFilters();

  const onSubmitFriendSearch = async () => {
    await friendSearchApi.executeSearch(query, filters);
  };

  const onAddFriend = (friend: FriendSearchResult) => {
    Alert.alert('Friend request sent', `A request was sent to ${friend.title}.`);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Social</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search friends</Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={onSubmitFriendSearch}
            placeholder="Search friends"
          />
          {friendSearchApi.loading ? <Text style={styles.status}>Searching people...</Text> : null}
          <SearchResultList
            results={friendSearchApi.results}
            actionLabel="Add Friend"
            onPressAction={onAddFriend}
            emptyText="Search by name to discover friends."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends list</Text>
          {friendsApi.loading ? (
            <Text style={styles.status}>Loading friends...</Text>
          ) : (
            <FriendList friends={friendsApi.friends} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
  },
});

export default SocialScreen;
