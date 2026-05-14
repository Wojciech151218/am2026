import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import FirebaseAuthCard from './src/components/FirebaseAuthCard';
import {useFirebaseAuth} from './src/hooks/useFirebaseAuth';
import AppTabs from './src/navigation';

function App() {
  const auth = useFirebaseAuth();

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {auth.loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.helper}>Checking account...</Text>
          </View>
        ) : auth.user ? (
          <AppTabs />
        ) : (
          <View style={styles.authScreen}>
            <Text style={styles.title}>Sign in to continue</Text>
            <FirebaseAuthCard auth={auth} showSignOutWhenAuthenticated={false} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  authScreen: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  helper: {
    fontSize: 13,
    color: '#475569',
  },
});

export default App;
