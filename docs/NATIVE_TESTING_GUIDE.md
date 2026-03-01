# Native Features Testing Guide

Comprehensive testing procedures for verifying camera, location, and file upload functionality on iOS and Android devices.

---

## Quick Access

**Testing Page**: Navigate to `/debug-native` in the app
- **Mobile App**: Tap hamburger menu → "Debug Native"
- **Web Dev**: Visit `http://localhost:3000/debug-native`

---

## Prerequisites

### iOS
- Xcode 14.1+
- Physical device or simulator (simulator has no GPS/camera)
- App built with **Release** configuration for production-like testing

### Android
- Android Studio Flamingo+
- Physical device or emulator
- **Emulator**: Set mock location via Extended Controls (see `ANDROID_EMULATOR_LOCATION.md`)

---

## Testing Procedures

### 1. Location Permissions & GPS

#### Test Flow
1. Open `/debug-native` page
2. In **Location (Geolocation)** section:
   - Tap **"Check Permissions"** → Status updates
   - If "prompt" or "denied": Tap **"Request Permissions"**
   - Grant permission in system dialog
   - Tap **"Get Current Location"** → Coordinates display

#### Expected Results
| Step | Expected Behavior | iOS | Android |
|------|------------------|-----|---------|
| Fresh install | Permission status: "prompt" | ✅ | ✅ |
| Request permissions | System dialog appears | ✅ | ✅ |
| Grant permission | Status: "granted", green badge | ✅ | ✅ |
| Get location | Coordinates display (lat/lon) | ✅ | ✅ |
| Deny permission | Error: "Location permission denied" + Settings hint | ✅ | ✅ |
| No GPS (emulator) | Timeout → Error message | N/A | ✅ |
| Mock location set | Shows mock coordinates | N/A | ✅ |

#### Error States
- **Permission Denied**: "Location permission denied. Enable in Settings → Privacy → Location Services."
- **Timeout**: "Location request timed out" (10s timeout on high-accuracy mode)
- **Unavailable**: "Location service unavailable" (GPS hardware off or unavailable)

---

### 2. Camera Permissions & Capture

#### Test Flow (Native Only)
1. In **Camera (capacitor-camera-view)** section:
   - Tap **"Check Permissions"** → Status updates
   - If not "granted": Tap **"Request Permissions"**
   - Grant camera access in system dialog
   - Tap **"Test Capture + Upload"**
   - Camera opens for 2 seconds → captures photo → closes
   - Photo preview appears
   - Upload progress → Success with storage ID

#### Expected Results
| Step | Expected Behavior | iOS | Android |
|------|------------------|-----|---------|
| Fresh install | Permission: "unknown" | ✅ | ✅ |
| Check permissions | Status updates to "granted"/"denied"/"prompt" | ✅ | ✅ |
| Request permissions | System camera dialog appears | ✅ | ✅ |
| Grant permission | Permission badge turns green: "granted" | ✅ | ✅ |
| Test capture | Camera opens full-screen, captures after 2s, closes | ✅ | ✅ |
| Photo preview | Captured image displays in preview box | ✅ | ✅ |
| Upload | "Uploading to Convex..." → "Upload Successful" + storage ID | ✅ | ✅ |

#### Error States
- **Permission Denied**: "Failed to start camera" → Button stays disabled
- **Capture Failed**: "No photo captured" → Check console for error details
- **Upload Failed**: Red error box with detailed message

---

### 3. Image Upload (File Picker)

#### Test Flow
1. In **Image Upload (Convex Storage)** section:
   - Tap **"Choose File"** button
   - Select an image from gallery/photos
   - Upload progress → Success with storage ID

#### Expected Results
| Step | Expected Behavior | iOS | Android | Web |
|------|------------------|-----|---------|-----|
| Choose File | Native file picker opens | ✅ | ✅ | ✅ |
| Select image | Preview or filename shows | ✅ | ✅ | ✅ |
| Upload starts | "Uploading to Convex..." spinner | ✅ | ✅ | ✅ |
| Upload completes | Green success box + storage ID | ✅ | ✅ | ✅ |
| Large image (>5MB) | Successful upload (no size rejection) | ✅ | ✅ | ✅ |

#### Console Logs (Verify in DevTools/Xcode/Android Studio)
```
[Upload Test] Starting upload...
[Upload Test] File size: 2457832 bytes
[Upload Test] File type: image/jpeg
[Upload Test] Got upload URL
[Upload Test] Upload response status: 200
[Upload Test] Got storage ID: kg2xxx...
[Upload Test] ✅ Success!
```

#### Error States
- **No file selected**: No action taken
- **Upload failed**: Red error box with HTTP status or error message
- **CORS error**: Check `VITE_CONVEX_SITE_URL` environment variable is set

