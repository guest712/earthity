/**
 * Side-effect preload for GLB on the home path. Dev only — release bundle skips three/drei.
 */
if (__DEV__) {
  const Model = require('../../components/three/Model').default;
  const { CREATURES } = require('../../features/creatures/creature.constants');

  const PLAYER_MODEL = require('../../assets/models/test_wolf1.glb');

  const sources = [
    PLAYER_MODEL,
    ...CREATURES.flatMap((c: { stages?: { model?: unknown }[]; model?: unknown }) =>
      [...(c.stages?.map((s) => s.model) ?? []), c.model].filter(
        (m): m is number | string => m != null
      )
    ),
  ];

  for (const src of sources) {
    Model.preload(src);
  }
}
