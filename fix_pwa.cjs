// fix_pwa.cjs
const fs = require('fs');
const path = require('path');

console.log('Starting PWA asset generation...');

// 1. Copy screenshots
const artifactsDir = '/Users/mandulaj/.gemini/antigravity/brain/edf17397-0378-4afc-8cf2-1b990a17d62a';
const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

try {
  fs.copyFileSync(
    path.join(artifactsDir, 'gmatrix_screenshot_mobile_1771882308952.png'),
    path.join(screenshotsDir, 'mobile.png')
  );
  fs.copyFileSync(
    path.join(artifactsDir, 'gmatrix_screenshot_wide_1771882346320.png'),
    path.join(screenshotsDir, 'wide.png')
  );
  console.log('✅ Screenshots copied');
} catch (e) {
  console.log('⚠️ Could not copy screenshots (might not exist yet):', e.message);
}

// 2. Generate proper PNG icons directly from base64 (so we don't need any network/npm tools)
// This is a 1x1 transparent pixel just to satisfy the browser manifest temporarily.
// A real PNG icon should be added later, but this unblocks the PWA install testing immediately.
const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(dummyPngBase64, 'base64');

const iconsDir = path.join(__dirname, 'public', 'icons');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pngBuffer);

console.log('✅ Temporary PNG icons generated');
console.log('DONE!');
