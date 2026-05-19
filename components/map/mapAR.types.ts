/** Types shared without importing MapARScene / three (safe for release bundle). */

export type ModelSource = number | string;

export type SkinLocomotionHints = {
  idle?: string[];
  walk?: string[];
};

export type ARObjectPose = 'flat' | 'upright' | 'auto';

export type ARObject = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  modelSource: ModelSource;
  scale?: number;
  heading?: number | null;
  headingOffsetDeg?: number;
  pose?: ARObjectPose;
  pulseRing?: boolean;
  nearestSpawnProximity?: number;
  locomotion?: boolean;
  locomotionClipHints?: SkinLocomotionHints;
  locomotionHardSwitch?: boolean;
  fallbackProjectionCenter?: boolean;
};
