import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const appStorage = {
  getTheme: (): 'light' | 'dark' | 'system' => {
    return (storage.getString('APP_THEME_MODE') as 'light' | 'dark' | 'system') || 'system';
  },
  setTheme: (mode: 'light' | 'dark' | 'system') => {
    storage.set('APP_THEME_MODE', mode);
  },
};