---

## Complete Testing Checklist

### Pre-Testing Setup
- [ ] App built with latest code (`npm run build`)
- [ ] Capacitor synced (`npx cap sync`)
- [ ] iOS: Using **Release** build configuration (not Debug)
- [ ] Android Emulator: Mock location set (if testing location)
- [ ] ConvexDev running (`npx convex dev`)

### Location Testing
- [ ] Fresh install: Permission status shows "prompt"
- [ ] Check permissions: Status updates correctly
- [ ] Request permissions: System dialog appears
- [ ] Grant permission: Status changes to "granted" (green badge)
- [ ] Get location: Coordinates display within 5 seconds
- [ ] Coordinates accurate: Match device's actual location (or mock location on emulator)
- [ ] Deny permission: Error message with Settings instructions
- [ ] Re-request after deny: System dialog does NOT appear (iOS limitation — must enable in Settings)

### Camera Testing (Native Only)
- [ ] Fresh install: Permission shows "unknown"
- [ ] Check permissions: Status updates
- [ ] Request permissions: System camera dialog appears
- [ ] Grant permission: Status changes to "granted"
- [ ] Test capture: Camera opens full-screen
- [ ] Capture completes: Camera closes after ~2 seconds
- [ ] Photo preview: Captured image displays
- [ ] Upload starts: "Uploading..." message shows
- [ ] Upload completes: Green success box + storage ID
- [ ] Console logs: No errors during capture or upload
- [ ] Deny permission: Button stays disabled, error message shows

### File Upload Testing
- [ ] Choose file: Native picker opens
- [ ] Select JPEG: Upload succeeds
- [ ] Select PNG: Upload succeeds
- [ ] Select WebP: Upload succeeds
- [ ] Small image (<1MB): Uploads quickly
- [ ] Large image (5-10MB): Upload completes (may take 5-10s)
- [ ] Upload progress: Spinner or progress indicator visible
- [ ] Success state: Green box with storage ID
- [ ] Console logs: Detailed upload steps logged
- [ ] Check DevTools/console: No CORS errors or 404s

### Integration Testing (Full App Flow)
- [ ] Navigate to "Add Product" (➕ tab)
- [ ] Tap camera icon (if native) → Camera opens
- [ ] Capture product photo → Preview shows
- [ ] AI analysis runs → Product name + ratings populate
- [ ] Tap location icon → GPS coordinates captured
- [ ] Submit product → Success toast
- [ ] Product appears in feed with correct image

---

## Common Issues & Solutions

### Location Permission Denied (iOS)
**Symptom**: "Location permission denied" error even after granting permission.

**Solutions**:
1. Check `Info.plist` has `NSLocationWhenInUseUsageDescription` key
2. Delete app and reinstall (clears permission cache)
3. Go to Settings → Privacy & Security → Location Services → G-Matrix → Set to "While Using"

### Location Timeout (Android Emulator)
**Symptom**: "Location request timed out" after 10 seconds.

**Cause**: Emulator has no GPS by default.

**Solution**: Set mock location via Extended Controls (see `docs/ANDROID_EMULATOR_LOCATION.md`):
```bash
# Via ADB
adb emu geo fix 19.0402 47.4979  # Budapest

# Or use Extended Controls UI
```

### Camera Wizard — Full Flow Testing

#### Test Flow (Native Only)
1. Navigate to "Add Product" (➕ tab)
2. Camera should open with **black screen** briefly, then native camera feed
3. **Step 1 (Front photo)**: Tap shutter button → flash animation → advances to step 2
4. **Step 2 (Ingredients)**: Tap shutter → advances to step 3. Or tap "Skip"
5. **Step 3 (Barcode)**: Aim at barcode → auto-detects and finishes. Or tap "Skip"
6. Progress indicator shows "Processing..." with AI analysis
7. Review step shows product name, ratings, barcode data
8. Submit → product created

#### What to Verify
| Check | Expected | Notes |
|-------|----------|-------|
| Black → camera transition | No white/cream flash | Two-phase CSS: `camera-starting` → `camera-running` |
| All buttons work | Shutter, Skip, Cancel respond to taps | Radix `modal={false}` on native |
| Camera stops after wizard | No frozen camera image | `await stopCamera()` with 120ms delay |
| Camera doesn't restart after submit | Dialog closes cleanly | Step never set back to `'wizard'` |
| Barcode auto-detection | Barcode scanned on step 3 | `AVCaptureMetadataOutput` listener |
| Cancel mid-flow | Camera stops, dialog closes | `cancelledRef` abort pattern |
| `captureSample` works | Photos captured without crash | Not `capture()` — video frame grab |

