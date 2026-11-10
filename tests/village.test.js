import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { VILLAGE, OTHER_DOORS, VILLAGE_SOLIDS, VILLAGE_WIDTH, VILLAGE_HEIGHT } from '../src/game/village.js'

test('all village interactions are reachable from home with the actual collision map', () => {
  const collision = createCollision(VILLAGE_WIDTH,VILLAGE_HEIGHT)
  for (const rect of VILLAGE_SOLIDS) collision.addRect(rect)
  const step=4, start=[108,172], queue=[start], visited=new Set([start.join(',')])
  for(let i=0;i<queue.length;i++) {
    const [x,y]=queue[i]
    for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`
      if(nx<10||nx>VILLAGE_WIDTH-10||ny<40||ny>VILLAGE_HEIGHT-14||visited.has(key)||collision.blocked(nx,ny)) continue
      // Check intermediate positions as the real movement does.
      let clear=true
      for(let n=1;n<step;n++) if(collision.blocked(x+dx*n/step,y+dy*n/step)) clear=false
      if(clear){visited.add(key);queue.push([nx,ny])}
    }
  }
  for(const [name, point] of Object.entries({...VILLAGE, ...Object.fromEntries(OTHER_DOORS.map((p,i)=>[`house${i}`,p]))})) {
    assert.ok(queue.some(([x,y])=>Math.hypot(x-point.x,y-point.y)<23), `${name} has no reachable approach`)
  }
})
