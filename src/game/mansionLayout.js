// One plan drives the artwork, collision, hiding places and patrol route.
export const MANSION_WIDTH = 768
export const MANSION_HEIGHT = 448
export const MANSION_ENTRY = { x: 45, y: 224 }
export const MANSION_CHAIR = { x: 700, y: 112 }
export const MANSION_WALLS = [
  { x: 0, y: 0, w: 768, h: 32 }, { x: 0, y: 432, w: 768, h: 16 },
  { x: 0, y: 32, w: 16, h: 400 }, { x: 752, y: 32, w: 16, h: 400 },
  ...[256, 512].flatMap(x => [{ x, y: 32, w: 16, h: 144 }, { x, y: 272, w: 16, h: 160 }]),
]
// Cabinets and tables leave an open central passage through all three rooms.
export const MANSION_FURNITURE = [
  { x: 48, y: 48, w: 80, h: 32, kind: 'cabinet' },
  { x: 176, y: 48, w: 48, h: 32, kind: 'cabinet' },
  { x: 80, y: 352, w: 80, h: 32, kind: 'table' },
  { x: 304, y: 48, w: 80, h: 32, kind: 'cabinet' },
  { x: 416, y: 48, w: 64, h: 32, kind: 'cabinet' },
  { x: 336, y: 352, w: 80, h: 32, kind: 'table' },
  { x: 560, y: 48, w: 64, h: 32, kind: 'cabinet' },
  { x: 656, y: 352, w: 64, h: 32, kind: 'table' },
]
// Dark alcoves sit next to walls and furniture, never in the lit passage.
export const SHADOWS = [
  { x: 32, y: 88, w: 96, h: 64 }, { x: 160, y: 288, w: 80, h: 64 },
  { x: 288, y: 88, w: 96, h: 64 }, { x: 400, y: 288, w: 96, h: 64 },
  { x: 544, y: 88, w: 96, h: 64 }, { x: 656, y: 288, w: 80, h: 64 },
]
export const PATROL_ROUTE = [
  { x: 352, y: 224 }, { x: 96, y: 224 }, { x: 352, y: 224 },
  { x: 672, y: 224 },
]
export function inMansionShadow(point) {
  return SHADOWS.some(s => point.x >= s.x && point.x < s.x + s.w && point.y >= s.y && point.y < s.y + s.h)
}
export function createMansionPatrol() { return { x: 352, y: 224, target: 1 } }
export function advanceMansionPatrol(patrol, delta, move) {
  const target = PATROL_ROUTE[patrol.target]
  const dx = target.x - patrol.x, dy = target.y - patrol.y, distance = Math.hypot(dx, dy)
  const step = Math.min(distance, Math.min(delta, 50) * 0.038)
  if (distance > 0) move(patrol, dx / distance * step, dy / distance * step)
  if (Math.hypot(target.x - patrol.x, target.y - patrol.y) < 1) patrol.target = (patrol.target + 1) % PATROL_ROUTE.length
}
