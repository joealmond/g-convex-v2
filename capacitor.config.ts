import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gmatrix.app',
  appName: 'G-Matrix',
  webDir: 'dist/client',
  server: {
    // iOS uses 'capacitor' scheme (default) — WKWebView cannot use http/https
    // Android uses 'https' scheme (default)
    hostname: 'localhost',
  },
};

export default config;
