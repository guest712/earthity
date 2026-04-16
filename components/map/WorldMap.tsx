import { Image, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  region: any;
  mapMode: 'standard' | 'satellite';
  userLocation?: { latitude: number; longitude: number } | null;
  userAvatarSource?: ImageSourcePropType;
  children?: ReactNode;
};

export default function WorldMap({ region, mapMode, userLocation, userAvatarSource, children }: Props) {
  return (
    <MapView
      style={{ height: 220, margin: 12, borderRadius: 16 }}
      region={region}
      showsUserLocation={false}
      showsMyLocationButton
      followsUserLocation
      mapType={mapMode}
    >
      {userLocation && userAvatarSource && (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.userMarkerWrap}>
            <Image source={userAvatarSource} style={styles.userMarkerAvatar} />
          </View>
        </Marker>
      )}
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  userMarkerWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#5aad6a',
    backgroundColor: '#0f1a0f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
  },
  userMarkerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});


