import {
  ClipOp,
  ImageFormat,
  PaintStyle,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import { PixelRatio } from 'react-native';

const RING_COLORS = ['#5ee8ff', '#c084fc', '#e879f9'];
const RING_POS = [0, 0.55, 1];

/**
 * Renders avatar + gradient ring to a CPU Skia offscreen surface and returns
 * a `data:image/png;base64,...` URI for use with `Marker.image`.
 *
 * Skia `Canvas` components are NOT captured by Android's marker bitmap snapshot
 * because they render to a separate GPU surface. Offscreen CPU rendering + encodeToBase64
 * is the only reliable way to pass Skia-drawn content to a native map Marker.
 *
 * @param avatarUri   file:// URI from expo-image-manipulator (pre-resized)
 * @param diameterDp  avatar face diameter in dp
 * @param ringDp      ring stroke width in dp
 */
export async function buildAvatarMarkerUri(
  avatarUri: string,
  diameterDp: number,
  ringDp: number
): Promise<string | null> {
  try {
    const pr = PixelRatio.get();
    const faceR = Math.round((diameterDp / 2) * pr);
    const ringPx = Math.max(1, Math.round(ringDp * pr));
    // Total canvas: face circle + ring half-stroke on each side
    const totalPx = faceR * 2 + ringPx * 2;
    const cx = totalPx / 2;
    const cy = totalPx / 2;

    // 1. Load source image
    const data = await Skia.Data.fromURI(avatarUri);
    if (!data) return null;
    const srcImg = Skia.Image.MakeImageFromEncoded(data);
    if (!srcImg) return null;

    // 2. CPU offscreen surface (transparent)
    const surface = Skia.Surface.Make(totalPx, totalPx);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('transparent'));

    // 3. Clip to circle and draw avatar (center-crop = cover)
    const clipPath = Skia.Path.Make();
    clipPath.addCircle(cx, cy, faceR);
    canvas.save();
    canvas.clipPath(clipPath, ClipOp.Intersect, true);

    const iw = srcImg.width();
    const ih = srcImg.height();
    const srcSide = Math.min(iw, ih);
    const src = Skia.XYWHRect(
      (iw - srcSide) / 2,
      (ih - srcSide) / 2,
      srcSide,
      srcSide
    );
    const dst = Skia.XYWHRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);
    const imgPaint = Skia.Paint();
    canvas.drawImageRect(srcImg, src, dst, imgPaint);
    canvas.restore();

    // 4. Gradient ring stroke (centered on the face border)
    const ringMidR = faceR + ringPx / 2;
    const ringPaint = Skia.Paint();
    ringPaint.setStyle(PaintStyle.Stroke);
    ringPaint.setStrokeWidth(ringPx);
    ringPaint.setAntiAlias(true);

    const shader = Skia.Shader.MakeLinearGradient(
      Skia.Point(cx - ringMidR, cy),
      Skia.Point(cx + ringMidR, cy),
      RING_COLORS.map((c) => Skia.Color(c)),
      RING_POS,
      TileMode.Clamp
    );
    ringPaint.setShader(shader);
    canvas.drawCircle(cx, cy, ringMidR, ringPaint);

    // 5. Encode to base64 PNG
    const snapshot = surface.makeImageSnapshot();
    const base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.warn('buildAvatarMarkerUri failed', e);
    return null;
  }
}
