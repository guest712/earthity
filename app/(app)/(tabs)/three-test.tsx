import { Redirect } from 'expo-router';

export default function ThreeTestRoute() {
  if (__DEV__) {
    const ThreeTestScreen = require('../../../components/three/ThreeTestScreen').default;
    return <ThreeTestScreen />;
  }
  return <Redirect href="/" />;
}
