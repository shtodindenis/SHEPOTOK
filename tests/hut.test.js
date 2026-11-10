import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { HUT_WIDTH, HUT_HEIGHT, HUT_SCALE, HUT_WALLS, HUT_FURNITURE } from '../src/game/hut.js'

test('hut entrance connects both rooms and quest interactions', () => {
  const c=createCollision(HUT_WIDTH,HUT_HEIGHT)
  for(const {x,y,w,h} of [...HUT_WALLS,...HUT_FURNITURE]) c.addRect({x:x*HUT_SCALE,y:y*HUT_SCALE,w:w*HUT_SCALE,h:h*HUT_SCALE})
  const seen=new Set(), queue=[[75,169]]
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i], key=`${x},${y}`
    if(seen.has(key)||x<16||x>304||y<27||y>183||c.blocked(x,y)) continue
    seen.add(key)
    for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]) queue.push([x+dx,y+dy])
  }
  for(const [x,y] of [[75,179],[27,69],[237,79],[281,69],[159,99]]) assert.ok(seen.has(`${x},${y}`), `unreachable: ${x},${y}`)
  assert.equal(c.blocked(156,50),true)
  assert.equal(c.blocked(156,140),true)
})
