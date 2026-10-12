// Generates the wordmark SVG (text outlined) and all app icons from assets/logo.svg.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import png2icons from 'png2icons'
import opentype from 'opentype.js'

const logo = readFileSync('assets/logo.svg')
const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

mkdirSync('assets/icons', { recursive: true })
mkdirSync('build', { recursive: true })

for (const s of sizes) {
  await sharp(logo, { density: 384 }).resize(s, s).png().toFile(`assets/icons/${s}.png`)
}
const big = await sharp(logo, { density: 384 }).resize(1024, 1024).png().toBuffer()
writeFileSync('build/icon.png', big)
writeFileSync('build/icon.ico', png2icons.createICO(big, png2icons.BICUBIC, 0, false, true))
writeFileSync('build/icon.icns', png2icons.createICNS(big, png2icons.BICUBIC, 0))

// Wordmark: logo + "Drift" outlined from Readex Pro so no font install is needed to render it.
const font = opentype.parse(
  (() => {
    const b = readFileSync(
      'node_modules/@fontsource/readex-pro/files/readex-pro-latin-600-normal.woff'
    )
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  })()
)
const fontSize = 200
const path = font.getPath('Drift', 0, 0, fontSize)
const box = path.getBoundingBox()
const textX = 512 + 56
const textY = 256 - (box.y1 + box.y2) / 2
const d = font.getPath('Drift', textX - box.x1, textY, fontSize).toPathData(2)
const width = Math.round(textX + (box.x2 - box.x1) + 16)
const inner = logo.toString().replace(/<\/?svg[^>]*>/g, (m) => (m.startsWith('</') ? '' : ''))
writeFileSync(
  'assets/logo-wordmark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 512" height="512" role="img" aria-label="Drift">\n${inner}\n  <path d="${d}" fill="#0A3F43"/>\n</svg>\n`
)
console.log('assets built')
