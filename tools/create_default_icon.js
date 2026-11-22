const fs = require('fs');
const path = require('path');

// Créer une icône PNG minimale (1x1 pixel vert, juste pour avoir un fichier valide)
// En réalité, on crée un PNG valide de 256x256 avec un dégradé vert
const { createCanvas } = require('canvas');

async function createIcon() {
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // Dégradé vert
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#16a34a');
    gradient.addColorStop(1, '#15803d');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Ajouter un symbole cœur ou ONG
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ONG', 128, 128);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.resolve(__dirname, '../assets/icon.png'), buffer);
    console.log('Icone PNG créée: assets/icon.png');
  } catch (err) {
    // Fallback: créer un PNG minimal valide
    console.log('Canvas non disponible, création PNG minimal...');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAADh0RVh0U29mdHdhcmUAbWF0cGxvdGxpYiB2ZXJzaW9uMy4xLjIsIGh0dHA6Ly9tYXRwbG90bGliLm9yZy8li6FKAAAALklEQVR4nO3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8G0sYAAFgd6hUAAAAAElFTkSuQmCC';
    fs.writeFileSync(path.resolve(__dirname, '../assets/icon.png'), Buffer.from(pngBase64, 'base64'));
    console.log('Icone PNG minimale créée');
  }
}

createIcon();
