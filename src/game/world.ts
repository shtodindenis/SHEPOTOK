import { Assets, Container, Graphics, Rectangle, Sprite, Texture, type Ticker } from 'pixi.js'
import { VILLAGE_WIDTH, VILLAGE_HEIGHT, VILLAGE, buildVillage, addVillageSunlight } from './village.ts'
import { HOME_WIDTH, HOME_HEIGHT, buildHome, addHomeLighting } from './home.ts'
import { HUT_WIDTH, HUT_HEIGHT, HUT_SCALE, buildHut, addHutLighting } from './hut.ts'
import { RIVER_WIDTH, RIVER_HEIGHT, buildRiver } from './river.ts'
import { SOCIETY_WIDTH, SOCIETY_HEIGHT, SETTLEMENT_WIDTH, SETTLEMENT_HEIGHT, buildSettlement, buildSocietyHouse, addSocietyLighting } from './societyLocation.ts'
import { createCollision } from './collision.ts'
import { buildScene } from './scenes.ts'
import { MANSION_WIDTH, MANSION_HEIGHT, MANSION_WALLS, MANSION_FURNITURE, MANSION_DETAIL_COLLISIONS } from './mansionLayout.ts'
import { buildMansion, addMansionLighting } from './mansion.ts'
import { FOREST_WIDTH, FOREST_HEIGHT, stashAt } from './forestMap.ts'
import { DETENTION_WIDTH, DETENTION_HEIGHT, buildDetention } from './detention.ts'
import { createDynamicActors } from './dynamicActors.ts'
import { cameraTransform } from './camera.ts'
import { getWorldBounds } from './worldBounds.ts'
import { initializeRenderer } from './rendererInitialization.ts'
import type { Point } from './forestMap.ts'
import type { WorldBoundsScene } from './worldBounds.ts'

const VIEW_WIDTH = 320, VIEW_HEIGHT = 192
const SCENE_SIZES: Record<string, [number, number]> = {
  detention: [DETENTION_WIDTH, DETENTION_HEIGHT],
  society_village: [SETTLEMENT_WIDTH, SETTLEMENT_HEIGHT],
  society: [SOCIETY_WIDTH, SOCIETY_HEIGHT],
  river: [RIVER_WIDTH, RIVER_HEIGHT],
  hut: [HUT_WIDTH, HUT_HEIGHT],
  home: [HOME_WIDTH, HOME_HEIGHT],
  forest: [FOREST_WIDTH, FOREST_HEIGHT],
  mansion: [MANSION_WIDTH, MANSION_HEIGHT],
  village: [VILLAGE_WIDTH, VILLAGE_HEIGHT],
}

