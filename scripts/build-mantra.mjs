/**
 * THE MANTRA SHAPING PIPELINE  —  run by hand, output is committed.
 *
 *     node scripts/build-mantra.mjs
 *
 * WHY THIS EXISTS
 * ---------------
 * Devanagari cannot be turned into 3D text by any off-the-shelf three.js path.
 * `TextGeometry` + `FontLoader` and troika-three-text both map characters to
 * glyphs 1:1, but Devanagari needs *complex shaping*: conjunct formation,
 * matra reordering, and the shirorekha (the headline bar that joins letters).
 * Feed "ॐ गं गणपतये नमः" to either and you get mangled, wrong text.
 *
 * So the shaping happens here, once, with real HarfBuzz (WASM), and the result
 * is committed as a plain SVG of vector outlines. At runtime three's SVGLoader
 * turns those outlines into extruded 3D geometry.
 *
 * Two things fall out of this for free:
 *   1. No Devanagari webfont is loaded by the site at all — and with it goes
 *      the entire font-loading race.
 *   2. The text can never re-shape differently on a user's machine. What is
 *      verified here is exactly what ships.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as hb from 'harfbuzzjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(ROOT, 'scripts/.cache');
const FONT_PATH = resolve(CACHE, 'TiroDevanagariHindi-Regular.ttf');
const OUT_PATH = resolve(ROOT, 'public/mantra.svg');

// Pinned Google Fonts binary for Tiro Devanagari Hindi (OFL).
const FONT_URL =
  'https://fonts.gstatic.com/s/tirodevanagarihindi/v7/55xyezN7P8T4e0_CfIJrwdodg9HoYw0i-M9fSA.ttf';

const TEXT = 'ॐ गं गणपतये नमः';

/** Padding around the ink, in font units, so bevels never touch the viewBox edge. */
const PADDING = 60;

async function getFont() {
  if (!existsSync(FONT_PATH)) {
    await mkdir(CACHE, { recursive: true });
    console.log('· fetching font…');
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`font fetch failed: ${res.status}`);
    await writeFile(FONT_PATH, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(FONT_PATH);
}

/** Parse an SVG path `d` string and return its bounding box. */
function pathBounds(d) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Every command in HarfBuzz's output is absolute with plain numeric args, so
  // reading coordinate pairs off the number stream is sufficient for bounds.
  // Curve control points are included, which only ever over-estimates — safe
  // for a viewBox.
  const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

async function main() {
  const fontData = await getFont();

  const blob = new hb.Blob(fontData);
  const face = new hb.Face(blob);
  const font = new hb.Font(face);
  const upem = face.upem;

  const buffer = new hb.Buffer();
  buffer.addText(TEXT);
  // Let HarfBuzz detect script/direction/language from the text itself rather
  // than asserting them — it reads Devanagari correctly and this keeps the
  // script from being silently mis-tagged.
  buffer.guessSegmentProperties();

  hb.shape(font, buffer);

  const infos = buffer.getGlyphInfos();
  const positions = buffer.getGlyphPositions();

  console.log(`· shaped ${TEXT}`);
  console.log(`· ${[...TEXT].length} code points -> ${infos.length} glyphs`);
  console.log(`· upem=${upem}`);

  // Print the shaped run. `cluster` is the index of the source code point each
  // glyph came from — non-monotonic clusters are the fingerprint of correct
  // Devanagari reordering, so this line is worth reading, not just logging.
  console.log(
    '· glyphs: ' +
      infos
        .map((g, i) => `${g.codepoint}@c${g.cluster}+${positions[i].xAdvance}`)
        .join(' '),
  );

  // A .notdef glyph (id 0) means the font lacks a glyph the shaper asked for —
  // the text would render as tofu boxes. Never ship that.
  const missing = infos.filter((g) => g.codepoint === 0);
  if (missing.length) {
    throw new Error(`${missing.length} .notdef glyph(s) — font is missing coverage`);
  }

  // Walk the shaped run, placing each glyph outline at its shaped position.
  // HarfBuzz emits paths in font units with Y up; SVG is Y down, so the whole
  // run is flipped once at the end via a transform rather than per-glyph.
  const parts = [];
  let cursorX = 0;
  let cursorY = 0;

  for (let i = 0; i < infos.length; i++) {
    const { codepoint: glyphId } = infos[i];
    const { xAdvance, yAdvance, xOffset, yOffset } = positions[i];

    const d = font.glyphToPath(glyphId);
    if (d) {
      const x = cursorX + xOffset;
      const y = cursorY + yOffset;
      parts.push(
        x === 0 && y === 0
          ? `<path d="${d}"/>`
          : `<path d="${d}" transform="translate(${x} ${y})"/>`,
      );
    }

    cursorX += xAdvance;
    cursorY += yAdvance;
  }

  // Bounds of the whole run, in the Y-up font coordinate space.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  cursorX = 0;
  cursorY = 0;
  for (let i = 0; i < infos.length; i++) {
    const d = font.glyphToPath(infos[i].codepoint);
    if (d) {
      const b = pathBounds(d);
      if (Number.isFinite(b.minX)) {
        const ox = cursorX + positions[i].xOffset;
        const oy = cursorY + positions[i].yOffset;
        minX = Math.min(minX, b.minX + ox);
        maxX = Math.max(maxX, b.maxX + ox);
        minY = Math.min(minY, b.minY + oy);
        maxY = Math.max(maxY, b.maxY + oy);
      }
    }
    cursorX += positions[i].xAdvance;
    cursorY += positions[i].yAdvance;
  }

  const x0 = minX - PADDING;
  const y0 = minY - PADDING;
  const w = maxX - minX + PADDING * 2;
  const h = maxY - minY + PADDING * 2;

  // The group flips Y-up font space into Y-down SVG space, then shifts the ink
  // to the origin, so the exported viewBox starts at 0 0 and the runtime can
  // treat the asset as a plain rectangle.
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">`,
    `  <!-- GENERATED by scripts/build-mantra.mjs — do not edit by hand.`,
    `       "${TEXT}" shaped with HarfBuzz from Tiro Devanagari Hindi (OFL).`,
    `       Outlines only: no font is needed to render this. -->`,
    `  <g fill="#000" fill-rule="nonzero" transform="translate(${(-x0).toFixed(2)} ${(maxY + PADDING).toFixed(2)}) scale(1 -1)">`,
    ...parts.map((p) => `    ${p}`),
    `  </g>`,
    `</svg>`,
    '',
  ].join('\n');

  await writeFile(OUT_PATH, svg);

  console.log(`· ${parts.length} outlines`);
  console.log(`· viewBox 0 0 ${w.toFixed(0)} ${h.toFixed(0)} (aspect ${(w / h).toFixed(3)})`);
  console.log(`· wrote ${OUT_PATH.replace(ROOT + '/', '')}`);
}

main().catch((err) => {
  console.error('✗ build-mantra failed:', err);
  process.exit(1);
});
