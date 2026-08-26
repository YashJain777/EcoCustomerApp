import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Octicons from 'react-native-vector-icons/Octicons';
import { useTheme } from '@theme/index';

export type IconFamily = 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'FontAwesome' | 'Octicons';

export interface AppIconProps {
  name: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  family?: IconFamily;
  style?: ViewStyle | TextStyle;
}

const SIZE_MAP = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 'md',
  color,
  family = 'Ionicons',
  style,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.text.primary;
  const iconSize = typeof size === 'number' ? size : SIZE_MAP[size] || 22;

  switch (family) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name} size={iconSize} color={iconColor} style={style} />;
    case 'Feather':
      return <Feather name={name} size={iconSize} color={iconColor} style={style} />;
    case 'FontAwesome':
      return <FontAwesome name={name} size={iconSize} color={iconColor} style={style} />;
    case 'Octicons':
      return <Octicons name={name} size={iconSize} color={iconColor} style={style} />;
    case 'Ionicons':
    default:
      return <Ionicons name={name} size={iconSize} color={iconColor} style={style} />;
  }
};
