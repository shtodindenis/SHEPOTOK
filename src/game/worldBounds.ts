export interface WorldBoundsScene { location: string; questState?: string; trip?: boolean; wolfDefeated?: boolean }
export interface WorldDimensions {
  settlementWidth: number; settlementHeight: number; societyWidth: number; societyHeight: number
  forestWidth: number; forestHeight: number; riverWidth: number; villageWidth: number; villageHeight: number
  detentionWidth: number; detentionHeight: number; mapWidth: number; mapHeight: number
}

// Keep movement limits independent from Pixi rendering and collision masks.
export function getWorldBounds(scene: WorldBoundsScene, dimensions: WorldDimensions) {
    const outside = scene.location === 'village' || scene.location === 'forest'
    if (scene.location === 'society_village') return { minX:10, maxX:dimensions.settlementWidth-10, minY:20, maxY:dimensions.settlementHeight-14 }
    if (scene.location === 'society' && scene.questState === 'chairs') return { minX:520, maxX:744, minY:40, maxY:214 }
    if (scene.location === 'society') return { minX:25, maxX:dimensions.societyWidth-25, minY:40, maxY:dimensions.societyHeight-18 }
    if (scene.location === 'forest') return { minX:10, maxX:scene.trip || scene.wolfDefeated ? dimensions.forestWidth-10 : 895, minY:35, maxY:dimensions.forestHeight-14 }
    if (scene.location === 'river') return { minX:10, maxX:dimensions.riverWidth-10, minY:20, maxY:255 }
    if (scene.location === 'village') return { minX:10, maxX:dimensions.villageWidth-10, minY:40, maxY:dimensions.villageHeight-14 }
    if (scene.location === 'hut') return { minX:16, maxX:304, minY:27, maxY:183 }
    if (scene.location === 'home') return { minX:25, maxX:487, minY:42, maxY:294 }
    if (scene.location === 'mansion') return { minX:25, maxX:dimensions.mapWidth-25, minY:35, maxY:dimensions.mapHeight-25 }
    if (scene.location === 'detention') return { minX:25, maxX:dimensions.detentionWidth-25, minY:30, maxY:dimensions.detentionHeight-22 }
    return { minX: outside ? 10 : 25, maxX: outside ? dimensions.mapWidth - 10 : 295, minY: scene.location === 'forest' ? 35 : outside ? 87 : 58, maxY: outside ? dimensions.mapHeight - 14 : 169 }
  }
