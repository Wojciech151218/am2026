import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

type AppLoadingViewProps = {
  title: string;
  subtitle?: string;
};

function AppLoadingView({title, subtitle}: AppLoadingViewProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#F7F8FA',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default AppLoadingView;
