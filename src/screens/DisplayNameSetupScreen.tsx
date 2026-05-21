import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import ProfileFieldsForm from '../components/ProfileFieldsForm';
import {useCreateCurrentUserProfile} from '../hooks/mutations/useCreateCurrentUserProfile';
import {useFirebaseAuth} from '../hooks/useFirebaseAuth';

type DisplayNameSetupScreenProps = {
  onComplete: () => Promise<void>;
};

function DisplayNameSetupScreen({onComplete}: DisplayNameSetupScreenProps) {
  const auth = useFirebaseAuth();
  const createProfile = useCreateCurrentUserProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [homeCity, setHomeCity] = useState('');

  const onSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      return;
    }
    const success = await createProfile.createProfile({
      email: auth.user?.email ?? null,
      displayName: trimmedName,
      bio: bio.trim(),
      homeCity: homeCity.trim(),
    });
    if (success) {
      await onComplete();
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Choose your name</Text>
        <Text style={styles.intro}>
          Set a display name to continue. You will not be able to change it later in the app.
        </Text>
        <ProfileFieldsForm
          title="Your profile"
          values={{displayName, bio, homeCity}}
          onChangeDisplayName={setDisplayName}
          onChangeBio={setBio}
          onChangeHomeCity={setHomeCity}
          showActions
          onSave={onSave}
          saving={createProfile.loading}
          saveLabel="Continue"
          error={createProfile.error}
        />
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
  intro: {
    fontSize: 13,
    color: '#475569',
  },
});

export default DisplayNameSetupScreen;
