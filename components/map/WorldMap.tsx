import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image, PixelRatio, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { forwardRef, ReactNode, useEffect, useMemo, useState } from 'react';
import type { ImageRequireSource, ImageURISource } from 'react-native';

import { MapUserAvatarSkia } from './MapUserAvatarSkia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Custom Marker children on Android are rasterized to a bitmap. Pulse uses its own Marker.
 * Avatar uses a padded root view (bleed) so borders / scaled pulse are not clipped.
 * Avatar: `MapUserAvatarSkia` (Skia on native, RN fallback on web).
 */
type Props = {
  region: any;
  mapMode: 'standard' | 'satellite';
  userLocation?: { latitude: number; longitude: number } | null;
  userAvatarSource?: ImageRequireSource | ImageURISource;
  userAvatarId?: string;
  children?: ReactNode;
};

/** Extra padding around the drawn marker so the map snapshot does not crop the ring (Android) */
const AVATAR_MARKER_BLEED_DP = 12;
/** Diameter of the circular face (dp) */
const AVATAR_DIAMETER_DP = 40;
/** Ring stroke (dp); drawn in RN inside a square of size diameter + 2×stroke */
const AVATAR_RING_BORDER_DP = 3;
const RING_OUTER_DP = AVATAR_DIAMETER_DP + AVATAR_RING_BORDER_DP * 2;

type NormalizedAvatar = {
  uri: string;
};

function getSizeFromUri(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });
}

async function getIntrinsicPixelSize(
  source: ImageRequireSource | ImageURISource
): Promise<{ width: number; height: number }> {
  if (typeof source === 'number') {
    const r = Image.resolveAssetSource(source);
    if (r.width > 0 && r.height > 0) {
      return { width: r.width, height: r.height };
    }
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    const u = asset.localUri ?? asset.uri;
    if (!u) throw new Error('Asset has no uri');
    return getSizeFromUri(u);
  }
  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return getSizeFromUri(source.uri);
  }
  throw new Error('Unsupported image source');
}

/** Fit inside maxSide×maxSide px without upscaling; preserve aspect ratio */
function fitInsideBox(iw: number, ih: number, maxSide: number): { width: number; height: number } {
  if (iw <= 0 || ih <= 0) return { width: maxSide, height: maxSide };
  const scale = Math.min(maxSide / iw, maxSide / ih, 1);
  return {
    width: Math.max(1, Math.round(iw * scale)),
    height: Math.max(1, Math.round(ih * scale)),
  };
}

async function buildNormalizedMarkerAvatar(
  source: ImageRequireSource | ImageURISource,
  maxSidePx: number
): Promise<NormalizedAvatar | null> {
  try {
    const { width: iw, height: ih } = await getIntrinsicPixelSize(source);
    const { width: tw, height: th } = fitInsideBox(iw, ih, maxSidePx);

    let inputUri: string;
    if (typeof source === 'number') {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      inputUri = asset.localUri ?? asset.uri ?? '';
      if (!inputUri) return null;
    } else if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
      inputUri = source.uri;
    } else {
      return null;
    }

    const { uri } = await ImageManipulator.manipulateAsync(
      inputUri,
      [{ resize: { width: tw, height: th } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.PNG }
    );
    return { uri };
  } catch (e) {
    console.warn('WorldMap: avatar resize failed', e);
  }
  try {
    const r = Image.resolveAssetSource(source as ImageRequireSource);
    if (r?.uri) {
      return { uri: r.uri };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const WorldMap = forwardRef<MapView, Props>(function WorldMap(
  { region, mapMode, userLocation, userAvatarSource, userAvatarId, children },
  ref
) {
  const useNativeUser = userLocation == null;
  const [mapAvatar, setMapAvatar] = useState<NormalizedAvatar | null>(null);
  /** Let Android snapshot the avatar+ring subtree once images/layout settle, then stop for perf */
  const [avatarTracksView, setAvatarTracksView] = useState(true);

  const maxSidePx = useMemo(
    () => Math.max(28, Math.round(AVATAR_DIAMETER_DP * PixelRatio.get())),
    []
  );
  useEffect(() => {
    let cancelled = false;
    if (userAvatarSource == null) {
      setMapAvatar(null);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const next = await buildNormalizedMarkerAvatar(userAvatarSource, maxSidePx);
      if (!cancelled) setMapAvatar(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [userAvatarSource, userAvatarId, maxSidePx]);

  useEffect(() => {
    if (mapAvatar == null) return;
    setAvatarTracksView(true);
    const t = setTimeout(() => setAvatarTracksView(false), 1600);
    return () => clearTimeout(t);
  }, [mapAvatar?.uri, userAvatarId]);

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseRingStyle = useAnimatedStyle(() => {
    const scale = 1 + pulse.value * 0.95;
    const opacity = 0.5 * (1 - pulse.value);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  /** Slightly larger than the avatar ring so pulse reads clearly */
  const pulseRingBaseDp = RING_OUTER_DP + 8;
  /** Pulse scales up to ~1.95× — hit box must contain the scaled ring */
  const pulseHitBoxDp = Math.ceil(pulseRingBaseDp * 2.05) + AVATAR_MARKER_BLEED_DP * 2;

  const avatarMarkerOuterDp = RING_OUTER_DP + AVATAR_MARKER_BLEED_DP * 2;

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
        <>
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={999}
            tracksViewChanges
          >
            <View
              style={[styles.pulseHitBox, { width: pulseHitBoxDp, height: pulseHitBoxDp }]}
              collapsable={Platform.OS === 'android' ? false : undefined}
            >
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    width: pulseRingBaseDp,
                    height: pulseRingBaseDp,
                    borderRadius: pulseRingBaseDp / 2,
                  },
                  pulseRingStyle,
                ]}
              />
            </View>
          </Marker>
          {mapAvatar != null ? (
            <Marker
              key={userAvatarId ?? mapAvatar.uri}
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={1001}
              tracksViewChanges={avatarTracksView}
            >
              <View
                collapsable={Platform.OS === 'android' ? false : undefined}
                style={{ overflow: 'visible' }}
              >
                <MapUserAvatarSkia
                  uri={mapAvatar.uri}
                  canvasDp={avatarMarkerOuterDp}
                  faceDiameterDp={AVATAR_DIAMETER_DP}
                  ringStrokeDp={AVATAR_RING_BORDER_DP}
                />
              </View>
            </Marker>
          ) : null}
        </>
      )}
      {children}
    </MapView>
  );
});

export default WorldMap;

const styles = StyleSheet.create({
  pulseHitBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(90, 173, 106, 0.95)',
    backgroundColor: 'transparent',
    zIndex: 0,
    elevation: 0,
  },
});
