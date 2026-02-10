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
)

for plugin in "${PLUGINS[@]}"; do
  if [ -f "$plugin" ]; then
    sed -i '' "s/proguard-android\.txt/proguard-android-optimize.txt/g" "$plugin"
    echo "  ✓ Patched $plugin"
  fi
done

echo "✅ All Capacitor Android plugins patched"
