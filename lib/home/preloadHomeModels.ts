import Model from '../../components/three/Model';
import { CREATURES } from '../../features/creatures/creature.constants';

// Должно совпадать с PLAYER_MAP_MODEL в app/(app)/(tabs)/index.tsx.
const PLAYER_MODEL = require('../../assets/models/test_wolf1.glb');

const sources = [
  PLAYER_MODEL,
  ...CREATURES.flatMap((c) => [...(c.stages?.map((s) => s.model) ?? []), c.model]).filter(
    (m): m is number | string => m != null
  ),
];

for (const src of sources) {
  Model.preload(src);
}
