import { Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { forwardRef, ReactNode, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  region: any;
  mapMode: 'standard' | 'satellite';
  userLocation?: { latitude: number; longitude: number } | null;
  userAvatarSource?: ImageSourcePropType;
  children?: ReactNode;
};

const WorldMap = forwardRef<MapView, Props>(function WorldMap(
  { region, mapMode, userLocation, userAvatarSource, children },
  ref
) {
  const useNativeUser = userLocation == null;
  const [userMarkerTracksView, setUserMarkerTracksView] = useState(true);

  useEffect(() => {
    if (!userLocation) return;
    setUserMarkerTracksView(true);
    const t = setTimeout(() => setUserMarkerTracksView(false), 600);
    return () => clearTimeout(t);
  }, [userLocation, userAvatarSource]);

  return (
    <MapView
      ref={ref}
      style={{ height: 220, margin: 12, borderRadius: 16 }}
      region={region}
      showsUserLocation={useNativeUser}
      showsMyLocationButton={useNativeUser}
      followsUserLocation={useNativeUser}
      mapType={mapMode}
    >
      {userLocation != null && (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={1000}
          tracksViewChanges={userMarkerTracksView}
        >
          <View style={styles.userMarkerWrap}>
            {userAvatarSource != null ? (
              <Image
                source={userAvatarSource}
                style={styles.userMarkerAvatar}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.userMarkerFallback}>📍</Text>
            )}
          </View>
        </Marker>
      )}
      {children}
    </MapView>
  );
});

export default WorldMap;

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
  userMarkerFallback: {
    fontSize: 26,
    lineHeight: 30,
  },
});
