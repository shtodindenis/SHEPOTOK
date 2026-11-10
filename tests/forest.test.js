import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { FOREST_WIDTH, FOREST_HEIGHT, FOREST_ENTRY, FOREST_EAST, RIVER_PATH_ENTRY, FOREST_SOLIDS, FOREST_PROP_SOLIDS, FOREST_MUSHROOMS, FOREST_PATHS, STASH_SPOTS, CAMP, forestRoad, nearRoute } from '../src/game/forestMap.js'
import { createTail, updateTail } from '../src/game/societyQuest.js'

test('all seven tree caches are off the road, distant and reachable', () => {
  const c=createCollision(FOREST_WIDTH,FOREST_HEIGHT)
  for(const rect of [...FOREST_SOLIDS,...FOREST_PROP_SOLIDS]) c.addRect(rect)
  const seen=new Set(), queue=[[40,224]]
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i], key=`${x},${y}`
    if(seen.has(key)||x<10||x>950||y<35||y>626||c.blocked(x,y)) continue
    seen.add(key)
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]) queue.push([x+dx,y+dy])
  }
  function reachable(point, radius=10) {
    for(let x=Math.round((point.x-radius)/4)*4;x<=point.x+radius;x+=4) for(let y=Math.round((point.y-radius)/4)*4;y<=point.y+radius;y+=4)
      if(Math.hypot(x-point.x,y-point.y)<radius && seen.has(`${x},${y}`)) return true
    return false
  }
  assert.equal(STASH_SPOTS.length,7)
  assert.ok(FOREST_MUSHROOMS.length >= 3 && FOREST_MUSHROOMS.length <= 10)
  for (const mushroom of FOREST_MUSHROOMS) assert.ok(reachable({x:mushroom.x+8,y:mushroom.y+8},24), `unreachable mushroom at ${mushroom.x},${mushroom.y}`)
  for(const [index,spot] of STASH_SPOTS.entries()) {
    assert.ok(!FOREST_PATHS.some(path=>nearRoute(spot.x,spot.y,path,50)),`cache ${index} is too close to a path`)
    assert.ok(Math.hypot(spot.x-FOREST_ENTRY.x,spot.y-FOREST_ENTRY.y)>350)
    assert.ok(Math.hypot(spot.x-CAMP.x,spot.y-CAMP.y)>300)
    assert.ok(reachable(spot),`cache ${index} unreachable`)
    const tail=createTail('buried',index); let position={x:tail.x,y:tail.y}
    for(const target of tail.route) {
      const distance=Math.hypot(target.x-position.x,target.y-position.y)
      for(let step=0;step<=distance;step+=2) {
        const t=distance ? step/distance : 0
        assert.equal(c.blocked(position.x+(target.x-position.x)*t,position.y+(target.y-position.y)*t),false,`tail route ${index} crosses a trunk`)
      }
      position=target
    }
    let result
    for(let i=0;i<5000&&!result;i++) result=updateTail(tail,50,{x:tail.x+90,y:tail.y},false)
    assert.equal(result,'success'); assert.ok(tail.digging>=2600)
  }
  assert.ok(reachable(FOREST_EAST,20)); assert.ok(reachable(CAMP,30)); assert.ok(reachable(RIVER_PATH_ENTRY,20))
  assert.ok(!FOREST_PATHS.some(path=>nearRoute(CAMP.x,CAMP.y,path,80)), 'camp is exposed by a path')
  assert.ok(FOREST_SOLIDS.filter(tree=>Math.hypot(tree.x-CAMP.x,tree.y-CAMP.y)<115).length >= 8, 'camp needs a screen of trees')
})
