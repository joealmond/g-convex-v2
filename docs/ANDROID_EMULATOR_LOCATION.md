# Android Emulator Location Testing

## Setting Mock Location

### Method 1: Extended Controls (Recommended)
1. In the running emulator, click the **"..."** button (More) on the right sidebar
2. Select **Location** from the menu
3. Enter coordinates manually:
   - **Budapest, Hungary**: `47.4979, 19.0402`
   - **Biatorbágy, Hungary**: `47.4725, 18.8178`
   - **Vienna, Austria**: `48.2082, 16.3738`
4. Click **Send** to update the emulator's GPS

### Method 2: Command Line (via adb)
```bash
# Budapest
adb emu geo fix 19.0402 47.4979

# Biatorbágy
adb emu geo fix 18.8178 47.4725

# Or use telnet
telnet localhost 5554
geo fix 19.0402 47.4979
```

### Method 3: Routes (for testing movement)
1. Open Extended Controls → Location
2. Switch to **Routes** tab
3. Load a GPX/KML file or use the map to create a route
4. Click **Play Route** to simulate movement

## Testing Location Features in G-Matrix

### After Setting Mock Location:
1. Open the G-Matrix app
2. Go to **Map** tab (bottom navigation)
3. The map should center on your mock location
4. Try the **"Nearby"** filter on the Home feed
5. When voting, your GPS coordinates should be captured

### Permissions
If prompted, grant location permissions:
- **Allow only while using the app** (recommended for testing)
- Or **Allow all the time** (for background location features)

## Physical Device Testing

For real GPS testing:
1. Connect your Android phone via USB
2. Enable **Developer Options** and **USB Debugging** on the phone
3. In Android Studio, select your physical device from the device dropdown
4. Click Run (green ▶️)

The app will install and run with real GPS data from your phone.

## Troubleshooting

### Location not updating in app?
- Check if location permission was granted (Settings → Apps → G-Matrix → Permissions)
- Try closing and reopening the app after setting mock location
- Open a native maps app (Google Maps) to verify the emulator's GPS is working

### "Location unavailable" in features?
- Some emulators have GPS disabled by default
- Verify the emulator AVD has GPS enabled: AVD Manager → Edit → Show Advanced Settings → Enable GPS

### For development without location:
The app gracefully handles missing GPS:
- **Nearby filter** auto-falls back to "Recent" feed
- **Map view** shows all products (no centering)
- **Voting** works without GPS (coordinates saved as null)
