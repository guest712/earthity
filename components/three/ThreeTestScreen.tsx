import { Suspense } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Scene3D from './Scene3D';
import Scene3DErrorBoundary from './Scene3DErrorBoundary';

// Kick off GLTF download at module load time so the model is usually ready by
// the time the screen mounts.
Scene3D.preload();

/**
 * Test screen for the 3D pipeline. Renders a declarative r3f scene.
 *
 * Layering (outside → inside):
 * - Scene3DErrorBoundary — catches render / GL failures.
 * - <Suspense fallback="Loading..."> — waits for the GLTF to load.
 *   Kept OUTSIDE <Canvas> so the fallback can be a plain RN <Text>.
 * - Scene3D — the <Canvas> with lights + rotating model.
 */
export default function ThreeTestScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>3D TEST</Text>
        <Text style={styles.subtitle}>r3f · drei · useGLTF</Text>
      </View>

      <View style={styles.stage}>
        <Scene3DErrorBoundary retryLabel="Reload scene">
          <View style={styles.sceneBox}>
            <Suspense fallback={<LoadingFallback />}>
              <Scene3D style={styles.scene} backgroundColor="#1e1e1e" />
            </Suspense>
          </View>
        </Scene3DErrorBoundary>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          If you see the rotating model, the pipeline works.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function LoadingFallback() {
  return (
    <View style={styles.loadingBox}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c120c',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    color: '#e8c97a',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(232,228,216,0.55)',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
  },
  sceneBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
  },
  scene: {
    flex: 1,
  },
  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
  },
  loadingText: {
    color: 'rgba(232,228,216,0.75)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(232,228,216,0.5)',
    fontSize: 11,
  },
});
