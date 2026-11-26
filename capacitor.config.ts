import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.albatross.ourlittleuniverse',
  appName: 'Our Little Universe',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
