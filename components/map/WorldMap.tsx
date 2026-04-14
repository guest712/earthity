import MapView from 'react-native-maps';
import { ReactNode } from 'react';

type Props = {
  region: any;
  mapMode: 'standard' | 'satellite';
  children?: ReactNode;
};

export default function WorldMap({ region, mapMode, children }: Props) {
  return (
    <MapView
      style={{ height: 220, margin: 12, borderRadius: 16 }}
      region={region}
      showsUserLocation
      showsMyLocationButton
      followsUserLocation
      mapType={mapMode}
    >
      {children}
    </MapView>
  );
}


