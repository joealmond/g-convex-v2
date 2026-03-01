# Camera Wizard — Architecture & Lessons Learned

> Comprehensive guide to the native camera capture system built with `capacitor-camera-view`. Documents architecture decisions, bug fixes, and hard-won patterns from iOS production debugging.

---

## Overview

The Camera Wizard is a **3-step guided capture overlay** for product photo capture:

1. **Front photo** — Product packaging (front-facing image)
2. **Ingredients photo** — Ingredient list / nutrition label
3. **Barcode scan** — Automatic barcode detection via `AVCaptureMetadataOutput`

After the wizard completes, the app runs AI analysis on the photos, looks up the barcode in Open Food Facts, and pre-fills the product creation form.

---

## Architecture

### How Native Camera Rendering Works

The native iOS camera renders **behind** the WebView using AVFoundation's `AVCaptureVideoPreviewLayer`. The WebView is made transparent so the camera feed shows through, and a React overlay (portaled to `document.body`) provides the capture UI.

```
┌──────────────────────────────────┐
│  Native iOS Layer                │
│  AVCaptureVideoPreviewLayer      │  ← Camera feed renders here
│  (behind WebView)                │
├──────────────────────────────────┤
│  WKWebView (transparent)         │  ← Made transparent via CSS
│  ┌────────────────────────────┐  │
│  │  .camera-overlay (portal)  │  │  ← CameraWizard UI (buttons, step indicator)
│  │  - Step indicator (1/2/3)  │  │
│  │  - Shutter button          │  │
│  │  - Skip / Cancel buttons   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Key Files

| File | Role |
|------|------|
| `src/components/product/CameraWizard.tsx` | 3-step capture UI with step indicator, shutter button, barcode detection |
| `src/hooks/use-camera-view.ts` | Camera lifecycle hook: start/stop/capture/barcode with cancellation guards |
| `src/components/product/ImageUploadDialog.tsx` | Dialog shell — manages modal/non-modal, camera CSS classes |
| `src/hooks/use-image-upload.ts` | Orchestration: wizard → processing → review → submit |
| `src/styles/globals.css` | `camera-starting` and `camera-running` CSS classes |

### CSS Transparency System

Two CSS classes on `<body>` control WebView transparency:

```css
/* Phase 1: Black screen while camera initializes */
body.camera-starting {
  background: #000 !important;
}
body.camera-starting > * {
  visibility: hidden !important;  /* Hide all app content */
}

/* Phase 2: Transparent for camera feed */
body.camera-running {
  background: transparent !important;
}
body.camera-running > * {
  visibility: hidden !important;  /* Still hide app content */
}

/* Only the camera overlay stays visible */
body.camera-running .camera-overlay,
body.camera-starting .camera-overlay {
  visibility: visible !important;
}
```

Both phases also hide `[data-slot="dialog-overlay"]` to prevent the Radix Dialog backdrop from blocking the camera feed.

### Two-Phase Camera Startup

To avoid a **white/cream flash** when opening the camera:

```
App UI  →  camera-starting (black screen)  →  camera-running (transparent + camera feed)
```

1. `handleOpenChange(true)` in `ImageUploadDialog` adds `camera-starting` class **before** the dialog mounts
2. `CameraWizard` mounts, calls `startCamera()` (async: dynamic import → permissions → listener → native start)
3. After `startCamera()` resolves, `camera-starting` is replaced with `camera-running`
4. Native AVFoundation feed now visible through transparent WebView

This gives the sequence: **app → black → camera feed** — which feels natural and avoids the flash.

### Portal Rendering

`CameraWizard` renders via `createPortal(overlay, document.body)` — not inside the Radix Dialog DOM tree. This is necessary because:

- Dialog's CSS `transform` creates a new stacking context that clips the overlay
- The camera overlay needs to be full-screen, above everything
- The portal receives a `.camera-overlay` class so the CSS visibility override works

---

## Dialog Integration (Radix UI)

### Modal vs Non-Modal

```tsx
<DialogContent modal={!isNative}>
```

- **Web**: `modal={true}` (default Radix behavior — focus trap, scroll lock, dismiss on outside click)
- **Native**: `modal={false}` — because `modal={true}` adds the `inert` HTML attribute to all body siblings

**Why `inert` breaks the camera**: Since `CameraWizard` is portaled to `document.body`, it becomes a sibling of the Radix Dialog portal. With `modal={true}`, Radix marks all siblings as `inert`, making every button in the camera overlay (shutter, cancel, skip, next) completely unresponsive.

**Important**: Radix does not support switching the `modal` prop while the dialog is open — it causes a re-mount. Use a constant value based on platform.

### Preventing Dismiss During Camera

With the overlay portaled outside the Dialog, taps on camera buttons register as "interact outside" the `DialogContent`, triggering auto-dismiss:

```tsx
<DialogContent
  onInteractOutside={(e) => { if (isNativeWizard) e.preventDefault() }}
  onPointerDownOutside={(e) => { if (isNativeWizard) e.preventDefault() }}
  onEscapeKeyDown={(e) => { if (isNativeWizard) e.preventDefault() }}
