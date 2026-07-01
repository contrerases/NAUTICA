/**
 * Genera los assets del logo para la app a partir de la imagen original:
 *  - recorta el fondo (trim del crema) → el borde queda en el círculo,
 *  - recorta el cuadrado superior (deja fuera el texto/redes de abajo),
 *  - aplica máscara circular → transparente fuera del círculo,
 *  - produce resources/logo.png (transparente) y resources/icon.ico (multi-tamaño),
 *    y una copia del PNG en src/frontend/assets/logo.png para la UI.
 *
 * Uso:  node scripts/make-icon.mjs "<ruta-a-la-imagen>"
 */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('Falta la ruta de la imagen de origen.');
  process.exit(1);
}

fs.mkdirSync('resources', { recursive: true });
fs.mkdirSync('src/frontend/assets', { recursive: true });

// 1) Trim del fondo crema (uniforme). Queda el contenido: círculo + texto inferior.
const trimmed = await sharp(src).trim({ threshold: 20 }).png().toBuffer({ resolveWithObject: true });
const W = trimmed.info.width;
const H = trimmed.info.height;
// El círculo es el elemento más ancho y más alto arriba → su diámetro ≈ ancho recortado.
const D = Math.min(W, H, W); // diámetro = ancho del contenido recortado
console.log(`[icon] contenido recortado: ${W}x${H} → círculo D=${D}`);

// 2) Recorta el cuadrado superior D×D (bounding box del círculo, sin el texto de abajo).
const square = await sharp(trimmed.data)
  .extract({ left: 0, top: 0, width: D, height: Math.min(D, H) })
  .resize(D, D, { fit: 'cover', position: 'top' })
  .png()
  .toBuffer();

// 3) Máscara circular (un par de px hacia adentro para evitar restos del borde).
const r = Math.floor(D / 2) - 2;
const mask = Buffer.from(
  `<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${r}" fill="#fff"/></svg>`,
);
const logo = await sharp(square)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

fs.writeFileSync('resources/logo.png', logo);
// Copia liviana para la UI (se muestra a lo sumo ~112px): 256px comprimido.
const uiLogo = await sharp(logo)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();
fs.writeFileSync('src/frontend/assets/logo.png', uiLogo);
console.log(`[icon] resources/logo.png (${D}px) y src/frontend/assets/logo.png (256px, ${Math.round(uiLogo.length / 1024)}KB) escritos`);

// 4) .ico multi-tamaño para el instalador y la ventana.
const sizes = [256, 128, 64, 48, 32, 16];
const pngs = await Promise.all(
  sizes.map((s) => sharp(logo).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()),
);
const ico = await pngToIco(pngs);
fs.writeFileSync('resources/icon.ico', ico);
console.log('[icon] resources/icon.ico escrito (' + sizes.join(', ') + ')');
