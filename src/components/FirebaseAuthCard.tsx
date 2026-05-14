import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import type {UseFirebaseAuthResult} from '../hooks/useFirebaseAuth';

type FirebaseAuthCardProps = {
  auth: UseFirebaseAuthResult;
  showSignOutWhenAuthenticated?: boolean;
};

function FirebaseAuthCard({auth, showSignOutWhenAuthenticated = true}: FirebaseAuthCardProps) {
  const {user, loading, actionLoading, error, signIn, signInGuest, signOutCurrentUser, signUp} =
    auth;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const canSubmit = email.trim().length > 0 && password.length > 5;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Firebase Login</Text>
      {loading ? (
        <Text style={styles.helper}>Checking session...</Text>
      ) : user ? (
        <View style={styles.userBlock}>
          <Text style={styles.value}>Signed in as {user.email ?? 'Guest'}</Text>
          {showSignOutWhenAuthenticated ? (
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => signOutCurrentUser().catch(() => null)}>
              <Text style={styles.secondaryButtonLabel}>
                {actionLoading === 'signOut' ? 'Signing out...' : 'Sign out'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password (min. 6 chars)"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, !canSubmit && styles.disabledButton]}
              disabled={!canSubmit}
              onPress={() => signIn(email, password).catch(() => null)}>
              <Text style={styles.buttonLabel}>{actionLoading === 'signIn' ? 'Signing in...' : 'Sign in'}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondaryButton, !canSubmit && styles.disabledButton]}
              disabled={!canSubmit}
              onPress={() => signUp(email, password).catch(() => null)}>
              <Text style={styles.secondaryButtonLabel}>
                {actionLoading === 'signUp' ? 'Creating...' : 'Create account'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.ghostButton]}
              onPress={() => signInGuest().catch(() => null)}>
              <Text style={styles.ghostButtonLabel}>
                {actionLoading === 'guest' ? 'Loading...' : 'Continue as guest'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  helper: {
    fontSize: 13,
    color: '#475569',
  },
  userBlock: {
    gap: 8,
  },
  form: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  actions: {
    gap: 8,
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
  },
  ghostButton: {
    backgroundColor: '#EFF6FF',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButtonLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  ghostButtonLabel: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  value: {
    fontSize: 13,
    color: '#334155',
  },
  error: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default FirebaseAuthCard;
