import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourarc.arc',
  appName: 'MY ARC',
  webDir: 'dist',
  server: { androidScheme: 'https' },
};

export default config;
