import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppLoadingView from './src/components/AppLoadingView';
import FirebaseAuthCard from './src/components/FirebaseAuthCard';
import {ToastProvider} from './src/components/Toast';
import {DbProvider, useDb} from './src/hooks/db/useDb';
import {useFirebaseAuth} from './src/hooks/useFirebaseAuth';
import AppTabs from './src/navigation';

function AuthenticatedApp() {
  const db = useDb();

  if (!db.ready) {
    return (
      <AppLoadingView
        title="Getting things ready"
        subtitle="Setting up your local data and cloud sync..."
      />
    );
  }

  return (
    <>
      {db.syncError ? (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>
            Cloud sync is limited: {db.syncError}. You can keep using the app offline.
          </Text>
        </View>
      ) : null}
      <AppTabs />
    </>
  );
}

function App() {
  const auth = useFirebaseAuth();

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <View style={styles.root}>
          {auth.loading ? (
            <AppLoadingView title="Signing you in" subtitle="Checking your account..." />
          ) : auth.user ? (
            <DbProvider user={auth.user}>
              <AuthenticatedApp />
            </DbProvider>
          ) : (
            <View style={styles.authScreen}>
              <Text style={styles.title}>Sign in to continue</Text>
              <FirebaseAuthCard auth={auth} showSignOutWhenAuthenticated={false} />
            </View>
          )}
        </View>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F8FA',
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
  syncBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncBannerText: {
    fontSize: 12,
    color: '#92400E',
  },
});

export default App;
