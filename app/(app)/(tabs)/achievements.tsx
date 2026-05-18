import { Redirect } from 'expo-router';

export default function AchievementsScreen() {
  return <Redirect href={{ pathname: '/profile', params: { profileTab: 'achievements' } }} />;
}
