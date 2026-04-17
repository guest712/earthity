import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export type MapUserAvatarSkiaProps = {
  uri: string;
  canvasDp: number;
  faceDiameterDp: number;
  ringStrokeDp: number;
};

/** Web: Skia not loaded; same layout with RN views */
export function MapUserAvatarSkia({
  uri,
  canvasDp,
  faceDiameterDp,
  ringStrokeDp,
}: MapUserAvatarSkiaProps) {
  const ringOuter = faceDiameterDp + ringStrokeDp * 2;

  return (
    <View style={[styles.outer, { width: canvasDp, height: canvasDp }]}>
      <View style={[styles.ringBox, { width: ringOuter, height: ringOuter }]}>
        <View
          style={[
            styles.face,
            {
              width: faceDiameterDp,
              height: faceDiameterDp,
              borderRadius: faceDiameterDp / 2,
            },
          ]}
        >
          <ExpoImage
            source={{ uri }}
            style={{ width: faceDiameterDp, height: faceDiameterDp }}
            contentFit="cover"
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: ringOuter,
              height: ringOuter,
              borderRadius: ringOuter / 2,
              borderWidth: ringStrokeDp,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ringBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    overflow: 'hidden',
    backgroundColor: '#1a2e1f',
  },
  ring: {
    position: 'absolute',
    borderColor: '#5aad6a',
    backgroundColor: 'transparent',
  },
});
