/**
 * react-native-reanimated@4.1.x ships a typo that breaks Hermes release compile:
 * `Failed to find host instance for a ref.}` — stray `}` before closing backtick.
 * See docs/EAS_RELEASE_3D_ROLLBACK.md
 */
'use strict';

const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', 'react-native-reanimated', 'lib', 'module', 'fabricUtils.js'),
];

const bad = 'Failed to find host instance for a ref.}`';
const good = 'Failed to find host instance for a ref.`';

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(bad)) continue;
  fs.writeFileSync(file, src.replace(bad, good), 'utf8');
  console.log('[patch-reanimated-hermes] fixed', path.relative(process.cwd(), file));
}
