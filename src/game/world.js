import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { VILLAGE_WIDTH, VILLAGE_HEIGHT, VILLAGE, buildVillage, addVillageSunlight } from './village.js'
import { HOME_WIDTH, HOME_HEIGHT, buildHome, addHomeLighting } from './home.js'
import { HUT_WIDTH, HUT_HEIGHT, HUT_SCALE, buildHut, addHutLighting } from './hut.js'
import { RIVER_WIDTH, RIVER_HEIGHT, buildRiver } from './river.js'
import { createCollision } from './collision.js'
import { buildScene } from './scenes.js'
import { MANSION_WIDTH, MANSION_HEIGHT, MANSION_WALLS, MANSION_FURNITURE, MANSION_CHAIR } from './mansionLayout.js'
import { FOREST_WIDTH, FOREST_HEIGHT, stashAt } from './forestMap.js'

const VIEW_WIDTH = 320, VIEW_HEIGHT = 192

export async function createWorld(host, onTick) {
  const app = new Application()
  await app.init({ width: VIEW_WIDTH, height: VIEW_HEIGHT, background: '#202520', antialias: false, preference: 'webgl', resolution: 1 })
  host.appendChild(app.canvas)
  const [sheet, dungeon, furniture, interior, bike, caves] = await Promise.all([
    Assets.load('/assets/kenney-tiny-town.png'), Assets.load('/assets/kenney-tiny-dungeon.png'), Assets.load('/assets/kenney-roguelike.png'), Assets.load('/assets/kenney-roguelike-indoor.png'), Assets.load('/assets/pitbike.png'), Assets.load('/assets/kenney-caves.png'),
  ])
  for (const texture of [sheet, dungeon, furniture, interior, bike, caves]) texture.source.scaleMode = 'nearest'
  const world = new Container(), textures = new WeakMap()
  world.sortableChildren = true
  app.stage.addChild(world)
  let scene = { location: 'home' }, mapWidth = VIEW_WIDTH, mapHeight = VIEW_HEIGHT, collision, actor, dynamicLayer, dynamicItems = new Map(), forestPhoto = '', runningTrees = []

  function tileTexture(source, col, row) {
    const spacing = source === furniture || source === interior || source === caves ? 17 : 16
    let cached = textures.get(source)
    if (!cached) { cached = new Map(); textures.set(source, cached) }
    const key = row * 1000 + col
    if (!cached.has(key)) cached.set(key, new Texture({ source: source.source, frame: new Rectangle(col * spacing, row * spacing, 16, 16) }))
    return cached.get(key)
  }
  function sprite(source, x, y, col, row, scale = 1, solid = true) {
    const spacing = source === furniture || source === interior || source === caves ? 17 : 16
    const item = new Sprite(tileTexture(source, col, row)); item.x = x; item.y = y; item.scale.set(scale); world.addChild(item)
    if (solid) { collision.add(source, x, y, col, row, scale, spacing); item.zIndex = y + 16 * scale }
    return item
  }
  // Multi-tile objects share one ground contact point and move as a single layer.
  function depthGroup(depth, drawObject) {
    const before = world.children.length
    drawObject()
    const parts = world.children.slice(before)
    const group = new Container()
    for (const part of parts) group.addChild(part)
    group.zIndex = depth
    world.addChild(group)
    return group
  }
  function character(x, y, witch = false) {
    const character = new Container(); character.x = x; character.y = y; character.zIndex = y + 4
    const texture = new Texture({ source: dungeon.source, frame: new Rectangle(witch ? 0 : 16, 112, 16, 16) })
    const figure = new Sprite(texture); figure.anchor.set(.5, .75); figure.scale.set(1.25); character.addChild(figure); world.addChild(character)
    if (witch) collision.add(dungeon, x - 10, y - 15, 0, 7, 1.25, 16)
    return character
  }
  function campTent(x, y) {
    const tent = new Graphics()
    tent.poly([x,y+34,x+25,y,x+52,y+34]).fill(0x8c694d)
    tent.poly([x+25,y,x+52,y+34,x+35,y+34]).fill(0x5c493c)
    tent.poly([x+16,y+34,x+26,y+12,x+35,y+34]).fill(0x302c29)
    tent.moveTo(x,y+34).lineTo(x+25,y).lineTo(x+52,y+34).stroke({width:2,color:0xc2a078})
    tent.zIndex = y + 35; world.addChild(tent)
    collision.addRect({x,y:y+20,w:52,h:15})
  }
  function bounds() {
    const outside = scene.location === 'village' || scene.location === 'forest'
    if (scene.location === 'forest') return { minX:10, maxX:scene.trip || scene.wolfDefeated ? FOREST_WIDTH-10 : 895, minY:35, maxY:FOREST_HEIGHT-14 }
    if (scene.location === 'river') return { minX:10, maxX:RIVER_WIDTH-10, minY:20, maxY:255 }
    if (scene.location === 'village') return { minX:10, maxX:VILLAGE_WIDTH-10, minY:40, maxY:VILLAGE_HEIGHT-14 }
    if (scene.location === 'hut') return { minX:16, maxX:304, minY:27, maxY:183 }
    if (scene.location === 'home') return { minX:25, maxX:487, minY:42, maxY:294 }
    if (scene.location === 'mansion') return { minX:25, maxX:mapWidth-25, minY:35, maxY:mapHeight-25 }
    return { minX: outside ? 10 : 25, maxX: outside ? mapWidth - 10 : 295, minY: scene.location === 'forest' ? 35 : outside ? 87 : 58, maxY: outside ? mapHeight - 14 : 169 }
  }
  function updateCamera(player) {
    const scroll = scene.location === 'river' || scene.location === 'forest' || scene.location === 'mansion' || scene.location === 'village' || scene.location === 'home' || scene.location === 'hut'
    const x = scroll ? Math.max(0, Math.min(mapWidth - VIEW_WIDTH, player.x - VIEW_WIDTH / 2)) : 0
    const y = scroll ? Math.max(0, Math.min(mapHeight - VIEW_HEIGHT, player.y - VIEW_HEIGHT / 2)) : 0
    world.position.set(-Math.round(x), -Math.round(y))
  }
  function draw(newScene, player) {
    scene = newScene
    mapWidth = scene.location === 'river' ? RIVER_WIDTH : scene.location === 'hut' ? HUT_WIDTH : scene.location === 'home' ? HOME_WIDTH : scene.location === 'forest' ? FOREST_WIDTH : scene.location === 'mansion' ? MANSION_WIDTH : scene.location === 'village' ? VILLAGE_WIDTH : VIEW_WIDTH
    mapHeight = scene.location === 'river' ? RIVER_HEIGHT : scene.location === 'hut' ? HUT_HEIGHT : scene.location === 'home' ? HOME_HEIGHT : scene.location === 'forest' ? FOREST_HEIGHT : scene.location === 'mansion' ? MANSION_HEIGHT : scene.location === 'village' ? VILLAGE_HEIGHT : VIEW_HEIGHT
    collision = createCollision(mapWidth, mapHeight)
    runningTrees = []
    for (const child of world.removeChildren()) child.destroy({ children: true })
    if (scene.location === 'river') buildRiver({world,sprite,sheet,dungeon,collision,depthGroup,scene})
    else if (scene.location === 'village') buildVillage({world, sprite, sheet, dungeon, collision, depthGroup, bike, scene})
    else if (scene.location === 'hut') {
      const room = new Container(); room.scale.set(HUT_SCALE); room.sortableChildren = true; world.addChild(room)
      const hutSprite = (...args) => { const item = sprite(...args); room.addChild(item); return item }
      const hutCollision = { addRect: ({x,y,w,h}) => collision.addRect({x:x*HUT_SCALE,y:y*HUT_SCALE,w:w*HUT_SCALE,h:h*HUT_SCALE}) }
      const hutCharacter = (x,y,witch) => character(x*HUT_SCALE,y*HUT_SCALE,witch)
      buildHut({ world:room, sprite:hutSprite, interior, furniture, dungeon, sheet, caves, collision:hutCollision, scene, character:hutCharacter })
    }
    else if (scene.location === 'home') buildHome({ world, sprite, interior, furniture, dungeon, collision, scene, depthGroup })
    else buildScene({ world, collision, sprite, character, campTent, depthGroup, scene, sheet, dungeon, furniture, mapWidth, mapHeight })
    if (scene.location === 'mansion') {
      for (const rect of [...MANSION_WALLS, ...MANSION_FURNITURE]) collision.addRect(rect)
      if (!scene.carriedChair) collision.addRect({ x:MANSION_CHAIR.x-8, y:MANSION_CHAIR.y-24, w:16, h:16 })
    }
    if (scene.location === 'forest') {
      const stash=stashAt(scene.stashIndex)
      const photo = app.renderer.extract.canvas({ target:world, frame:new Rectangle(stash.x-96, stash.y-64, 192, 128) })
      forestPhoto = photo.toDataURL('image/png')
    }
    collision.restore(player, bounds())
    actor = character(player.x, player.y)
    if (scene.location === 'forest' && scene.trip) {
      for (let i=0;i<3;i++) {
        const runner=new Container(), body=new Container(), legs=new Graphics()
        for (let row=0;row<2;row++) { const part=new Sprite(tileTexture(sheet, i===1?3:4, row)); part.x=-8; part.y=-32+row*16; body.addChild(part) }
        body.scale.set(1.7); runner.addChild(legs,body); world.addChild(runner)
        runningTrees.push({runner,body,legs,index:i})
      }
    }
    dynamicLayer = world; dynamicItems = new Map()
    if (scene.location === 'home') addHomeLighting(world, actor)
    if (scene.location === 'hut') { const lighting = new Container(); lighting.scale.set(HUT_SCALE); lighting.sortableChildren = true; lighting.zIndex = 100000; world.addChild(lighting); addHutLighting(lighting) }
    if (scene.location === 'village') addVillageSunlight(world)
    updateCamera(player)
  }
  function setActors(items) {
    if (!dynamicLayer) return
    const ids = new Set(items.map(item => item.id))
    for (const [id, sprite] of dynamicItems) if (!ids.has(id)) { dynamicLayer.removeChild(sprite); sprite.destroy(); dynamicItems.delete(id) }
    for (const item of items) {
      let image = dynamicItems.get(item.id)
      if (item.kind === 'bobber') {
        if (!image) { image=new Graphics();dynamicLayer.addChild(image);dynamicItems.set(item.id,image) }
        image.clear().moveTo(item.fromX-item.x,item.fromY-item.y-8).lineTo(0,0).stroke({width:1,color:0xd8d4ad,alpha:.7})
        image.ellipse(0,2,5,2).stroke({width:1,color:0xb5e7dc,alpha:.6}).rect(-2,-5,4,7).fill(0xf0e7d1).rect(-2,-5,4,3).fill(0xd64c3c)
        image.x=item.x;image.y=item.y+(item.biting ? Math.sin(item.time*.018)*3+4 : Math.sin(item.time*.004));image.zIndex=900;continue
      }
      if (item.kind === 'rag') {
        if (!image) { image = new Graphics().rect(-6, -4, 12, 8).fill(0x8aa9a0).rect(-5, -4, 10, 5).fill(0xd0e0d2).rect(-4, -3, 6, 1).fill(0xf2f0da); dynamicLayer.addChild(image); dynamicItems.set(item.id, image) }
        image.x = Math.round(item.x); image.y = Math.round(item.y); image.zIndex = item.y; continue
      }
      if (item.kind?.startsWith('dropped-')) {
        if (!image) {
          image=new Graphics()
          if (item.kind === 'dropped-rod') image.moveTo(-8,5).lineTo(8,-8).stroke({width:2,color:0x8d603c})
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
  function findDrop(point) {
    const limits = bounds()
    const valid = (x, y) => x >= limits.minX && x <= limits.maxX && y >= limits.minY && y <= limits.maxY && collision.areaFree(x - 6, y - 4, 12, 8)
    const x = Math.round(point.x), y = Math.round(point.y)
    if (valid(x, y)) return { x, y }
    for (let radius = 1; radius <= 64; radius++) {
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === radius && valid(x + dx, y + dy)) return { x: x + dx, y: y + dy }
      }
    }
    return null
  }
  function movePoint(player, dx, dy) {
    const { minX, maxX, minY, maxY } = bounds()
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))))
    for (let step = 0; step < steps; step++) {
      const nextX = Math.max(minX, Math.min(maxX, player.x + dx / steps))
      const nextY = Math.max(minY, Math.min(maxY, player.y + dy / steps))
      if (!collision.blocked(nextX, player.y)) player.x = nextX
      if (!collision.blocked(player.x, nextY)) player.y = nextY
    }
  }
  function move(player, dx, dy, elapsed, facingLeft) {
    movePoint(player, dx, dy)
    actor.x = Math.round(player.x); actor.y = Math.round(player.y + ((dx || dy) ? Math.sin(elapsed * .22) : 0)); actor.scale.x = facingLeft ? -1 : 1; actor.zIndex = player.y + 4
    if (scene.location === 'forest' && scene.trip) for (const {runner,body,legs,index} of runningTrees) {
      const phase=(elapsed*.0038+index/3)%1, stride=Math.sin(elapsed*.24+index*2)
      runner.x=player.x+[-95,30,112][index]+Math.sin(elapsed*.012+index)*12
      runner.y=player.y-150+phase*300
      runner.zIndex=runner.y+1; runner.alpha=Math.min(1,phase*8,(1-phase)*8)
      body.rotation=stride*.09; body.y=-Math.abs(stride)*4
      legs.clear().moveTo(-4,-2).lineTo(-7+stride*8,9).moveTo(4,-2).lineTo(7-stride*8,9).stroke({width:4,color:0x634a32,cap:'round'})
    }
    updateCamera(player)
  }
  function setFishingPose(sitting) { if (!actor || actor.scale.y === (sitting ? .75 : 1)) return; actor.scale.y=sitting ? .75 : 1; actor.y=Math.round((actor.zIndex-4) + (sitting ? 3 : 0)) }
  function dive(start, progress) {
    if (!actor) return
    actor.x = Math.round(start.x + (VILLAGE.well.x - start.x) * progress)
    actor.y = Math.round(start.y + (VILLAGE.well.y - start.y) * progress)
    actor.zIndex = actor.y + 4
    actor.scale.set(1 - progress * .95)
    if (progress >= 1) actor.visible = false
  }
  function canSee(from, to) {
    const distance = Math.hypot(to.x-from.x, to.y-from.y)
    const steps = Math.ceil(distance / 4)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      if (collision.blocked(from.x + (to.x-from.x)*t, from.y + (to.y-from.y)*t)) return false
    }
    return true
  }
  app.ticker.add(onTick)
  return { draw, move, movePoint, canSee, dive, setActors, setFishingPose, findDrop, forestPhoto: () => forestPhoto, destroy() { app.ticker.remove(onTick); app.destroy(true, { children: true }) } }
}
