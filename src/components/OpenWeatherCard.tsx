import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {env} from '../config/env';
import type {WeatherSummary} from '../types/home';
import type {Coordinates} from '../types/location';

type OpenWeatherCardProps = {
  loading: boolean;
  error: string | null;
  weather: WeatherSummary | null;
  location: Coordinates;
};

function OpenWeatherCard({loading, error, weather}: OpenWeatherCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>OpenWeather</Text>
      {loading ? <Text style={styles.helper}>Loading weather...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && weather ? (
        <Text style={styles.helper}>
          {weather.condition}, {weather.temperatureC}C, humidity {weather.humidityPercent}%
        </Text>
      ) : null}
      {!loading && !weather ? <Text style={styles.helper}>Weather data not available yet.</Text> : null}
      {!env.openWeatherApiKey ? (
        <Text style={styles.warning}>Add OPENWEATHER_API_KEY to .env for API requests.</Text>
      ) : null}
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
    gap: 8,
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
  warning: {
    fontSize: 12,
    color: '#B45309',
  },
  error: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default OpenWeatherCard;
