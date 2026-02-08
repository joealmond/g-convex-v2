import { Capacitor } from '@capacitor/core'

/**
 * Platform detection utilities for Capacitor apps
 * Use these to conditionally enable native features or adjust UI for mobile
 */

/**
 * Returns true if running as a native iOS or Android app (via Capacitor)
 * Returns false if running in a web browser
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Returns true if running as a native iOS app
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

/**
 * Returns true if running as a native Android app
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}

/**
 * Returns true if running in a web browser (not native)
 */
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web'
}

/**
 * Returns the current platform: 'ios' | 'android' | 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/**
 * Check if a specific Capacitor plugin is available
 * Useful for graceful degradation when plugins aren't installed
 */
export function isPluginAvailable(pluginName: string): boolean {
  return Capacitor.isPluginAvailable(pluginName)
}
