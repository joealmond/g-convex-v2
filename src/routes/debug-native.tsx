/**
 * Native Features Testing Page
 * 
 * Helps verify that camera, location, and file uploads work correctly on iOS/Android.
 * Access via: /debug-native
 * 
 * Tests:
 * - Camera permissions + photo capture
 * - Location permissions + GPS coordinates
 * - Image upload to Convex storage
 * - Platform detection
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useCameraView } from '@/hooks/use-camera-view'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, MapPin, Upload, Check, X, AlertCircle, Info, 
  Smartphone, Monitor, Loader2, Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageShell } from '@/components/layout/PageShell'

export const Route = createFileRoute('/debug-native')({
  component: DebugNativePage,
})

function DebugNativePage() {
  // Platform info
  const platform = Capacitor.getPlatform()
  const isNative = Capacitor.isNativePlatform()

  // Location testing
  const { 
    coords, 
    loading: geoLoading, 
    error: geoError, 
    permissionStatus: geoPermission,
    requestLocation,
    checkPermissions: checkGeoPermissions,
    requestPermissions: requestGeoPermissions,
  } = useGeolocation()

  // Camera testing
  const {
    hasPermission: cameraPermission,
    isRunning: cameraRunning,
    checkPermissions: checkCameraPermissions,
    requestPermissions: requestCameraPermissions,
    startCamera,
    stopCamera,
    capturePhoto,
  } = useCameraView()

  // Image upload testing
  const [uploadedImage, setUploadedImage] = useState<{ storageId: string; url: string } | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  // Camera capture test
  const [capturedBlob, setCapturedBlob] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)

  const handleCheckCameraPermissions = useCallback(async () => {
    await checkCameraPermissions()
  }, [checkCameraPermissions])

  const handleRequestCameraPermissions = useCallback(async () => {
    await requestCameraPermissions()
  }, [requestCameraPermissions])

  const handleCaptureTest = useCallback(async () => {
    setCapturing(true)
    try {
      // Start camera
      const started = await startCamera()
      if (!started) {
        setUploadError('Failed to start camera')
        return
      }

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Capture photo
      const file = await capturePhoto()
      if (file) {
        setCapturedBlob(URL.createObjectURL(file))
        // Test upload
        await handleUploadImage(file)
      } else {
        setUploadError('No photo captured')
      }

      // Stop camera
      await stopCamera()
    } catch (error: any) {
      console.error('Capture test failed:', error)
      setUploadError(error.message || 'Capture failed')
      await stopCamera()
    } finally {
      setCapturing(false)
    }
  }, [startCamera, stopCamera, capturePhoto])

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadLoading(true)
    setUploadError(null)
    
    try {
      console.log('[Upload Test] Starting upload...')
      console.log('[Upload Test] File size:', file.size, 'bytes')
      console.log('[Upload Test] File type:', file.type)

      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl()
      console.log('[Upload Test] Got upload URL')

      // 2. Upload file
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      console.log('[Upload Test] Upload response status:', response.status)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const { storageId } = await response.json()
     console.log('[Upload Test] Got storage ID:', storageId)

      // 3. Get the storage URL (this simulates how we'd display the image)
      // On Convex, storage URLs are accessible via the files.getUrl query
      // For now, we'll just store the ID and mark success
      
      setUploadedImage({ 
        storageId, 
        url: `Successfully uploaded (storageId: ${storageId})` 
      })
      console.log('[Upload Test] ✅ Success!')
    } catch (error: any) {
      console.error('[Upload Test] ❌ Error:', error)
      setUploadError(error.message || 'Upload failed')
    } finally {
      setUploadLoading(false)
    }
  }, [generateUploadUrl])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadImage(file)
    }
  }, [handleUploadImage])

  return (
    <PageShell title="Native Testing" showBack>
      <div className="space-y-4 pb-8">
        {/* Platform Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isNative ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              Platform Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform:</span>
              <Badge variant="outline">{platform}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Is Native:</span>
              <Badge variant={isNative ? 'default' : 'secondary'}>
                {isNative ? 'Yes' : 'No (Web)'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">User Agent:</span>
              <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                {navigator.userAgent.split(' ')[0]}...
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Location Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location (Geolocation)
            </CardTitle>
            <CardDescription>
              Tests @capacitor/geolocation on native, navigator.geolocation on web
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permission Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Permission:</span>
              <Badge 
                variant={
                  geoPermission === 'granted' ? 'default' : 
                  geoPermission === 'denied' ? 'destructive' : 
                  'outline'
                }
              >
                {geoPermission || 'unknown'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={checkGeoPermissions} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Info className="h-4 w-4 mr-2" />
                Check Permissions
              </Button>

              {isNative && geoPermission !== 'granted' && (
                <Button 
                  onClick={requestGeoPermissions} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Permissions
                </Button>
              )}

              <Button 
                onClick={requestLocation} 
                disabled={geoLoading}
                size="sm"
                className="w-full"
              >
                {geoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Current Location
                  </>
                )}
              </Button>
            </div>

            {/* Results */}
            {coords && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">Location Retrieved</p>
                    <p className="text-green-700 dark:text-green-300 mt-1 font-mono text-xs">
                      {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {geoError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                    <p className="text-red-700 dark:text-red-300 mt-1">{geoError}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera (capacitor-camera-view)
            </CardTitle>
            <CardDescription>
              Tests camera permissions and photo capture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isNative ? (
              <>
                {/* Permission Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Permission:</span>
                  <Badge 
                    variant={
                      cameraPermission === true ? 'default' : 
                      cameraPermission === false ? 'destructive' : 
                      'outline'
                    }
                  >
                    {cameraPermission === true ? 'granted' : 
                     cameraPermission === false ? 'denied' : 'unknown'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleCheckCameraPermissions} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Check Permissions
                  </Button>

                  {cameraPermission !== true && (
                    <Button 
                      onClick={handleRequestCameraPermissions} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Permissions
                    </Button>
                  )}

                  <Button 
                    onClick={handleCaptureTest} 
                    disabled={capturing || cameraPermission !== true}
                    size="sm"
                    className="w-full"
                  >
                    {capturing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Test Capture + Upload
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview */}
                {capturedBlob && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Captured Photo:</p>
                    <img 
                      src={capturedBlob} 
                      alt="Captured" 
                      className="w-full h-48 object-contain bg-muted rounded-lg"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Camera overlay is only available on native platforms. Use the file upload test below.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Image Upload (Convex Storage)
            </CardTitle>
            <CardDescription>
              Tests image upload to Convex + CORS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />

            {uploadLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading to Convex...
              </div>
            )}

            {uploadedImage && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">Upload Successful</p>
                    <p className="text-green-700 dark:text-green-300 mt-1 font-mono text-xs break-all">
                      {uploadedImage.url}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">Upload Failed</p>
                    <p className="text-red-700 dark:text-red-300 mt-1">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">1. Location:</strong> Check permission status, request if needed, then get location. Should show coordinates.</p>
            <p><strong className="text-foreground">2. Camera (Native only):</strong> Check/request permissions, then test capture. Should show photo preview + upload result.</p>
            <p><strong className="text-foreground">3. Upload:</strong> Select an image file. Should upload to Convex and display storage ID.</p>
            <p className="pt-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ If any test fails, check Xcode/Android Studio console for detailed error logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
