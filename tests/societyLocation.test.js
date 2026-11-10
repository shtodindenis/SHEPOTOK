import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { buildSocietyHouse, buildSettlement, SOCIETY_WIDTH, SOCIETY_HEIGHT, SETTLEMENT_WIDTH, SETTLEMENT_HEIGHT, SOCIETY_ENTRY, CAPTAIN, SETTLEMENT_FOREST, SETTLEMENT_HOUSE } from '../src/game/societyLocation.js'

function reachable(collision, width, height, start) {
  const step=4, queue=[start], seen=new Set([start.join(',')])
  for (let i=0;i<queue.length;i++) {
    const [x,y]=queue[i]
    for (const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const nx=x+dx, ny=y+dy, key=`${nx},${ny}`
      if(nx<10 || nx>=width-10 || ny<20 || ny>=height-10 || seen.has(key)) continue
      if ([1,2,3,4].some(n=>collision.blocked(x+dx*n/step,y+dy*n/step))) continue
      seen.add(key); queue.push([nx,ny])
    }
  }
  return queue
}
function draw(build, width, height) {
  const collision=createCollision(width,height), world={addChild(){}}, sprite=()=>({scale:{}})
  build({world,collision,sprite,depthGroup:(_depth,fn)=>fn(),scene:{societyProgress:0}})
  return collision
}
test('society entrance reaches every bedroom and the captain', () => {
  const collision=draw(buildSocietyHouse,SOCIETY_WIDTH,SOCIETY_HEIGHT)
  const points=reachable(collision,SOCIETY_WIDTH,SOCIETY_HEIGHT,[SOCIETY_ENTRY.x,SOCIETY_ENTRY.y])
  for (const [x,y] of [[104,180],[344,180],[600,180],[104,330],[344,330],[600,330],[CAPTAIN.x,CAPTAIN.y+14]]) {
    assert.ok(points.some(([px,py])=>Math.hypot(px-x,py-y)<20), `unreachable ${x},${y}`)
  }
})
test('settlement trail connects forest and society door', () => {
  const collision=draw(buildSettlement,SETTLEMENT_WIDTH,SETTLEMENT_HEIGHT)
  const points=reachable(collision,SETTLEMENT_WIDTH,SETTLEMENT_HEIGHT,[SETTLEMENT_FOREST.x+20,SETTLEMENT_FOREST.y])
  assert.ok(points.some(([x,y])=>Math.hypot(x-SETTLEMENT_HOUSE.x,y-SETTLEMENT_HOUSE.y)<20))
})
