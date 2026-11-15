import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollision } from '../src/game/collision.js'
import { detentionWalls, DETENTION_WIDTH, DETENTION_HEIGHT, DETENTION_ENTRY, DETENTION_SHOVEL, DETENTION_EVIDENCE, DETENTION_EXIT, DETENTION_HIDING } from '../src/game/detention.js'

test('open detention cell connects to the shovel, grille, hiding places and exit while evidence room stays closed', () => {
  const collision = createCollision(DETENTION_WIDTH, DETENTION_HEIGHT)
  for (const wall of detentionWalls(true)) collision.addRect(wall)
  const step = 4, start = [Math.round(DETENTION_ENTRY.x/step), Math.round(DETENTION_ENTRY.y/step)]
  const key = (x,y) => `${x},${y}`, seen = new Set([key(...start)]), queue = [start]
  for (let i=0; i<queue.length; i++) {
    const [x,y] = queue[i]
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx, ny=y+dy, id=key(nx,ny)
      if (nx < 0 || ny < 0 || nx*step >= DETENTION_WIDTH || ny*step >= DETENTION_HEIGHT || seen.has(id) || collision.blocked(nx*step,ny*step)) continue
      seen.add(id); queue.push([nx,ny])
    }
  }
  const reachable = point => [...seen].some(entry => { const [x,y]=entry.split(',').map(Number); return Math.hypot(x*step-point.x,y*step-point.y)<20 })
  for (const point of [DETENTION_SHOVEL,DETENTION_EVIDENCE,DETENTION_EXIT,...DETENTION_HIDING]) assert.ok(reachable(point), JSON.stringify(point))
  assert.equal(seen.has(key(575/step,80/step)),false)
})
