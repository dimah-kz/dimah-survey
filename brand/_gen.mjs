import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(
  "C:/Users/lotus/AppData/Local/Temp/dimah-brand-gen/package.json",
);
const opentype = require("opentype.js");
const { Resvg } = require("@resvg/resvg-js");

const fontFile = join(
  dirname(require.resolve("@fontsource/inter/package.json")),
  "files/inter-latin-600-normal.woff",
);
const font = opentype.parse(readFileSync(fontFile));

const out = "C:/GitHub/dimah-survey/brand";
const tile = "#009693";
const ink = "#0a0a0a";
const muted = "#737373";

function mark(x, y, size) {
  const scale = size / 16;
  return `<g transform="translate(${x} ${y}) scale(${scale}) translate(1.125 0)" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3.25h4.2a3.55 3.55 0 1 1 0 7.1H3v-7.1Z"/>
    <path d="M3 12.75h5.8"/>
  </g>`;
}

function iconSvg(size) {
  const markSize = Math.round(size * 0.62);
  const radius = Math.round(size * 0.25);
  const offset = (size - markSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${tile}"/>
  ${mark(offset, offset, markSize)}
</svg>`;
}

function layout(text, x, y, fontSize, fill) {
  const fontScale = fontSize / font.unitsPerEm;
  const letterSpacing = -0.02 * fontSize;
  const glyphs = [...text].map((char) => font.charToGlyph(char));
  const paths = [];
  let cursor = x;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const data = glyph.getPath(cursor, y, fontSize).toPathData(2);
    if (data) paths.push(`<path fill="${fill}" d="${data}"/>`);
    cursor += (glyph.advanceWidth || 0) * fontScale;
    if (i < glyphs.length - 1) {
      cursor += font.getKerningValue(glyph, glyphs[i + 1]) * fontScale;
      cursor += letterSpacing;
    }
  }

  return { svg: paths.join("\n"), end: cursor };
}

function logoSvg() {
  const tileSize = 96;
  const fontSize = 56;
  const gap = 40;
  const radius = 24;
  const markSize = 56;
  const markOffset = (tileSize - markSize) / 2;
  const scale = fontSize / font.unitsPerEm;
  const em = (font.ascender - font.descender) * scale;
  const baseline = (tileSize - em) / 2 + font.ascender * scale;
  const textX = tileSize + gap;
  const dimah = layout("dimah", textX, baseline, fontSize, ink);
  const bridge =
    font.getKerningValue(font.charToGlyph("h"), font.charToGlyph("-")) * scale -
    0.02 * fontSize;
  const survey = layout(
    "-survey",
    dimah.end + bridge,
    baseline,
    fontSize,
    muted,
  );
  const width = Math.ceil(survey.end);
  const height = tileSize;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${tileSize}" height="${tileSize}" rx="${radius}" fill="${tile}"/>
  ${mark(markOffset, markOffset, markSize)}
  ${dimah.svg}
  ${survey.svg}
</svg>`,
    width,
    height,
  };
}

function png(svg, height) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "height", value: height },
    background: "rgba(0,0,0,0)",
    shapeRendering: 2,
    textRendering: 1,
  });
  return resvg.render().asPng();
}

const icon = iconSvg(512);
const logo = logoSvg();

writeFileSync(join(out, "dimah-survey-icon.svg"), icon);
writeFileSync(join(out, "dimah-survey-logo.svg"), logo.svg);
writeFileSync(join(out, "dimah-survey-icon.png"), png(icon, 512));
writeFileSync(join(out, "dimah-survey-logo.png"), png(logo.svg, 512));

const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="${logo.width + 80}" height="${logo.height + 80}" viewBox="-40 -40 ${logo.width + 80} ${logo.height + 80}">
  <rect x="-40" y="-40" width="${logo.width + 80}" height="${logo.height + 80}" fill="#f5f5f5"/>
  ${logo.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
</svg>`;
writeFileSync(join(out, "_preview.png"), png(preview, 280));

console.log(
  "logo",
  logo.width,
  logo.height,
  "asc",
  font.ascender,
  "desc",
  font.descender,
  "upem",
  font.unitsPerEm,
);