>
```

### Manual Scroll Lock

Since `modal={false}` disables Radix's built-in scroll lock, we add manual scroll prevention during non-wizard steps (processing, review, submitting) on native:

```tsx
useEffect(() => {
  if (isNative && open && step !== 'wizard') {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }
}, [open, step])
```

---

## Camera Lifecycle (`use-camera-view.ts`)

### Async Start with Cancellation Guard

`startCamera()` is async with multiple await points:

1. Dynamic import of `capacitor-camera-view`
2. Permission check/request
3. Register barcode listener
4. `CameraView.start()`

If the component unmounts mid-start (e.g., user quickly cancels), the in-flight async chain must abort. A `cancelledRef` is checked after every async gap:

```tsx
const cancelledRef = useRef(false)

const startCamera = async () => {
  cancelledRef.current = false
  
  const { CameraView } = await import('capacitor-camera-view')
  if (cancelledRef.current) return  // Unmounted during import
  
  await CameraView.requestPermissions()
  if (cancelledRef.current) { /* cleanup */ return }
  
  await CameraView.start({ ... })
  if (cancelledRef.current) { await CameraView.stop(); return }
}

// On unmount:
useEffect(() => () => { cancelledRef.current = true }, [])
```

### Stop Camera with Delay

```tsx
const stopCamera = async () => {
  const { CameraView } = await import('capacitor-camera-view')
  await CameraView.stop()
  
  // 120ms delay for UIKit cleanup
  await new Promise(resolve => setTimeout(resolve, 120))
}
```

The plugin's JavaScript promise resolves via a completion callback from `captureSession.stopRunning()` on the iOS background queue. However, the main-thread UIKit cleanup (`videoPreviewLayer.removeFromSuperlayer()`, `webView.isOpaque = true`) happens asynchronously after that. The 120ms delay ensures the preview layer is fully removed before we proceed with DOM changes.

### `captureSample()` vs `capture()`

Always use `captureSample()` for the wizard's multi-photo flow:

| Method | Underlying API | Speed | Use Case |
|--------|---------------|-------|----------|
| `captureSample({ quality: 90 })` | `AVCaptureVideoDataOutput` — grabs current video frame | Fast (~50ms) | Multi-photo wizard, rapid captures |
| `capture()` | `AVCapturePhotoOutput.capturePhoto()` — full hardware pipeline | Slow (~300-500ms) | Single high-quality photo, flash |

`capture()` triggers the full iOS photo pipeline with autofocus/autoexposure settling, shutter sound, and hardware ISP processing. For a wizard capturing 2-3 photos in quick succession, `captureSample()` is much more reliable.

### Plugin Version Requirement

**Must use `capacitor-camera-view` v2.0.2+.**

v2.0.0 had a critical bug: `stopSession()` resolved the JavaScript promise immediately, before `captureSession.stopRunning()` completed on the iOS background queue. This caused `FigCaptureSourceRemote err=-17281` crashes when the native camera resources were released while the session was still winding down.

Fixed in v2.0.2 via [PR #16](https://github.com/nicksenger/capacitor-camera-view/pull/16) — added a completion callback to ensure the JS promise resolves only after the AVFoundation session has fully stopped.

---

## Step Management (Preventing Camera Restart)

The most subtle category of bugs involved the camera restarting unexpectedly after it should have been stopped.

### The Problem

`CameraWizard` starts the native camera on mount and stops it on unmount. If `step` is ever set back to `'wizard'` while the dialog is still open (even for a single React frame), `CameraWizard` re-mounts → `startCamera()` fires → camera starts → dialog closes → component unmounts → orphaned camera session.

### The Rules

1. **`resetDialog()` must NOT set step to `'wizard'`** — React may batch `setOpen(false)` and `setStep('wizard')` in one frame, briefly remounting the wizard.
2. **Set step to `'wizard'` only in `handleOpenChange(true)`** — the dialog open handler is the only safe place.
3. **Error handlers should go to `'review'`, not `'wizard'`** — if AI analysis fails, show the review step with manual entry, never re-mount the camera.
4. **Existing product found (barcode match) → close dialog entirely** — don't try to restart the wizard.
5. **`finishWizard` and `handleCancel` must `await stopCamera()`** — never fire-and-forget.

### Timeline of a Successful Flow

```
1. User taps "Add Product" (➕ tab)
2. handleOpenChange(true)
   → document.body.classList.add('camera-starting')
   → setStep('wizard')
   → setOpen(true)
