import { forestRoad, forestTrees, STASH, CAMP, FOREST_EAST } from './forestMap.js'
import { SHADOWS, MANSION_WALLS, MANSION_FURNITURE } from './mansionLayout.js'

export function buildScene({ sprite, character, campTent, depthGroup, scene, sheet, dungeon, furniture, mapWidth, mapHeight }) {
function ground(source, col, row) {
  for (let y = 0; y < mapHeight; y += 16) for (let x = 0; x < mapWidth; x += 16) sprite(source, x, y, col, row, 1, false)
}
function tree(x, y, col = 4) { depthGroup(y+32, () => { sprite(sheet, x, y, col, 0, 1, false); sprite(sheet, x, y + 16, col, 1) }) }
function objectSprite(source, x, y, col, row, scale = 1, solid = false) { const item=sprite(source,x,y,col,row,scale,solid); item.zIndex=y+16*scale; return item }
function buildRoom(hut = false) {
  ground(furniture, 8, 2)
  // Walls, floor and furniture are assembled exclusively from downloaded tiles.
  for (let x = 0; x < 320; x += 16) { sprite(dungeon, x, 0, 4, 3); sprite(dungeon, x, 16, 4, 3); sprite(dungeon, x, 176, 4, 3) }
  for (let y = 32; y < 176; y += 16) { sprite(dungeon, 0, y, 4, 3); sprite(dungeon, 304, y, 4, 3) }
  sprite(dungeon, 144, 160, 10, 3); sprite(dungeon, 160, 160, 11, 3)
  for (const x of [48, 64, 240, 256]) sprite(furniture, x, 16, 28, 3)
  if (!hut) {
    sprite(furniture, 48, 72, 14, 3, 2.5)
    sprite(dungeon, 220, 60, 3, 5, 1.5); sprite(dungeon, 244, 60, 3, 6, 1.5)
    if (scene.stage === 2) { sprite(dungeon, 222, 102, 0, 6, 1.5); sprite(dungeon, 229, 88, 8, 9, 1.2) }
    else sprite(dungeon, 232, 106, 6, 7, 1.5)
    sprite(furniture, 104, 36, 29, 2)
  } else {
    for (let i = 0; i < 3; i++) sprite(dungeon, 32 + i * 16, 51, 3, 5)
    sprite(dungeon, 124, 88, 0, 6, 2); sprite(dungeon, 156, 88, 0, 6, 2)
    sprite(dungeon, 144, 76, 6, 9); sprite(dungeon, 224, 80, 0, 6, 2); sprite(dungeon, 256, 80, 0, 6, 2)
    if (!scene.note) sprite(furniture, 244, 82, 11, 4, 1.3)
    if (!scene.shovel) sprite(sheet, 34, 108, 8, 10, 1.3)
    sprite(dungeon, 270, 48, 7, 9); sprite(dungeon, 84, 52, 5, 9); sprite(dungeon, 105, 52, 8, 9)
    character(160, 61, true)
  }
}
function buildForest() {
  for (let y = 0; y < mapHeight; y += 16) for (let x = 0; x < mapWidth; x += 16) {
    const grass = sprite(sheet, x, y, ((x / 16 + y / 16 * 7) % 11 === 0) ? 1 : 0, 0, 1, false)
    grass.tint = 0xb4d1a5
  }
  // Select edges from the complete road mask, including both junctions.
  for (let y = 0; y < mapHeight; y += 16) for (let x = 0; x < mapWidth; x += 16) if (forestRoad(x, y)) {
    const col = !forestRoad(x - 16, y) ? 0 : !forestRoad(x + 16, y) ? 2 : 1
    const row = !forestRoad(x, y - 16) ? 1 : !forestRoad(x, y + 16) ? 3 : 2
    sprite(sheet, x, y, col, row, 1, false).tint = 0xb4d1a5
  }
  for (const t of forestTrees) tree(t.x, t.y, t.col)
  if (!scene.trip) sprite(sheet, 180, 184, 5, 2, 1.25)
  // Small non-solid plants add variety without closing the narrow trails.
  for (let y=48; y<mapHeight-24; y+=39) for (let x=30; x<mapWidth-24; x+=47) {
    if ((x*3+y*7)%11<5 || forestRoad(x,y) || Math.hypot(x-CAMP.x,y-CAMP.y)<70 || Math.hypot(x-STASH.x,y-STASH.y)<48) continue
    const variant=(Math.floor(x/47)+Math.floor(y/39)*3)%5
    objectSprite(sheet, x, y, variant===0?5:variant===1?10:5, variant===0?2:variant===1?8:variant===2?1:0, 1, false)
  }
  // Distinctive landmarks are visible both here and in the actual photograph.
  tree(STASH.x+38, STASH.y-50, 3)
  objectSprite(sheet, STASH.x-45, STASH.y-32, 10, 8, 1.3, false)
  objectSprite(sheet, STASH.x+28, STASH.y+18, 5, 2, 1.2, false)
  campTent(CAMP.x-36, CAMP.y-55)
  objectSprite(dungeon, CAMP.x+30, CAMP.y-17, 6, 9, 1.4, false)
  objectSprite(dungeon, CAMP.x, CAMP.y-8, 5, 9, 1.1, false)
  sprite(sheet, 84, 190, 11, 6)
  if (scene.trip && !scene.wolfDefeated) objectSprite(dungeon, FOREST_EAST.x, FOREST_EAST.y-16, 4, 10, 1.2)
}


function buildSociety() {
  ground(furniture, 8, 2)
  for (let x = 0; x < 320; x += 16) { sprite(dungeon, x, 0, 4, 3); sprite(dungeon, x, 16, 4, 3); sprite(dungeon, x, 176, 4, 3) }
  for (let y = 32; y < 176; y += 16) { sprite(dungeon, 0, y, 4, 3); sprite(dungeon, 304, y, 4, 3) }
  sprite(dungeon, 144, 160, 10, 3); sprite(dungeon, 160, 160, 11, 3)
  for (const x of [48, 64, 240, 256]) sprite(furniture, x, 16, 28, 3)
  if (scene.questState !== 'chairs') {
    for (const x of [60, 130, 200]) { sprite(dungeon, x, 70, 0, 6, 1.5); sprite(dungeon, x + 24, 70, 0, 6, 1.5) }
    for (const [x, y, col, row] of [[49,52,1,7],[91,52,3,8],[119,51,2,7],[162,51,4,8],[190,52,4,7],[232,52,2,8],[72,116,3,7],[238,116,1,8]]) sprite(dungeon, x, y, col, row, 1.25)
  }
  sprite(dungeon, 140, 37, 6, 9); sprite(dungeon, 160, 37, 8, 9)
  character(160, scene.questState === 'chairs' ? 60 : 91)
  if (scene.societyProgress === 3) objectSprite(furniture, 224, 113, 19, 2, 1.3, false).tint = 0xff4444
}

function buildMansion() {
  ground(furniture, 8, 2)
  for (const s of SHADOWS) for (let y = s.y; y < s.y+s.h; y += 16) for (let x = s.x; x < s.x+s.w; x += 16)
    sprite(furniture, x, y, 8, 2, 1, false).tint = 0x77717e
  // A runner connects the entrance and the rooms and makes the lit route legible.
  for (let x = 32; x < 736; x += 16) for (let y = 192; y < 256; y += 16)
    sprite(furniture, x, y, 8, 2, 1, false).tint = 0xbb8c75
  for (const wall of MANSION_WALLS) for (let y = wall.y; y < wall.y+wall.h; y += 16) for (let x = wall.x; x < wall.x+wall.w; x += 16)
    objectSprite(dungeon, x, y, 4, 3, 1, false)
  for (const item of MANSION_FURNITURE) depthGroup(item.y+item.h, () => {
    for (let x = item.x; x < item.x + item.w; x += 16) {
      sprite(dungeon, x, item.y, item.kind === 'cabinet' ? 3 : 0, item.kind === 'cabinet' ? 5 : 6, 1, false)
      sprite(dungeon, x, item.y+16, item.kind === 'cabinet' ? 3 : 0, item.kind === 'cabinet' ? 6 : 6, 1, false)
    }
  })
  for (const x of [144, 400, 640]) { sprite(dungeon, x, 32, 5, 9, 1, false); sprite(dungeon, x+32, 32, 8, 9, 1, false) }
  for (const [x,y] of [[96,352],[352,352],[672,352]]) objectSprite(dungeon, x, y-8, 6, 9, 1, false)
  sprite(dungeon, 16, 208, 10, 3, 1, false)
}

  if (scene.location === 'forest') buildForest()
  else if (scene.location === 'society') buildSociety()
  else if (scene.location === 'mansion') buildMansion()
  else buildRoom(scene.location === 'hut')
}
