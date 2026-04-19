/** Web: Skia offscreen rendering is not used; web marker falls back to RN views. */
export async function buildAvatarMarkerUri(
  _avatarUri: string,
  _diameterDp: number,
  _ringDp: number
): Promise<string | null> {
  return null;
}
