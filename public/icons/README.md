# App Icons

## Current Status
Placeholder SVG icons are provided. These need to be converted to PNG format for production.

## Required Icons
- `icon-192.png` - 192x192px app icon
- `icon-512.png` - 512x512px app icon  
- `icon-maskable-512.png` - 512x512px maskable icon (with safe zone padding)

## Design Specs
- Background: Sage Green (#7CB342)
- Foreground: White letter "G"
- Font: Inter Bold
- Maskable icon: Keep the "G" centered with 20% padding from edges

## Converting SVG to PNG
Use an image editor or online tool:
1. Open `icon-192.svg` 
2. Export as PNG at 192x192px
3. Repeat for 512x512px sizes
4. For maskable icon, ensure the "G" is smaller with safe zone padding

## Quick Command (requires imagemagick)
```bash
# Install imagemagick if needed: brew install imagemagick
convert icon-192.svg -resize 192x192 icon-192.png
convert icon-192.svg -resize 512x512 icon-512.png
convert icon-192.svg -resize 512x512 icon-maskable-512.png
```
