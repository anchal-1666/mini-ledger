import { Platform } from 'react-native';

const LOCAL_LAN_IP = '192.168.105.155';
const PORT = 5000;

export const getDefaultApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }
  if (Platform.OS === 'android') {
    // 10.0.2.2 maps directly to the host machine localhost in Android Emulator
    return `http://10.0.2.2:${PORT}/api`;
  }
  // iOS or fallback
  return `http://${LOCAL_LAN_IP}:${PORT}/api`;
};

export const API_BASE_URL = getDefaultApiUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');
