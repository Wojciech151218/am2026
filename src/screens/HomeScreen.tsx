import React, {useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import CompassWidget from '../components/CompassWidget';
import CurrentLocationPlaceCard from '../components/CurrentLocationPlaceCard';
import FriendsLocationsRecommendations from '../components/FriendsLocationsRecommendations';
import GoogleMapsPreviewCard from '../components/GoogleMapsPreviewCard';
import WeatherCard from '../components/WeatherCard';
import {useFriendsLocationsRecommendations} from '../hooks/db/useFriendsLocationsRecommendations';
import {useHomeMapData} from '../hooks/db/useHomeMapData';
import {useCompassApi} from '../hooks/useCompassApi';
import {useWeatherApi} from '../hooks/useWeatherApi';

function HomeScreen() {
  const [scrollBlocked, setScrollBlocked] = useState(false);
  const mapData = useHomeMapData();
  const center = mapData.data.center;
  const weatherApi = useWeatherApi(center);
  const compassApi = useCompassApi();
  const friendsLocations = useFriendsLocationsRecommendations(center);

  const onOverlayChange = (blocked: boolean) => {
    setScrollBlocked(blocked);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView scrollEnabled={!scrollBlocked} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Home</Text>

        <GoogleMapsPreviewCard
          loading={mapData.loading}
          error={mapData.error}
          markers={mapData.data.markers}
          initialCenter={center}
          initialZoom={mapData.data.zoom}
          onMapInteractionChange={interacting => onOverlayChange(interacting)}
          onExpandedChange={onOverlayChange}
        />

        <CurrentLocationPlaceCard
          coordinates={mapData.data.currentCoordinates}
          trackingEnabled={mapData.data.trackingEnabled}
          loading={mapData.loading}
        />

        <View style={styles.widgetsRow}>
          <WeatherCard
            loading={weatherApi.loading}
            error={weatherApi.error}
            weather={weatherApi.data}
            location={center}
          />
          <CompassWidget
            loading={compassApi.loading}
            error={compassApi.error}
            data={compassApi.data}
          />
        </View>

        <FriendsLocationsRecommendations
          loading={friendsLocations.loading}
          error={friendsLocations.error}
          items={friendsLocations.data.recommendations}
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
  widgetsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
});

export default HomeScreen;
