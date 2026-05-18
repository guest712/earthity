/**
 * `stats-gl` (transitive через @react-three/drei) тянет `three@^0.170.0`, тогда как
 * проект и остальной стек — `0.166.1`. npm overrides маркируют вложенную установку
 * как invalid и оставляют вторую физическую копию в `stats-gl/node_modules/three`,
 * из-за чего Metro/Node может подхватить два инстанса three.js.
 *
 * Удаляем только эту вложенную директорию: разрешение `require('three')` из stats-gl
 * поднимется до корневого `node_modules/three` (0.166.1).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const nested = path.join(__dirname, '..', 'node_modules', 'stats-gl', 'node_modules', 'three');
try {
  if (fs.existsSync(nested)) {
    fs.rmSync(nested, { recursive: true, force: true });
    console.log('[fix-nested-three] removed', nested);
  }
} catch (e) {
  console.warn('[fix-nested-three]', e.message);
}
