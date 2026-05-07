import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image, PixelRatio, Platform } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { forwardRef, ReactNode, useEffect, useMemo, useState } from 'react';
import type { ImageRequireSource, ImageURISource, ViewStyle } from 'react-native';

import { buildAvatarMarkerUri } from './buildAvatarMarker';

/**
 * Map marker strategy:
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
  /** Initial viewport only; do not pass changing coordinates here or the map will fight user pan/zoom. */
  initialRegion: any;
  mapTileStyle: 'standard' | 'satellite';
  userLocation?: { latitude: number; longitude: number } | null;
  userAvatarSource?: ImageRequireSource | ImageURISource;
  userAvatarId?: string;
  /**
   * When true: don't draw the custom 2D avatar marker AND disable native blue dot.
   * Use this when an external 3D overlay draws the player avatar instead.
   */
  hideUserMarker?: boolean;
  /** Override default style. Pass `{ flex: 1 }` when wrapping in a sized container. */
  style?: ViewStyle;
  /** Fires on every region delta during pan/zoom (high-frequency). */
  onRegionChange?: (region: Region) => void;
  /** Fires once when pan/zoom settles (low-frequency, exact). */
  onRegionChangeComplete?: (region: Region) => void;
  /** Fires when the native map finishes layout (helps AR overlay call `pointForCoordinate` reliably). */
  onMapReady?: () => void;
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
  {
    initialRegion,
    mapTileStyle,
    userLocation,
    userAvatarSource,
    userAvatarId,
    hideUserMarker,
    style,
    onRegionChange,
    onRegionChangeComplete,
    onMapReady,
    children,
  },
  ref
) {
  const useNativeUser = !hideUserMarker && userLocation == null;
  const showCustomMarker = !hideUserMarker && userLocation != null;

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

  return (
    <MapView
      ref={ref}
      style={style ?? { height: 220, margin: 12, borderRadius: 16 }}
      initialRegion={initialRegion}
      showsUserLocation={useNativeUser}
      showsMyLocationButton={useNativeUser}
      followsUserLocation={useNativeUser}
      mapType={mapTileStyle}
      onMapReady={onMapReady}
      onRegionChange={onRegionChange}
      onRegionChangeComplete={onRegionChangeComplete}
      {...(Platform.OS === 'android'
        ? { googleRenderer: 'LATEST', liteMode: false }
        : {})}
    >
      {showCustomMarker && markerImageUri != null && (
        <Marker
          key={userAvatarId ?? markerImageUri}
          coordinate={userLocation!}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={1001}
          tracksViewChanges={false}
          image={{ uri: markerImageUri }}
        />
      )}
      {children}
    </MapView>
  );
});

export default WorldMap;
