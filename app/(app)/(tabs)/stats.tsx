import { Redirect } from 'expo-router';

export default function StatsScreen() {
  return <Redirect href={{ pathname: '/profile', params: { profileTab: 'stats' } }} />;
}
