interface Point { x: number; y: number }
interface CameraScene { location: string; questState?: string }

// Camera coordinates are computed independently of Pixi so they can be
// checked against different viewport and map sizes.
const SCROLLING_LOCATIONS = new Set([
  'detention', 'society_village', 'society', 'river', 'forest',
  'mansion', 'village', 'home', 'hut',
])

export function cameraTransform(scene: CameraScene, mapWidth: number, mapHeight: number, screenWidth: number, screenHeight: number, player: Point) {
  const zoom = Math.max(scene.location === 'home' ? 1.15 : 1, screenWidth / mapWidth, screenHeight / mapHeight)
  const viewWidth = screenWidth / zoom
  const viewHeight = screenHeight / zoom
  const center = scene.location === 'society' && scene.questState === 'chairs' ? { x: 608, y: 128 } : player
  const scroll = SCROLLING_LOCATIONS.has(scene.location)
  const x = scroll ? Math.max(0, Math.min(mapWidth - viewWidth, center.x - viewWidth / 2)) : 0
  const y = scroll ? Math.max(0, Math.min(mapHeight - viewHeight, center.y - viewHeight / 2)) : 0
  return { zoom, x: -Math.round(x * zoom), y: -Math.round(y * zoom) }
}
