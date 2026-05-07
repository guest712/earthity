/**
 * Merges walking.glb walk clip into test_wolf.glb (idle), same skeleton.
 * Writes assets/models/test_wolf.glb. Copy backup to test_wolf.before-merge.glb if missing rename.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsSpecular } from '@gltf-transform/extensions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IDLE_SRC = path.join(ROOT, 'assets/models/test_wolf.glb');
const WALK_SRC = path.join(ROOT, 'assets/models/walking.glb');
const OUT_GLb = path.join(ROOT, 'assets/models/test_wolf.glb');
const BACKUP = path.join(ROOT, 'assets/models/test_wolf.before-merge.glb');

function orderedNodes(scene) {
  const out = [];
  function visit(node) {
    out.push(node);
    for (const child of node.listChildren()) visit(child);
  }
  for (const root of scene.listChildren()) visit(root);
  return out;
}

function cloneAccessor(destDoc, srcAcc) {
  const srcArray = srcAcc.getArray();
  const ctor = /** @type {Float32ArrayConstructor} */ (
    /** @type {unknown} */ (srcArray.constructor)
  );
  const copyArr = new ctor(srcArray.length);
  copyArr.set(srcArray);
  const dst = destDoc.createAccessor();
  dst.setArray(copyArr);
  dst.setType(srcAcc.getType());
  dst.setNormalized(srcAcc.getNormalized());
  if (typeof dst.setSparse === 'function' && typeof srcAcc.getSparse === 'function') {
    if (srcAcc.getSparse()) throw new Error('Sparse animation accessor requires manual merge');
    dst.setSparse(false);
  }
  return dst;
}

function samplerClone(baseDoc, walkerSampler, accCache, samplerOldToNew) {
  const keyIn = walkerSampler.getInput();
  const keyOut = walkerSampler.getOutput();
  let inAcc = accCache.get(keyIn);
  if (!inAcc) {
    inAcc = cloneAccessor(baseDoc, keyIn);
    accCache.set(keyIn, inAcc);
  }
  let outAcc = accCache.get(keyOut);
  if (!outAcc) {
    outAcc = cloneAccessor(baseDoc, keyOut);
    accCache.set(keyOut, outAcc);
  }
  const ds = baseDoc.createAnimationSampler();
  ds.setInterpolation(walkerSampler.getInterpolation());
  ds.setInput(inAcc);
  ds.setOutput(outAcc);
  samplerOldToNew.set(walkerSampler, ds);
  return ds;
}

async function main() {
  const io = new NodeIO().registerExtensions([KHRMaterialsSpecular]);
  const base = await io.read(IDLE_SRC);
  const walkDoc = await io.read(WALK_SRC);

  const bScene = base.getRoot().listScenes()[0];
  const wScene = walkDoc.getRoot().listScenes()[0];
  const bNodes = orderedNodes(bScene);
  const wNodes = orderedNodes(wScene);

  if (bNodes.length !== wNodes.length) {
    throw new Error(`Node count mismatch: base ${bNodes.length}, walk ${wNodes.length}`);
  }
  for (let i = 0; i < bNodes.length; i++) {
    const bn = bNodes[i].getName?.() ?? '';
    const wn = wNodes[i].getName?.() ?? '';
    if (bn !== wn)
      console.warn(`[merge-wolf] idx ${i} names differ — mapping by DFS order: "${bn}" vs "${wn}"`);
  }

  const nodeMap = new Map();
  for (let i = 0; i < bNodes.length; i++) nodeMap.set(wNodes[i], bNodes[i]);

  const idleList = base.getRoot().listAnimations();
  if (idleList.length < 1) throw new Error('No animation in idle glb');
  idleList[0].setName('Idle');

  const wAnims = walkDoc.getRoot().listAnimations();
  if (wAnims.length < 1) throw new Error('No animation in walking glb');
  const walkAnim = wAnims[0];

  const newAnim = base.createAnimation('Walk');
  const accCache = new Map();
  const samplerOldToNew = new Map();

  for (const ws of walkAnim.listSamplers()) {
    samplerClone(base, ws, accCache, samplerOldToNew);
    newAnim.addSampler(samplerOldToNew.get(ws));
  }

  for (const wc of walkAnim.listChannels()) {
    const targetNodeWalk = wc.getTargetNode();
    const baseTarget = nodeMap.get(targetNodeWalk);
    if (!baseTarget) throw new Error('Walker node missing from DFS map');

    const newSamp = samplerOldToNew.get(wc.getSampler());
    if (!newSamp) throw new Error('Sampler missing from duplicate map');

    const path = wc.getTargetPath();
    if (path == null || path === '') {
      console.warn('[merge-wolf] skip channel with empty target path');
      continue;
    }
    const nc = base.createAnimationChannel(path);
    nc.setTargetNode(baseTarget);
    nc.setSampler(newSamp);
    newAnim.addChannel(nc);
  }

  await fs.copyFile(IDLE_SRC, BACKUP).catch(() => {});
  await io.write(OUT_GLb, base);
  console.log(`OK: idle + Walk → ${path.relative(ROOT, OUT_GLb)}`);
  console.log(`Backup idle-only copy: ${path.relative(ROOT, BACKUP)} (if write succeeded)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
