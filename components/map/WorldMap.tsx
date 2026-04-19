import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image, PixelRatio, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { forwardRef, ReactNode, useEffect, useMemo, useState } from 'react';
import type { ImageRequireSource, ImageURISource } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { buildAvatarMarkerUri } from './buildAvatarMarker';

/**
 * Map marker strategy:
 *
 * PULSE — separate Marker with Reanimated (always tracksViewChanges=true).
 *
 * AVATAR — native `Marker.image` fed with a `data:image/png;base64,...` URI.
 *   We use Skia offscreen CPU rendering (`buildAvatarMarkerUri`) to composite:
 *     - avatar photo circle-clipped (cover fit)
 *     - gradient ring stroke
 *   into a single bitmap *before* it goes into the Marker. This is necessary
 *   because Skia Canvas components render to a separate GPU surface that Android's
 *   marker-bitmap capture cannot snapshot. Passing a pre-rendered PNG via
 *   `Marker.image` is the only reliable approach on Android.
 */
type Props = {
  region: any;
  mapMode: 'standard' | 'satellite';
  userLocation?: { latitude: number; longitude: number } | null;
  userAvatarSource?: ImageRequireSource | ImageURISource;
  userAvatarId?: string;
  children?: ReactNode;
};

/** Avatar face diameter in dp */
const AVATAR_DIAMETER_DP = 40;
/** Gradient ring stroke width in dp */
const AVATAR_RING_DP = 3;
/** Pre-resize max side in px fed into Skia (reduce GPU memory for large assets) */
const AVATAR_RESIZE_DP = AVATAR_DIAMETER_DP;

// ─── helpers ────────────────────────────────────────────────────────────────

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
    if (r.width > 0 && r.height > 0) return { width: r.width, height: r.height };
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

function fitInsideBox(iw: number, ih: number, maxSide: number) {
  if (iw <= 0 || ih <= 0) return { width: maxSide, height: maxSide };
  const scale = Math.min(maxSide / iw, maxSide / ih, 1);
  return {
    width: Math.max(1, Math.round(iw * scale)),
    height: Math.max(1, Math.round(ih * scale)),
  };
}

/** Step 1: resize large assets to a manageable size before Skia compositing */
async function resolveResizedUri(
  source: ImageRequireSource | ImageURISource,
  maxSidePx: number
): Promise<string | null> {
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
    return uri;
  } catch (e) {
    console.warn('WorldMap: avatar resize failed', e);
    try {
      const r = Image.resolveAssetSource(source as ImageRequireSource);
      return r?.uri ?? null;
    } catch {
      return null;
    }
  }
}

// ─── component ──────────────────────────────────────────────────────────────

const WorldMap = forwardRef<MapView, Props>(function WorldMap(
  { region, mapMode, userLocation, userAvatarSource, userAvatarId, children },
  ref
) {
  const useNativeUser = userLocation == null;

  /** Final composite PNG data-URI for Marker.image (null while loading) */
  const [markerImageUri, setMarkerImageUri] = useState<string | null>(null);

  const maxResizePx = useMemo(
    () => Math.max(28, Math.round(AVATAR_RESIZE_DP * PixelRatio.get())),
    []
  );

  useEffect(() => {
    let cancelled = false;
    if (userAvatarSource == null) {
      setMarkerImageUri(null);
      return () => { cancelled = true; };
    }
    (async () => {
      // Step 1: resize source to a manageable px size
      const resizedUri = await resolveResizedUri(userAvatarSource, maxResizePx);
      if (cancelled || resizedUri == null) return;

      // Step 2: Skia offscreen composite (circle clip + gradient ring)
      const composite = await buildAvatarMarkerUri(resizedUri, AVATAR_DIAMETER_DP, AVATAR_RING_DP);
      if (!cancelled) setMarkerImageUri(composite);
    })();
    return () => { cancelled = true; };
  }, [userAvatarSource, userAvatarId, maxResizePx]);

  // ── pulse animation ──────────────────────────────────────────────────────
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

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.95 }],
    opacity: 0.5 * (1 - pulse.value),
  }));

  // Total dp size of the composite marker (ring outer edge)
  const markerDp = AVATAR_DIAMETER_DP + AVATAR_RING_DP * 2;
  const pulseBaseDp = markerDp + 8;
  const pulseHitBoxDp = Math.ceil(pulseBaseDp * 2.05);

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
          {/* Pulse ring — separate Marker so Reanimated doesn't conflict with image Marker */}
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
                  { width: pulseBaseDp, height: pulseBaseDp, borderRadius: pulseBaseDp / 2 },
                  pulseRingStyle,
                ]}
              />
            </View>
          </Marker>

          {/* Avatar — pure native image, no children, tracksViewChanges=false */}
          {markerImageUri != null && (
            <Marker
              key={userAvatarId ?? markerImageUri}
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={1001}
              tracksViewChanges={false}
              image={{ uri: markerImageUri }}
            />
          )}
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
  },
});
