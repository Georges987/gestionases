const path = require('path');
const fs = require('fs');
const imageToIco = require('image-to-ico');

async function main() {
  const input = path.resolve(__dirname, '../assets/icon.png');
  const output = path.resolve(__dirname, '../assets/icon.ico');
  
  try {
    if (!fs.existsSync(input)) {
      console.error('Erreur: assets/icon.png non trouvé');
      process.exit(1);
    }
    
    const icoBuffer = await imageToIco(input);
    fs.writeFileSync(output, icoBuffer);
    console.log('Icone Windows créée:', output);
  } catch (err) {
    console.error('Échec de la création de l\'ICO:', err);
    process.exit(1);
  }
}

main();
