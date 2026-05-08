import React, { useEffect, useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { Marker } from 'react-native-maps';

const MARKER_IMAGE_SIZE = 40;

/** Bitmap `image` on Marker uses full asset pixels — too large. Fixed-size child view + short tracksViewChanges. */
export default function CreatureMapMarker(props: {
  coordinate: { latitude: number; longitude: number };
  image: ImageSourcePropType;
  onPress: () => void;
}) {
  const { coordinate, image, onPress } = props;
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={image}
          style={{ width: MARKER_IMAGE_SIZE, height: MARKER_IMAGE_SIZE }}
          resizeMode="contain"
        />
      </View>
    </Marker>
  );
}
