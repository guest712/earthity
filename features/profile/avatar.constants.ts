import type { ImageSourcePropType } from 'react-native';

export type AvatarOption = {
  id: string;
  image: ImageSourcePropType;
};

export const AVATARS: AvatarOption[] = [
  { id: 'lumi', image: require('../../assets/images/avatars/lumi.png') },
  { id: 'earthity', image: require('../../assets/images/avatars/earthity.png') },
  { id: 'loone', image: require('../../assets/images/avatars/loone.png') },
];

export const DEFAULT_AVATAR_ID = 'lumi';
