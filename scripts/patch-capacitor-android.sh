#!/bin/bash
# Patch Capacitor Android plugins to use proguard-android-optimize.txt
# This is needed for Capacitor v8 plugins with Android Gradle Plugin 9.x+
# See: https://issuetracker.google.com/issues/388099711

set -e

echo "🔧 Patching Capacitor Android plugins for AGP 9.x compatibility..."

PLUGINS=(
  "node_modules/@capacitor/camera/android/build.gradle"
  "node_modules/@capacitor/geolocation/android/build.gradle"
  "node_modules/@capacitor/share/android/build.gradle"
  "node_modules/@capacitor/haptics/android/build.gradle"
  "node_modules/better-auth-capacitor/android/build.gradle"
  "node_modules/capacitor-camera-view/android/build.gradle"
)

# Detect OS for portable sed -i usage
# macOS sed requires -i '' (empty extension), Linux sed uses -i (no argument)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

for plugin in "${PLUGINS[@]}"; do
  if [ -f "$plugin" ]; then
    "${SED_INPLACE[@]}" "s/proguard-android\.txt/proguard-android-optimize.txt/g" "$plugin"
    echo "  ✓ Patched $plugin"
  fi
done

echo "✅ All Capacitor Android plugins patched"
