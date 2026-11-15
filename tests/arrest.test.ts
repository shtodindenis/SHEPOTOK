import test from 'node:test'
import assert from 'node:assert/strict'
import { createArrest, advanceArrest, validArrest } from '../src/game/arrest.ts'

test('officer approaches before the arrest dialogue and the phase can be saved', () => {
  for (const cause of (['cannabis','mushrooms'] as const)) {
    const player={x:300,y:220}, arrest=createArrest(cause,player,960)
    assert.equal(validArrest(arrest),true)
    assert.equal(arrest.phase,'approach')
    for(let i=0;i<100 && arrest.phase==='approach';i++) advanceArrest(arrest,player,50)
    assert.equal(arrest.phase,'dialog')
    assert.ok(Math.hypot(arrest.x-player.x,arrest.y-player.y)<=18.01)
    assert.equal(validArrest(JSON.parse(JSON.stringify(arrest))),true)
  }
})