export async function createWorld(host: HTMLElement, onTick: (ticker: Ticker) => void) {
  const viewportWidth = () => Math.max(1, Math.round(VIEW_HEIGHT * (host.clientWidth || VIEW_WIDTH) / (host.clientHeight || VIEW_HEIGHT)))
  const app = await initializeRenderer({ width: viewportWidth(), height: VIEW_HEIGHT, background: '#202520', antialias: false, powerPreference: 'high-performance', resolution: 1 })
  app.ticker.maxFPS = 0
  host.appendChild(app.canvas)
  let texturesLoaded
  try {
    texturesLoaded = await Promise.all([
      Assets.load('/assets/kenney-tiny-town.png'), Assets.load('/assets/kenney-tiny-dungeon.png'), Assets.load('/assets/kenney-roguelike.png'), Assets.load('/assets/kenney-roguelike-indoor.png'), Assets.load('/assets/pitbike.png'), Assets.load('/assets/kenney-caves.png'), Assets.load('/assets/river-boat.png'), Assets.load('/assets/fishing-rod.png'), Assets.load('/assets/mansion-ritpop.png'), Assets.load('/assets/home-metrocity.png'),
    ])
  } catch (error) {
    // The canvas and renderer already exist when an asset fails to load.
    app.destroy(true, { children: true })
    throw error
  }
  const [sheet, dungeon, furniture, interior, bike, caves, riverBoat, fishingRod, mansionDecor, homeDecor] = texturesLoaded
  for (const texture of [sheet, dungeon, furniture, interior, bike, caves, riverBoat, fishingRod, mansionDecor, homeDecor]) texture.source.scaleMode = 'nearest'
  const world = new Container(), textures = new WeakMap<Texture, Map<number, Texture>>()
  world.sortableChildren = true
  app.stage.addChild(world)
  let scene: WorldBoundsScene & Record<string, any> = { location: 'home' }, mapWidth = VIEW_WIDTH, mapHeight = VIEW_HEIGHT
  let collision: ReturnType<typeof createCollision>, actor: Container, forestPhoto = ''
  let runningTrees: { runner: Container; body: Container; legs: Graphics; index: number }[] = []

  function tileTexture(source: Texture, col: number, row: number) {
    const spacing = source === furniture || source === interior || source === caves ? 17 : 16
    let cached = textures.get(source)
    if (!cached) { cached = new Map(); textures.set(source, cached) }
    const key = row * 1000 + col
    if (!cached.has(key)) cached.set(key, new Texture({ source: source.source, frame: new Rectangle(col * spacing, row * spacing, 16, 16) }))
    return cached.get(key)!
  }
  const dynamicActors = createDynamicActors({ furniture, dungeon, fishingRod, tileTexture })
  function sprite(source: Texture, x: number, y: number, col: number, row: number, scale = 1, solid = true) {
    const spacing = source === furniture || source === interior || source === caves ? 17 : 16
    const item = new Sprite(tileTexture(source, col, row)); item.x = x; item.y = y; item.scale.set(scale); world.addChild(item)
    if (solid) { collision.add(source, x, y, col, row, scale, spacing); item.zIndex = y + 16 * scale }
    return item
  }
  // Multi-tile objects share one ground contact point and move as a single layer.
  function depthGroup(depth: number, drawObject: () => void) {
    const before = world.children.length
    drawObject()
    const parts = world.children.slice(before)
    const group = new Container()
    for (const part of parts) group.addChild(part)
    group.zIndex = depth
    world.addChild(group)
    return group
  }
  function character(x: number, y: number, witch = false) {
    const character = new Container(); character.x = x; character.y = y; character.zIndex = y + 4
    const texture = new Texture({ source: dungeon.source, frame: new Rectangle(witch ? 0 : 16, 112, 16, 16) })
    const figure = new Sprite(texture); figure.anchor.set(.5, .75); figure.scale.set(1.25); character.addChild(figure); world.addChild(character)
    if (witch) collision.add(dungeon, x - 10, y - 15, 0, 7, 1.25, 16)
    return character
  }
  function campTent(x: number, y: number) {
    const tent = new Graphics()
    tent.poly([x,y+34,x+25,y,x+52,y+34]).fill(0x8c694d)
    tent.poly([x+25,y,x+52,y+34,x+35,y+34]).fill(0x5c493c)
    tent.poly([x+16,y+34,x+26,y+12,x+35,y+34]).fill(0x302c29)
    tent.moveTo(x,y+34).lineTo(x+25,y).lineTo(x+52,y+34).stroke({width:2,color:0xc2a078})
    tent.zIndex = y + 35; world.addChild(tent)
    collision.addRect({x,y:y+20,w:52,h:15})
  }
  function bounds() {
    return getWorldBounds(scene, {
      settlementWidth: SETTLEMENT_WIDTH, settlementHeight: SETTLEMENT_HEIGHT,
      societyWidth: SOCIETY_WIDTH, societyHeight: SOCIETY_HEIGHT,
      forestWidth: FOREST_WIDTH, forestHeight: FOREST_HEIGHT, riverWidth: RIVER_WIDTH,
      villageWidth: VILLAGE_WIDTH, villageHeight: VILLAGE_HEIGHT,
      detentionWidth: DETENTION_WIDTH, detentionHeight: DETENTION_HEIGHT, mapWidth, mapHeight,
    })
  }
  function updateCamera(player: Point) {
    const camera = cameraTransform(scene, mapWidth, mapHeight, app.screen.width, app.screen.height, player)
    world.scale.set(camera.zoom)
    world.position.set(camera.x, camera.y)
  }
  function draw(newScene: WorldBoundsScene & Record<string, any>, player: Point) {
    scene = newScene
    world.scale.set(scene.location === 'home' ? 1.15 : 1)
    ;[mapWidth, mapHeight] = SCENE_SIZES[scene.location] || [VIEW_WIDTH, VIEW_HEIGHT]
    collision = createCollision(mapWidth, mapHeight)
    runningTrees = []
    for (const child of world.removeChildren()) child.destroy({ children: true })
    if (scene.location === 'detention') buildDetention({world,collision,sprite,dungeon,scene})
    else if (scene.location === 'society_village') buildSettlement({world,sprite,sheet,collision,depthGroup})
    else if (scene.location === 'society') buildSocietyHouse({world,sprite,interior,furniture,dungeon,collision,depthGroup,scene})
    else if (scene.location === 'river') buildRiver({world,sprite,sheet,dungeon,collision,depthGroup,scene,riverBoat,fishingRod})
    else if (scene.location === 'village') buildVillage({world, sprite, sheet, dungeon, collision, depthGroup, bike, scene})
    else if (scene.location === 'hut') {
      const room = new Container(); room.scale.set(HUT_SCALE); room.sortableChildren = true; world.addChild(room)
      const hutSprite: typeof sprite = (...args) => { const item = sprite(...args); room.addChild(item); return item }
      const hutCollision = { addRect: ({x,y,w,h}: {x: number; y: number; w: number; h: number}) => collision.addRect({x:x*HUT_SCALE,y:y*HUT_SCALE,w:w*HUT_SCALE,h:h*HUT_SCALE}) }
      const hutCharacter = (x: number, y: number, witch: boolean) => character(x*HUT_SCALE,y*HUT_SCALE,witch)
      buildHut({ world:room, sprite:hutSprite, interior, furniture, dungeon, sheet, caves, collision:hutCollision, scene, character:hutCharacter })
    }
    else if (scene.location === 'mansion') {
      buildMansion({world,sprite,furniture,interior,mansionDecor})
      if (!scene.mansionRodTaken) { const rod = new Sprite(fishingRod); rod.x=103; rod.y=309; rod.width=24; rod.height=24; rod.zIndex=334; world.addChild(rod) }
    }
    else if (scene.location === 'home') buildHome({ world, sprite, interior, furniture, dungeon, collision, scene, depthGroup, homeDecor })
    else buildScene({ world, collision, sprite, character, campTent, depthGroup, scene, sheet, dungeon, furniture, mapWidth, mapHeight })
    if (scene.location === 'mansion') {
      for (const rect of [...MANSION_WALLS, ...MANSION_FURNITURE, ...MANSION_DETAIL_COLLISIONS]) collision.addRect(rect)
    }
    if (scene.location === 'forest') {
      const stash=stashAt(scene.stashIndex)
      const photo = app.renderer.extract.canvas({ target:world, frame:new Rectangle(stash.x-96, stash.y-64, 192, 128) })
      forestPhoto = (photo as HTMLCanvasElement).toDataURL('image/png')
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
    dynamicActors.reset(world)
    if (scene.location === 'home') addHomeLighting(world)
    if (scene.location === 'society') addSocietyLighting(world)
    if (scene.location === 'society_village') { const sun = new Graphics().rect(0,0,SETTLEMENT_WIDTH,SETTLEMENT_HEIGHT).fill({color:0xffe3ad,alpha:.07}); sun.zIndex=100000; world.addChild(sun) }
    if (scene.location === 'hut') { const lighting = new Container(); lighting.scale.set(HUT_SCALE); lighting.sortableChildren = true; lighting.zIndex = 100000; world.addChild(lighting); addHutLighting(lighting) }
    if (scene.location === 'village') addVillageSunlight(world)
    if (scene.location === 'mansion') addMansionLighting(world)
    updateCamera(player)
  }
  function findDrop(point: Point) {
    const limits = bounds()
    const valid = (x: number, y: number) => x >= limits.minX && x <= limits.maxX && y >= limits.minY && y <= limits.maxY && collision.areaFree(x - 6, y - 4, 12, 8)
    const x = Math.round(point.x), y = Math.round(point.y)
    if (valid(x, y)) return { x, y }
    for (let radius = 1; radius <= 64; radius++) {
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === radius && valid(x + dx, y + dy)) return { x: x + dx, y: y + dy }
      }
    }
    return null
  }
  function movePoint(player: Point, dx: number, dy: number) {
    const { minX, maxX, minY, maxY } = bounds()
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))))
    for (let step = 0; step < steps; step++) {
      const nextX = Math.max(minX, Math.min(maxX, player.x + dx / steps))
      const nextY = Math.max(minY, Math.min(maxY, player.y + dy / steps))
      if (!collision.blocked(nextX, player.y)) player.x = nextX
      if (!collision.blocked(player.x, nextY)) player.y = nextY
    }
  }
  function move(player: Point, dx: number, dy: number, elapsed: number, facingLeft: boolean) {
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
  function setActorVisible(visible: boolean) { if (actor) actor.visible = visible }
  function setFishingPose(sitting: boolean) { if (!actor || actor.scale.y === (sitting ? .75 : 1)) return; actor.scale.y=sitting ? .75 : 1; actor.y=Math.round((actor.zIndex-4) + (sitting ? 3 : 0)) }
  function dive(start: Point, progress: number) {
    if (!actor) return
    actor.x = Math.round(start.x + (VILLAGE.well.x - start.x) * progress)
    actor.y = Math.round(start.y + (VILLAGE.well.y - start.y) * progress)
    actor.zIndex = actor.y + 4
    actor.scale.set(1 - progress * .95)
    if (progress >= 1) actor.visible = false
  }
  function canSee(from: Point, to: Point) {
    const distance = Math.hypot(to.x-from.x, to.y-from.y)
    const steps = Math.ceil(distance / 4)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      if (collision.blocked(from.x + (to.x-from.x)*t, from.y + (to.y-from.y)*t)) return false
    }
    return true
  }
  const resize = () => {
    const width = viewportWidth()
    if (app.screen.width === width) return
    app.renderer.resize(width, VIEW_HEIGHT)
    if (actor) updateCamera(actor)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  app.ticker.add(onTick)
  return { draw, move, movePoint, canSee, dive, setActorVisible, setActors: dynamicActors.setActors, setFishingPose, findDrop, forestPhoto: () => forestPhoto, destroy() { resizeObserver.disconnect(); app.ticker.remove(onTick); app.destroy(true, { children: true }) } }
}
