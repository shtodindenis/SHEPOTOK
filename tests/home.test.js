import test from 'node:test'
import assert from 'node:assert/strict'
import { Container } from 'pixi.js'
import { buildHome, HOME_WIDTH, HOME_HEIGHT } from '../src/game/home.js'
import { createCollision } from '../src/game/collision.js'

test('home furniture leaves each important interaction reachable from the entrance', () => {
  for (const stage of [0, 2]) {
    const collision = createCollision(HOME_WIDTH, HOME_HEIGHT)
    const world = new Container()
    const sprite = () => { const object = new Container(); world.addChild(object); return object }
    buildHome({ world, sprite, interior: {}, furniture: {}, dungeon: {}, collision, scene: { stage }, depthGroup: (_depth, draw) => draw() })
    const queue = [[256, 274]], visited = new Set(['256,274']), step = 2
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i]
      for (const [dx, dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
        const nx=x+dx, ny=y+dy, key=`${nx},${ny}`
        if (nx<25 || nx>487 || ny<42 || ny>294 || visited.has(key) || collision.blocked(nx,ny) || collision.blocked(x+dx/2,y+dy/2)) continue
        visited.add(key); queue.push([nx,ny])
      }
    }
    const points = { exit:[256,290], bed:[58,87], basket:[185,126], rag:[407,258], toilet:[440,234], bath:[355,204], sink:[450,199], towels:[466,258], sofa:[85,201], tv:[86,258], table:[406,126], leftChair:[354,120], rightChair:[457,120], fridge:[469,78], waterpipe:[148,241] }
    for (const [name, [x,y]] of Object.entries(points)) assert.ok(queue.some(([px,py])=>Math.hypot(px-x,py-y)<24), `${name} is unreachable at stage ${stage}`)
  }
})

test('doorway trim sorts separately around the character', () => {
  const world = new Container(), collision = createCollision(HOME_WIDTH, HOME_HEIGHT)
  const sprite = () => { const object = new Container(); world.addChild(object); return object }
  buildHome({ world, sprite, interior: {}, furniture: {}, dungeon: {}, collision, scene: { stage: 0 }, depthGroup: (_depth, draw) => draw() })
  const trims = world.children.filter(child => child.label === 'home-doorway-trim')
  assert.equal(trims.length, 8)
  for (const openingY of [80,240]) {
    const depths = trims.map(trim => trim.zIndex)
    assert.equal(depths.filter(z => z === openingY+1).length, 2)
    assert.equal(depths.filter(z => z === openingY+35).length, 2)
    assert.ok(openingY+1 < openingY+20+4 && openingY+35 > openingY+20+4)
    assert.ok(openingY+35 < openingY+34+4)
  }
})

test('solid home props block movement, while the collected basket disappears', () => {
  function sceneCollision(scene) {
    const world = new Container(), collision = createCollision(HOME_WIDTH, HOME_HEIGHT)
    const sprite = () => { const object = new Container(); world.addChild(object); return object }
    buildHome({ world, sprite, interior: {}, furniture: {}, dungeon: {}, collision, scene, depthGroup: (_depth, draw) => draw() })
    return collision
  }
  const initial = sceneCollision({stage:0})
  for (const [name,x,y] of [['basket',185,124],['sofa',86,184],['dresser',110,140],['kitchen',332,54],['fridge',470,55],['bookcase',180,278],['bathroom cabinet',465,275],['towel rack',432,265]]) {
    assert.ok(initial.blocked(x,y), `${name} should block movement`)
  }
  assert.equal(sceneCollision({stage:0,collection:{basket:true}}).blocked(185,124),false)
  assert.ok(sceneCollision({stage:2}).blocked(158,239), 'waterpipe should block movement')
})
