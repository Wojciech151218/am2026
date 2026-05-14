import React from 'react';
import {ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import GoogleMapsPreviewCard from '../components/GoogleMapsPreviewCard';
import OpenWeatherCard from '../components/OpenWeatherCard';
import PlaceholderCard from '../components/PlaceholderCard';
import {useCompassApi} from '../hooks/useCompassApi';
import {useMapsApi} from '../hooks/useMapsApi';
import {useRecommendationsApi} from '../hooks/useRecommendationsApi';
import {useWeatherApi} from '../hooks/useWeatherApi';

const defaultCoordinates = {latitude: 52.2297, longitude: 21.0122};

function HomeScreen() {
  const mapApi = useMapsApi(defaultCoordinates);
  const weatherApi = useWeatherApi(defaultCoordinates);
  const compassApi = useCompassApi();
  const recommendationsApi = useRecommendationsApi({location: defaultCoordinates});

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Home</Text>

        <GoogleMapsPreviewCard loading={mapApi.loading} error={mapApi.error} data={mapApi.data} />

        <OpenWeatherCard
          loading={weatherApi.loading}
          error={weatherApi.error}
          weather={weatherApi.data}
          location={defaultCoordinates}
        />

        <PlaceholderCard
          title="Compass Placeholder"
          description={
            compassApi.loading
              ? 'Loading compass...'
              : `Heading ${compassApi.data?.headingDegrees}° (${compassApi.data?.cardinalDirection})`
          }
        />

        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Recommendation Placeholder</Text>
          {recommendationsApi.loading ? (
            <Text style={styles.helperText}>Loading recommendations...</Text>
          ) : (
            recommendationsApi.data.map(item => (
              <View key={item.id} style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>{item.title}</Text>
                <Text style={styles.helperText}>{item.description}</Text>
              </View>
            ))
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
  recommendations: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendationCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#475569',
  },
});

export default HomeScreen;
