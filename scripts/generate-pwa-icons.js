const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const faviconPath = path.join(__dirname, '..', 'app', 'favicon.ico');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
    try {
        // Read the favicon.ico file and create a canvas
        const image = await loadImage(faviconPath);

        // Generate 192x192 icon
        const canvas192 = createCanvas(192, 192);
        const ctx192 = canvas192.getContext('2d');
        ctx192.drawImage(image, 0, 0, 192, 192);

        const buffer192 = canvas192.toBuffer('image/png');
        fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), buffer192);
        console.log('✓ Generated icon-192x192.png');

        // Generate 512x512 icon
        const canvas512 = createCanvas(512, 512);
        const ctx512 = canvas512.getContext('2d');
        ctx512.drawImage(image, 0, 0, 512, 512);

        const buffer512 = canvas512.toBuffer('image/png');
        fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), buffer512);
        console.log('✓ Generated icon-512x512.png');

        console.log('\nPWA icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
