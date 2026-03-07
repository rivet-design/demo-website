import opentype from 'opentype.js';

const font = opentype.loadSync('/tmp/goldman.ttf');
const fontSize = 36;
const x = 0;
const y = fontSize; // baseline

const path = font.getPath('rivet', x, y, fontSize);
const bbox = path.getBoundingBox();

const padding = 0;
const width = Math.ceil(bbox.x2 - bbox.x1 + padding * 2);
const height = Math.ceil(bbox.y2 - bbox.y1 + padding * 2);

// Shift path so it starts at (0,0)
const shiftedPath = font.getPath('rivet', -bbox.x1 + padding, -bbox.y1 + padding + fontSize - (fontSize - (bbox.y2 - bbox.y1)), fontSize);
const shiftedBbox = shiftedPath.getBoundingBox();

// Re-derive with proper y offset so glyphs sit flush to top
const offsetX = -bbox.x1 + padding;
const offsetY = -bbox.y1 + padding;
const finalPath = font.getPath('rivet', offsetX, offsetY + fontSize, fontSize);
const finalBbox = finalPath.getBoundingBox();
const finalWidth = Math.ceil(finalBbox.x2 + padding);
const finalHeight = Math.ceil(finalBbox.y2 + padding);

const svgPath = finalPath.toSVG(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">
  ${svgPath}
</svg>`;

console.log(svg);
