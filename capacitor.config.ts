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
  plugins: {
    StatusBar: {
      // Overlay the webview behind the status bar for immersive header
      overlaysWebView: true,
      // Style will be set dynamically based on theme (light/dark)
      style: 'DARK', // Dark text on light background (default)
    },
    Keyboard: {
      // Resize content when keyboard opens (avoids inputs being hidden)
      resize: 'body',
      // Scroll to input when focused
      scrollAssist: true,
    },
    SplashScreen: {
      // Splash screen auto-hide after app is ready
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#7CB342',
      showSpinner: false,
    },
  },
  ios: {
    // Allow inline media playback (no fullscreen required)
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  android: {
    // Allow mixed content (http resources in https context)
    allowMixedContent: true,
  },
};

export default config;
