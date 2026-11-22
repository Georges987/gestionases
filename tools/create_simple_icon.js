const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Créer un PNG 256x256 avec un dégradé vert
const png = new PNG({ width: 256, height: 256 });

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    
    // Dégradé du vert foncé au vert clair
    const ratio = x / png.width;
    png.data[idx] = Math.floor(22 + ratio * 100);     // R
    png.data[idx + 1] = Math.floor(163 - ratio * 50); // G
    png.data[idx + 2] = Math.floor(74 + ratio * 50);  // B
    png.data[idx + 3] = 255; // Alpha
  }
}

const outputPath = path.resolve(__dirname, '../assets/icon.png');
png.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
  console.log('Icone PNG créée:', outputPath);
});
