/**
 * Map AR (MapARScene, drei, three) is included in the JS bundle only in dev.
 * Release / EAS uses Hermes on a slim bundle (see docs/EAS_RELEASE_3D_ROLLBACK.md).
 */
export const INCLUDE_MAP_3D_IN_RELEASE_BUNDLE = __DEV__;
