# PWA Required Assets

The Progressive Web App (PWA) manifest requires `.png` images to be installable and to pass the browser's Lighthouse audits.

Below are the absolute paths to the AI-generated PNG icons and screenshots. You can copy these files into your `public/` directory manually (e.g., via Finder or Explorer) to resolve the `manifest.json` errors.

### Icons
Place these inside `public/icons/`:
- **192x192 Icon**: `/Users/mandulaj/.gemini/antigravity/brain/edf17397-0378-4afc-8cf2-1b990a17d62a/gmatrix_icon_192_1771885226921.png`
  - *Rename to:* `icon-192.png`
- **512x512 Icon**: `/Users/mandulaj/.gemini/antigravity/brain/edf17397-0378-4afc-8cf2-1b990a17d62a/gmatrix_icon_512_1771882290749.png`
  - *Rename to:* `icon-512.png`
  - *Note:* Also make a duplicate of this file named `icon-maskable-512.png`

### Screenshots
Create a new folder `public/screenshots/` and place these inside:
- **Mobile Screenshot (Narrow)**: `/Users/mandulaj/.gemini/antigravity/brain/edf17397-0378-4afc-8cf2-1b990a17d62a/gmatrix_screenshot_mobile_1771882308952.png`
  - *Rename to:* `mobile.png`
- **Desktop Screenshot (Wide)**: `/Users/mandulaj/.gemini/antigravity/brain/edf17397-0378-4afc-8cf2-1b990a17d62a/gmatrix_screenshot_wide_1771882346320.png`
  - *Rename to:* `wide.png`

---
Once you've copied these 4 files into their respective folders, the Chrome errors will instantly disappear and the PWA richer install prompt will work!
