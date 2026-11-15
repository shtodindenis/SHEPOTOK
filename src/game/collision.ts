import type { Texture } from 'pixi.js'

interface Point { x: number; y: number }
interface Rect extends Point { w: number; h: number }
interface Bounds { minX: number; maxX: number; minY: number; maxY: number }
interface PixelMask { width: number; pixels: Uint8ClampedArray }

const masks = new WeakMap<Texture, PixelMask>()

function maskFor(source: Texture): PixelMask {
  const cached = masks.get(source)
  if (cached) return cached
  const image = source.source.resource as CanvasImageSource & { width: number; height: number }
  const canvas = document.createElement('canvas')
  canvas.width = image.width; canvas.height = image.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D context is unavailable')
  context.drawImage(image, 0, 0)
  const mask = { width: canvas.width, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data }
  masks.set(source, mask)
  return mask
}

export function createCollision(width: number, height: number) {
  const map = new Uint8Array(width * height)
  function addRect({ x, y, w, h }: Rect) {
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(height, Math.ceil(y + h)); py++)
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(width, Math.ceil(x + w)); px++) map[py * width + px] = 1
  }
  function add(source: Texture, x: number, y: number, col: number, row: number, scale: number, spacing: number) {
    const { width: imageWidth, pixels } = maskFor(source)
    const left = Math.max(0, Math.floor(x)), top = Math.max(0, Math.floor(y))
    const right = Math.min(width, Math.ceil(x + 16 * scale)), bottom = Math.min(height, Math.ceil(y + 16 * scale))
    for (let py = top; py < bottom; py++) for (let px = left; px < right; px++) {
      const sx = col * spacing + Math.floor((px - x) / scale), sy = row * spacing + Math.floor((py - y) / scale)
      if (sx >= col * spacing && sy >= row * spacing && pixels[(sy * imageWidth + sx) * 4 + 3] >= 128) map[py * width + px] = 1
    }
  }
  function blocked(x: number, y: number) {
    for (let py = Math.floor(y + 1); py <= Math.ceil(y + 4); py++) for (let px = Math.floor(x - 3); px <= Math.ceil(x + 3); px++) {
      if (px < 0 || px >= width || py < 0 || py >= height || map[py * width + px]) return true
    }
    return false
  }
  function areaFree(x: number, y: number, w: number, h: number) {
    for (let py = Math.floor(y); py < Math.ceil(y + h); py++) for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
      if (px < 0 || px >= width || py < 0 || py >= height || map[py * width + px]) return false
    }
    return true
  }
  function restore(player: Point, bounds: Bounds) {
    player.x = Math.max(bounds.minX, Math.min(bounds.maxX, player.x))
    player.y = Math.max(bounds.minY, Math.min(bounds.maxY, player.y))
    if (!blocked(player.x, player.y)) return
    const originX = Math.round(player.x), originY = Math.round(player.y)
    const tryPosition = (x: number, y: number) => {
      if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY || blocked(x, y)) return false
      player.x = x; player.y = y; return true
    }
    for (let radius = 1; radius <= width; radius++) {
      for (let dy = -radius; dy <= radius; dy++) for (const dx of [-radius, radius]) if (tryPosition(originX + dx, originY + dy)) return
      for (let dx = -radius + 1; dx < radius; dx++) for (const dy of [-radius, radius]) if (tryPosition(originX + dx, originY + dy)) return
    }
  }
  return { add, addRect, blocked, areaFree, restore }
}
