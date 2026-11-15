import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { drawPolice } from './police.ts'
import { drawRag } from './rag.ts'

export interface DynamicActor {
  id: string
  x: number
  y: number
  kind?: string
  col?: number
  facingLeft?: boolean
  targetX?: number
  targetY?: number
  progress?: number
  fromX?: number
  fromY?: number
  biting?: boolean
  time?: number
  alarm?: boolean
}
interface ActorAssets {
  furniture: Texture
  dungeon: Texture
  fishingRod: Texture
  tileTexture(source: Texture, col: number, row: number): Texture
}

// All temporary actors share one layer and are reconciled by stable IDs.
export function createDynamicActors({ furniture, dungeon, fishingRod, tileTexture }: ActorAssets) {
  let dynamicLayer: Container | null = null
  const dynamicItems = new Map<string, Container>()
  function reset(layer: Container) { dynamicLayer = layer; dynamicItems.clear() }
  function setActors(items: DynamicActor[]) {
    if (!dynamicLayer) return
    const ids = new Set(items.map(item => item.id))
    for (const [id, sprite] of dynamicItems) if (!ids.has(id)) { dynamicLayer.removeChild(sprite); sprite.destroy(); dynamicItems.delete(id) }
    for (const item of items) {
      let image: any = dynamicItems.get(item.id)
      if (item.kind === 'police') {
        if (!image) { image=drawPolice(); dynamicLayer.addChild(image); dynamicItems.set(item.id,image) }
        image.x=Math.round(item.x); image.y=Math.round(item.y); image.zIndex=item.y+4; image.scale.x=item.facingLeft ? -1 : 1; continue
      }
      if (item.kind === 'shovel-swing') {
        if (!image) { image=new Graphics(); dynamicLayer.addChild(image); dynamicItems.set(item.id,image) }
        const angle=Math.atan2(item.targetY!-item.y,item.targetX!-item.x)+(1-item.progress!)*1.5
        const dx=Math.cos(angle), dy=Math.sin(angle), endX=dx*29, endY=dy*29
        image.clear().moveTo(0,-4).lineTo(endX,endY-4).stroke({width:3,color:0xa87545})
          .poly([endX-dy*5,endY-4+dx*5,endX+dy*5,endY-4-dx*5,endX+dx*7+dy*4,endY-4+dy*7-dx*4,endX+dx*7-dy*4,endY-4+dy*7+dx*4]).fill(0xb6bcb0)
        image.x=item.x; image.y=item.y; image.zIndex=10000; continue
      }
      if (item.kind === 'guard-zone') {
        if (!image) { image=new Graphics(); dynamicLayer.addChild(image); dynamicItems.set(item.id,image) }
        image.clear().circle(0,0,22).fill({color:item.alarm ? 0xe75950 : 0xe9d58c,alpha:.16}).circle(0,0,22).stroke({width:1,color:item.alarm ? 0xec7b6a : 0xe9d58c,alpha:.35})
        image.x=Math.round(item.x); image.y=Math.round(item.y); image.zIndex=1; continue
      }
      if (item.kind === 'bobber') {
        if (!image) { image=new Graphics();dynamicLayer.addChild(image);dynamicItems.set(item.id,image) }
        image.clear().moveTo(item.fromX!-item.x,item.fromY!-item.y-8).lineTo(0,0).stroke({width:1,color:0xd8d4ad,alpha:.7})
        image.ellipse(0,2,5,2).stroke({width:1,color:0xb5e7dc,alpha:.6}).rect(-2,-5,4,7).fill(0xf0e7d1).rect(-2,-5,4,3).fill(0xd64c3c)
        image.x=item.x;image.y=item.y+(item.biting ? Math.sin(item.time!*.018)*3+4 : Math.sin(item.time!*.004));image.zIndex=900;continue
      }
      if (item.kind === 'rag') {
        if (!image) { image = drawRag(); dynamicLayer.addChild(image); dynamicItems.set(item.id, image) }
        image.x = Math.round(item.x); image.y = Math.round(item.y); image.zIndex = item.y; continue
      }
      if (item.kind?.startsWith('dropped-')) {
        if (!image) {
          image=['dropped-rod','dropped-mansionRod'].includes(item.kind) ? new Sprite(fishingRod) : new Graphics()
          if (['dropped-rod','dropped-mansionRod'].includes(item.kind)) { image.anchor.set(.5); image.width=20; image.height=20 }
          else if (item.kind === 'dropped-shovel') image.rect(-1,-10,3,12).fill(0xa97949).rect(-4,1,9,5).fill(0xa9afa3)
          else if (item.kind === 'dropped-photo') image.rect(-7,-5,14,10).fill(0xe8d7aa).rect(-4,-3,8,5).fill(0x829075)
          else image.rect(-6,-7,12,13).fill(0x789653).rect(-4,-9,8,4).fill(0xc7b48b)
          dynamicLayer.addChild(image); dynamicItems.set(item.id,image)
        }
        image.x=Math.round(item.x); image.y=Math.round(item.y); image.zIndex=item.y; continue
      }
      const source = item.kind === 'chair' || item.kind === 'treasure' ? furniture : dungeon
      const texture = tileTexture(source, item.kind === 'chair' ? 19 : item.kind === 'treasure' ? 13 : (item.col ?? 0), item.kind === 'chair' ? 2 : item.kind === 'treasure' ? 7 : 7)
      if (!image) { image = new Sprite(texture); image.anchor.set(.5, .75); dynamicLayer.addChild(image); dynamicItems.set(item.id, image) }
      image.texture = texture; image.x = Math.round(item.x); image.y = Math.round(item.y); image.zIndex = item.y + 4; image.scale.set(item.kind === 'chair' ? 1.1 : 1.25); image.tint = item.kind === 'chair' ? 0xff4444 : 0xffffff
    }
  }
  return { reset, setActors }
}
