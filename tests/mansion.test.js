import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { MANSION_WIDTH, MANSION_HEIGHT, MANSION_WALLS, MANSION_FURNITURE, MANSION_DETAIL_COLLISIONS, MANSION_ENTRY, MANSION_CHAIR, MANSION_STAIRS, MANSION_HIDING, PATROL_ROUTE, createMansionPatrol, advanceMansionPatrol } from '../src/game/mansionLayout.js'
const c=createCollision(MANSION_WIDTH,MANSION_HEIGHT)
for(const item of [...MANSION_WALLS,...MANSION_FURNITURE,...MANSION_DETAIL_COLLISIONS]) c.addRect(item)
function reachable(start) {
  const seen=new Set(), queue=[[Math.round(start.x/4)*4,Math.round(start.y/4)*4]]
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i], key=`${x},${y}`
    if(seen.has(key)||x<25||x>743||y<35||y>871||c.blocked(x,y))continue
    seen.add(key)
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]])queue.push([x+dx,y+dy])
  }
  return (p,radius=20)=>{for(let y=p.y-radius;y<=p.y+radius;y+=4)for(let x=p.x-radius;x<=p.x+radius;x+=4)if(seen.has(`${Math.round(x/4)*4},${Math.round(y/4)*4}`))return true;return false}
}
test('stairs, chair, and hiding places are reachable on both floors',()=>{
  const first=reachable(MANSION_ENTRY), second=reachable({x:680,y:672})
  assert.ok(first(MANSION_STAIRS[0])); assert.ok(second(MANSION_STAIRS[1])); assert.ok(second(MANSION_CHAIR))
  for(const p of MANSION_HIDING) assert.ok((p.y<448?first:second)(p,12),`${p.label} ${p.x},${p.y}`)
})
test('the witch can patrol both floors without entering walls',()=>{
  const patrol=createMansionPatrol(), floors=new Set(), targets=new Set()
  const move=(p,dx,dy)=>{if(!c.blocked(p.x+dx,p.y))p.x+=dx;if(!c.blocked(p.x,p.y+dy))p.y+=dy;assert.equal(c.blocked(p.x,p.y),false)}
  for(let i=0;i<5000;i++){advanceMansionPatrol(patrol,50,move);floors.add(patrol.floor);targets.add(patrol.target)}
  assert.equal(floors.size,2);assert.equal(targets.size,PATROL_ROUTE.length)
})
