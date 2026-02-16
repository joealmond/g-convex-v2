# iOS Logging & Security Configuration

## Current Logging Issues

### 1. Verbose Capacitor Logs (⚡️)
The `⚡️ To Native`, `⚡️ TO JS` logs are controlled by Xcode's **build configuration**:
- **Debug builds** (running from Xcode) → verbose logs enabled
- **Release builds** (App Store/TestFlight) → logs automatically suppressed

### 2. Session Token Exposure
**SECURITY CONCERN:** Better-auth session tokens are visible in Debug logs:
```
{"__Secure-better-auth.session_token":{"value":"MzNZroRgwna..."}}
```

This is **normal for Debug builds** but tokens are:
- Only visible in Xcode console (not accessible to end users)
- Automatically suppressed in Release builds
- Not logged in production apps

## How to Disable Verbose Logs

### Option 1: Build for Release (Recommended for Testing)
In Xcode:
1. Click the scheme selector (next to play button)
2. Select **Edit Scheme...**
3. Under "Run" → Info tab
4. Change **Build Configuration** to `Release`
5. Click Close and run again

**Result:** No `⚡️` logs, no session tokens visible

### Option 2: Custom Build Setting (Keep Debug Features)
In Xcode:
1. Select **App** project → **App** target
2. Go to **Build Settings** tab
3. Search for `CAPACITOR_DEBUG`
4. Under Debug configuration, change value to `NO`

**Trade-off:** Loses other debug features (console.log, better error messages)

### Option 3: Archive Build
For final testing:
1. Product → Archive
2. Distribute → Development/Ad Hoc
3. Install on device via Xcode Devices

**Result:** Production-ready build with zero debug logs

## What You're Seeing Now (Debug Mode)

✅ **Safe to ignore:**
- `UIScene lifecycle` warning → Capacitor compatibility limitation (tracked in issue #7961)
- `sandbox extension` error → Normal iOS security behavior  
- `(Fig)` errors → Your terminal tool (not the app)
- `WebContent query parameters` → Minor WebKit info message

⚠️ **Verbose but intentional in Debug:**
- `⚡️` logs → Shows plugin communication, useful for debugging
- Better-auth session data → Helps debug auth flow issues
- Multiple Preferences calls → Better-auth checking cached session

## Recommendation

For daily development: **Keep Debug configuration** (current setup)
- Easier debugging
- See auth flow issues
- Console.log works
- Useful for fixing bugs

For final testing before release: **Use Release configuration**
- Clean logs
- Production-like behavior
- Performance testing
- Security validation

## Additional Security Notes

1. **Session tokens in logs are not a production risk** because:
   - Only visible in Xcode console during development
   - Stripped in Release builds
   - Not accessible to end users
   - Not logged to crash reporting systems

2. **Better-auth Preferences calls** are cached locally:
   - Stored in iOS Keychain (encrypted)
   - Not transmitted over network
   - Only logged during debug

3. **For production monitoring**, use dedicated tools:
   - Sentry (error tracking)
   - Firebase Analytics (user behavior)
   - Never log sensitive data in production code
