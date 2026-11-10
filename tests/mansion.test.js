import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { MANSION_WALLS, MANSION_FURNITURE, MANSION_ENTRY, MANSION_CHAIR, SHADOWS, PATROL_ROUTE, inMansionShadow, createMansionPatrol, advanceMansionPatrol } from '../src/game/mansionLayout.js'

function plan() {
  const collision=createCollision(768,448)
  for(const item of [...MANSION_WALLS,...MANSION_FURNITURE]) collision.addRect(item)
  collision.addRect({x:MANSION_CHAIR.x-8,y:MANSION_CHAIR.y-24,w:16,h:16})
  return collision
}
test('mansion has a walkable route from the entrance to the chair and hiding places', () => {
  const c=plan(), width=192, seen=new Set(), queue=[[MANSION_ENTRY.x-MANSION_ENTRY.x%4,MANSION_ENTRY.y]]
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i], key=y/4*width+x/4
    if(seen.has(key)||x<25||x>743||y<35||y>423||c.blocked(x,y)) continue
    seen.add(key)
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]) queue.push([x+dx,y+dy])
  }
  assert.ok(seen.has(MANSION_CHAIR.y/4*width+MANSION_CHAIR.x/4))
  for(const s of SHADOWS) assert.ok(seen.has((s.y+32)/4*width+(s.x+32)/4))
  assert.equal(inMansionShadow({x:300,y:224}),false)
  assert.equal(c.blocked(260,100),true)
  assert.equal(c.blocked(100,60),true)
})
test('the witch patrol traverses the mansion without crossing walls or furniture', () => {
  const c=plan(), patrol=createMansionPatrol(), visited=new Set()
  const move=(p,dx,dy)=>{
    if(!c.blocked(p.x+dx,p.y)) p.x+=dx
    if(!c.blocked(p.x,p.y+dy)) p.y+=dy
    assert.equal(c.blocked(p.x,p.y),false)
  }
  for(let i=0;i<2500;i++) { advanceMansionPatrol(patrol,50,move); visited.add(patrol.target) }
  assert.equal(visited.size,PATROL_ROUTE.length)
})
