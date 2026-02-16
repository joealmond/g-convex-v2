'use client'

import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Thin wrapper around @capacitor/haptics.
 * Returns no-op functions on web.
 */
export function useHaptics() {
  const isNative = Capacitor.isNativePlatform()

  const impact = useCallback(
    async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!isNative) return

      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
        const styleMap = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        }
        await Haptics.impact({ style: styleMap[style] })
      } catch {
        // Haptics not available
      }
    },
    [isNative]
  )

  const notification = useCallback(
    async (type: 'success' | 'warning' | 'error' = 'success') => {
      if (!isNative) return

      try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics')
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        }
        await Haptics.notification({ type: typeMap[type] })
      } catch {
        // Haptics not available
      }
    },
    [isNative]
  )

  const vibrate = useCallback(
    async (duration: number = 300) => {
      if (!isNative) return

      try {
        const { Haptics } = await import('@capacitor/haptics')
        await Haptics.vibrate({ duration })
      } catch {
        // Haptics not available
      }
    },
    [isNative]
  )

  return { impact, notification, vibrate, isNative }
}
