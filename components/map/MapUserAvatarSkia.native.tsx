import {
  Canvas,
  Circle,
  Group,
  Image as SkiaImage,
  LinearGradient,
  rrect,
  rect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

export type MapUserAvatarSkiaProps = {
  uri: string;
  /** Full marker square in dp (includes symmetric bleed) */
  canvasDp: number;
  faceDiameterDp: number;
  ringStrokeDp: number;
};

/**
 * Circular avatar + gradient stroke. Requires dev build with Skia native libs.
 */
export function MapUserAvatarSkia({
  uri,
  canvasDp,
  faceDiameterDp,
  ringStrokeDp,
}: MapUserAvatarSkiaProps) {
  const image = useImage(uri);
  const c = canvasDp / 2;
  const faceR = faceDiameterDp / 2;
  const ringMidR = faceR + ringStrokeDp / 2;

  const clipRrect = useMemo(() => {
    const r = rect(c - faceR, c - faceR, faceDiameterDp, faceDiameterDp);
    return rrect(r, faceR, faceR);
  }, [c, faceR, faceDiameterDp]);

  if (!image) {
    return <View style={{ width: canvasDp, height: canvasDp }} />;
  }

  return (
    <Canvas style={{ width: canvasDp, height: canvasDp }}>
      <Group clip={clipRrect}>
        <SkiaImage
          image={image}
          x={c - faceR}
          y={c - faceR}
          width={faceDiameterDp}
          height={faceDiameterDp}
          fit="cover"
        />
      </Group>
      <Circle cx={c} cy={c} r={ringMidR} style="stroke" strokeWidth={ringStrokeDp}>
        <LinearGradient
          start={vec(c - ringMidR, c)}
          end={vec(c + ringMidR, c)}
          colors={['#5ee8ff', '#c084fc', '#e879f9']}
          positions={[0, 0.55, 1]}
        />
      </Circle>
    </Canvas>
  );
}