#### Known Issues
- **v2.0.0 crash**: `FigCaptureSourceRemote err=-17281` — must use v2.0.2+
- **Simulator**: No camera hardware — test on physical device only
- **Reference**: See `docs/CAMERA_WIZARD.md` for full architecture

---

### Camera Black Screen (iOS)
**Symptom**: Camera opens but shows black screen, no capture.

**Causes**:
1. `NSCameraUsageDescription` missing from `Info.plist`
2. Privacy permission denied in Settings

**Solutions**:
1. Check Xcode console for permission errors
2. Settings → Privacy & Security → Camera → G-Matrix → Enable
3. Delete app and reinstall

### Upload Fails with CORS Error
**Symptom**: Upload fails with CORS or network error.

**Causes**:
1. `VITE_CONVEX_SITE_URL` not set in `.env.local`
2. Convex backend not running

**Solutions**:
1. Verify `.env.local` has `VITE_CONVEX_SITE_URL=https://your-site.convex.cloud`
2. Run `npx convex dev` in terminal
3. Rebuild app: `npm run build && npx cap sync`

### Upload Succeeds but Image Doesn't Display
**Symptom**: Upload returns storage ID but image shows broken icon in product detail.

**Cause**: Storage URL query not implemented or file not actually uploaded.

**Debug**:
1. Check Convex dashboard → Files → Verify file exists
2. Copy storage ID and query via `files.getUrl` in Convex dashboard
3. Verify URL returns 200 (not 404)

---

## Platform-Specific Notes

### iOS

#### Debug vs Release Builds
- **Debug**: Verbose logs including session tokens (**security risk**)
- **Release**: Minimal logs, no sensitive data
- **Recommendation**: Always test with Release build

**Switch to Release**:
1. Xcode → Click scheme (next to Stop button)
2. Edit Scheme → Run → Build Configuration → **Release**

#### Simulator Limitations
- ❌ No GPS (location always fails)
- ❌ No camera (camera permission requests fail)
- ✅ File picker works (can select from photo library)

**Use physical device for full testing.**

### Android

#### Gradle Warnings (Harmless)
During build, you may see:
```
The option setting 'android.usesSdkInManifest.disallowed=false' is deprecated.
```
These are cosmetic — they don't prevent build or runtime functionality.

#### Emulator GPS
Android emulators support mock GPS:
- Set via: **Emulator More (...) → Location → Enter coordinates → Send**
- Or via ADB: `adb emu geo fix [longitude] [latitude]`
- **Order matters**: Longitude THEN latitude (reversed from typical convention)

#### Permissions After Denial
On Android, if user permanently denies a permission ("Don't ask again"), `requestPermissions()` will no longer show a dialog. App must guide user to Settings manually.

---

## Debugging Tips

### Enable Detailed Logging

#### iOS (Xcode Console)
1. Xcode → Window → Devices and Simulators
2. Select your device
3. Open Console
4. Filter: Your app's bundle ID (e.g., `com.gmatrix.app`)

#### Android (Logcat)
1. Android Studio → View → Tool Windows → Logcat
2. Filter: `G-Matrix` or package name
3. Look for `[Upload Test]`, `Geolocation`, `CameraView` tags

### Check Convex Logs
```bash
npx convex logs
```
Look for:
- File upload requests
- Storage ID generation
- Any error messages from `files.generateUploadUrl`

### Network Traffic
Use browser DevTools (on web) or Charles Proxy (on device) to inspect:
- Upload POST request to Convex storage URL
- Request headers (`Content-Type`)
- Response status (200 = success)

---

## Success Criteria

### Location ✅
- [ ] Permission dialog appears on first request
- [ ] Coordinates display within 5 seconds of granting permission
- [ ] Coordinates match expected location (physical device) or mock location (emulator)
- [ ] Error messages are clear and actionable

### Camera ✅
- [ ] Camera opens full-screen on native
- [ ] Photo capture completes in ~2 seconds
- [ ] Captured image displays in preview
- [ ] Upload completes with storage ID
- [ ] No crashes or blank screens

### Upload ✅
- [ ] File picker opens on all platforms
- [ ] Images of various formats (JPEG, PNG, WebP) upload successfully
- [ ] Large images (5-10MB) upload without errors
- [ ] Storage ID returned and logged
- [ ] Console shows detailed upload progress

---

## Additional Resources

- **iOS Logging**: `docs/IOS_LOGGING.md`
- **Android GPS Setup**: `docs/ANDROID_EMULATOR_LOCATION.md`
- **Mobile Deployment**: `docs/MOBILE_DEPLOYMENT.md`
- **Capacitor Docs**: https://capacitorjs.com/docs

---

*Last updated: 2026-02-16*
