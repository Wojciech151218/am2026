import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import BlurContainer from '../components/BlurContainer';
import {useToast} from '../components/Toast';
import FriendList from '../components/FriendList';
import IncomingFriendRequestList from '../components/IncomingFriendRequestList';
import SearchBar from '../components/SearchBar';
import SearchResultList from '../components/SearchResultList';
import {useFriendSearchQuery} from '../hooks/db/useFriendSearchQuery';
import {useFriendsQuery} from '../hooks/db/useFriendsQuery';
import {useIncomingFriendRequestsQuery} from '../hooks/db/useIncomingFriendRequestsQuery';
import {useAcceptFriendRequest} from '../hooks/mutations/useAcceptFriendRequest';
import {useAddFriend} from '../hooks/mutations/useAddFriend';
import {useSearchFilters} from '../hooks/useSearchFilters';
import FriendProfilePreview from '../components/FriendProfilePreview';
import type {Friend, FriendSearchResult, IncomingFriendRequest} from '../types/friend';

function SocialScreen() {
  const [query, setQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const friendSearchApi = useFriendSearchQuery();
  const friendsApi = useFriendsQuery();
  const incomingRequestsApi = useIncomingFriendRequestsQuery();
  const addFriendMutation = useAddFriend();
  const acceptFriendMutation = useAcceptFriendRequest();
  const {filters} = useSearchFilters();
  const {showToast} = useToast();

  const onSubmitFriendSearch = async () => {
    await friendSearchApi.executeSearch(query, filters);
  };

  const onAddFriend = async (friend: FriendSearchResult) => {
    const success = await addFriendMutation.addFriend(friend.id);
    if (!success) {
      showToast('Unable to add friend', {
        body: addFriendMutation.error ?? 'Try again later.',
        variant: 'error',
      });
      return;
    }
    showToast('Friend request sent', {body: `A request was sent to ${friend.title}.`, variant: 'success'});
    await Promise.all([friendsApi.refetch(), incomingRequestsApi.refetch()]);
  };

  const onAcceptFriendRequest = async (request: IncomingFriendRequest) => {
    const success = await acceptFriendMutation.acceptFriendRequest(request.friendshipId);
    if (!success) {
      showToast('Unable to accept request', {
        body: acceptFriendMutation.error ?? 'Try again later.',
        variant: 'error',
      });
      return;
    }
    showToast('Friend added', {body: `${request.name} is now in your friends list.`, variant: 'success'});
    await Promise.all([friendsApi.refetch(), incomingRequestsApi.refetch()]);
  };

  const onSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Social</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search people</Text>
          <Text style={styles.helper}>
            Find travelers by name, sorted by proximity to your current location.
          </Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={onSubmitFriendSearch}
            placeholder="Search by name"
          />
          {friendSearchApi.loading ? <Text style={styles.status}>Searching people...</Text> : null}
          {friendSearchApi.error ? <Text style={styles.status}>{friendSearchApi.error}</Text> : null}
          {addFriendMutation.loading ? <Text style={styles.status}>Sending request...</Text> : null}
          <SearchResultList
            nested
            results={friendSearchApi.results}
            actionLabel="Add Friend"
            onPressAction={onAddFriend}
            emptyText="Search by name to discover friends."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming requests</Text>
          <Text style={styles.helper}>Pending friend requests sent to you.</Text>
          {incomingRequestsApi.loading ? (
            <Text style={styles.status}>Loading requests...</Text>
          ) : incomingRequestsApi.error ? (
            <Text style={styles.status}>{incomingRequestsApi.error}</Text>
          ) : (
            <IncomingFriendRequestList
              requests={incomingRequestsApi.requests}
              acceptingFriendshipId={acceptFriendMutation.acceptingFriendshipId}
              onAccept={onAcceptFriendRequest}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <Text style={styles.helper}>Tap a friend to preview their profile.</Text>
          {friendsApi.loading ? (
            <Text style={styles.status}>Loading friends...</Text>
          ) : friendsApi.error ? (
            <Text style={styles.status}>{friendsApi.error}</Text>
          ) : (
            <FriendList
              friends={friendsApi.friends}
              selectedFriendId={selectedFriend?.id}
              onSelectFriend={onSelectFriend}
            />
          )}
        </View>
      </ScrollView>

      <BlurContainer
        visible={selectedFriend != null}
        onClose={() => setSelectedFriend(null)}
        expandedFraction={0.85}>
        {selectedFriend ? (
          <FriendProfilePreview
            friend={selectedFriend}
            onUnfriended={() => {
              setSelectedFriend(null);
              friendsApi.refetch().catch(() => null);
            }}
          />
        ) : null}
      </BlurContainer>
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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  helper: {
    fontSize: 12,
    color: '#64748B',
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
  },
});

export default SocialScreen;