3. CameraWizard mounts
   → startCamera() begins (async)
   → camera-starting → camera-running
4. User captures front photo (step 1)
5. User captures ingredients photo (step 2)
6. Barcode auto-detected (step 3) — or user taps "Skip"
7. finishWizard()
   → await stopCamera()  (120ms delay)
   → remove camera-running class
   → onComplete(captures)
8. handleWizardComplete(captures)
   → setStep('processing')
   → upload images, run AI, lookup barcode
   → setStep('review')
9. User reviews and submits
   → setStep('submitting')
   → create product in Convex
   → setOpen(false)
10. resetDialog()
    → step stays at 'submitting' (NOT 'wizard')
    → clean up state
```

---

## Common Issues & Debugging

### Camera Opens But Buttons Don't Work
**Cause**: `modal={true}` on Dialog → `inert` attribute on portal sibling.
**Fix**: Use `modal={false}` (or `modal={!isNative}`) on the Dialog.

### Camera Stays Open After Dialog Closes
**Cause**: `stopCamera()` not awaited — native preview layer still attached.
**Fix**: Make `finishWizard` and `handleCancel` async, `await stopCamera()`.

### Camera Restarts After Submitting Product
**Cause**: `resetDialog()` sets `setStep('wizard')` → CameraWizard briefly mounts during close transition.
**Fix**: Never set step to `'wizard'` in `resetDialog()`. Set it only in `handleOpenChange(true)`.

### White/Cream Flash When Camera Opens
**Cause**: App background (`#FAF8F5`) visible before WebView becomes transparent.
**Fix**: Two-phase startup — `camera-starting` (black) before dialog, `camera-running` (transparent) after camera starts.

### `FigCaptureSourceRemote err=-17281` Crash
**Cause**: `capacitor-camera-view` v2.0.0 bug — `stop()` resolves before session actually stops.
**Fix**: Update to v2.0.2+.

### Dialog Auto-Closes When Tapping Camera UI
**Cause**: Portal taps register as "interact outside" the DialogContent.
**Fix**: Add `onInteractOutside`, `onPointerDownOutside` handlers with `e.preventDefault()`.

### Scrollable Content Behind Camera Overlay
**Cause**: `modal={false}` disables Radix scroll lock.
**Fix**: Manual `document.body.style.overflow = 'hidden'` in useEffect.

---

## What NOT To Do

- ❌ Don't stop/restart the camera between captures — keep it running for all 3 steps
- ❌ Don't use `modal={true}` with portaled camera overlay — `inert` kills all buttons
- ❌ Don't use `capture()` for rapid multi-photo flows — use `captureSample()`
- ❌ Don't fire-and-forget `stopCamera()` — always `await` it
- ❌ Don't set step back to `'wizard'` in error handlers after camera was stopped
- ❌ Don't use `capacitor-camera-view` v2.0.0 or v2.0.1 — session stop bug causes crashes
- ❌ Don't try to switch `modal` prop while Radix Dialog is open — causes re-mount
- ❌ Don't portal camera UI inside the Dialog DOM tree — CSS transform clips it
- ❌ Don't skip the 120ms post-stop delay — UIKit cleanup is async

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `capacitor-camera-view` | ^2.0.2 | Native camera preview + barcode + capture |
| `@capacitor/core` | ^8.0.0 | Capacitor runtime |

---

## References

- [capacitor-camera-view repo](https://github.com/nicksenger/capacitor-camera-view)
- [PR #16 — stop session completion callback fix](https://github.com/nicksenger/capacitor-camera-view/pull/16)
- [Radix Dialog docs — modal prop](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix `inert` behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)

---

*Last updated: 2026-03-01*
