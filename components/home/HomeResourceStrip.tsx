import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { homeScreenStyles as styles } from './homeScreen.styles';

export type HomeResourceStripProps = {
  water: number;
  feedCount: number;
  plastic: number;
  glass: number;
  paper: number;
  bio: number;
  style?: StyleProp<ViewStyle>;
};

export default function HomeResourceStrip({
  water,
  feedCount,
  plastic,
  glass,
  paper,
  bio,
  style,
}: HomeResourceStripProps) {
  return (
    <View style={[styles.resourcesStrip, style]}>
      <View style={styles.resourcePill}>
        <Text style={styles.resourceEmoji}>💧</Text>
        <Text style={styles.resourceText}>{water}</Text>
      </View>
      <View style={styles.resourcePill}>
        <Image
          source={require('../../assets/images/items/feed.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
        <Text style={styles.resourceText}>{feedCount}</Text>
      </View>
      <View style={styles.resourcePill}>
        <Image
          source={require('../../assets/images/items/plastictrash.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
        <Text style={styles.resourceText}>{plastic}</Text>
      </View>
      <View style={styles.resourcePill}>
        <Image
          source={require('../../assets/images/items/glasstrash.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
        <Text style={styles.resourceText}>{glass}</Text>
      </View>
      <View style={styles.resourcePill}>
        <Image
          source={require('../../assets/images/items/papertrash.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
        <Text style={styles.resourceText}>{paper}</Text>
      </View>
      <View style={styles.resourcePill}>
        <Image
          source={require('../../assets/images/items/bio.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
        <Text style={styles.resourceText}>{bio}</Text>
      </View>
    </View>
  );
}
