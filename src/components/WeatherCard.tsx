import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {env} from '../config/env';
import type {WeatherSummary} from '../types/home';
import type {Coordinates} from '../types/location';

type WeatherCardProps = {
  loading: boolean;
  error: string | null;
  weather: WeatherSummary | null;
  location: Coordinates;
};

function WeatherCard({loading, error, weather}: WeatherCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weather</Text>
      {loading ? <Text style={styles.helper}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && weather ? (
        <Text style={styles.summary} numberOfLines={2}>
          {weather.condition}, {weather.temperatureC}°C
        </Text>
      ) : null}
      {!loading && !weather ? <Text style={styles.helper}>N/A</Text> : null}
      {!env.openWeatherApiKey ? (
        <Text style={styles.warning}>Set OPENWEATHER_API_KEY</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
    minHeight: 88,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  summary: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  helper: {
    fontSize: 12,
    color: '#475569',
  },
  warning: {
    fontSize: 10,
    color: '#B45309',
  },
  error: {
    fontSize: 11,
    color: '#B91C1C',
  },
});

export default WeatherCard;
