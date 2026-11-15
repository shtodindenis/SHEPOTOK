import type { CollectionState, DroppedItem } from '../stores/session.ts'

// Normalize optional, independently versioned save fields before restoring them.
const DROP_LOCATIONS = new Set(['home', 'village', 'hut', 'forest', 'river', 'society', 'society_village', 'mansion'])
const DROP_KINDS = new Set(['shovel', 'photo', 'treasure', 'rod', 'mansionRod'])
const FISH_KINDS = new Set(['crucian', 'perch', 'roach'])

export function normalizeCollection(collection: any, mushroomCount: number): CollectionState | null {
  if (!collection || !['witch', 'captain'].includes(collection.giver) || !Array.isArray(collection.collected)) return null
  const crucians = Math.max(0, Number(collection.crucians) || 0)
  return {
    ...collection,
    collected: [...new Set(collection.collected.filter((i: unknown): i is number => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < mushroomCount))].slice(0, 5),
    fish: Array.isArray(collection.fish)
      ? collection.fish.filter((kind: string) => FISH_KINDS.has(kind))
      : Array(Math.max(0, Math.min(3, Math.floor(crucians)))).fill('crucian'),
    basket: !!collection.basket,
    bucket: !!collection.bucket,
    arrested: !!collection.arrested,
    crucians,
  }
}

function validDrop(point: any): point is DroppedItem {
  return point && DROP_LOCATIONS.has(point.location) && Number.isFinite(point.x) && Number.isFinite(point.y)
}

export function normalizeDroppedItems(rag: unknown, items: unknown, societyVersion: unknown, societyEntry: { x: number; y: number }) {
  let droppedRag = validDrop(rag) ? { ...rag } : null
  // Clone points before migrating them: restoring must not mutate the source save.
  const droppedItems = Object.fromEntries(Object.entries((items && typeof items === 'object' ? items : {}) as Record<string, unknown>)
    .filter((entry): entry is [string, DroppedItem] => DROP_KINDS.has(entry[0]) && !!validDrop(entry[1]))
    .map(([kind, point]) => [kind, { ...point }]))
  if (societyVersion !== 1) {
    const move = (point: DroppedItem): DroppedItem => ({ ...point, x: societyEntry.x + 16, y: societyEntry.y })
    if (droppedRag?.location === 'society') droppedRag = move(droppedRag)
    for (const [kind, point] of Object.entries(droppedItems)) {
      if (point.location === 'society') droppedItems[kind] = move(point)
    }
  }
  return { droppedRag, droppedItems }
}
