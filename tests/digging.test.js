import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDig } from '../src/game/digging.js'

const known = { permission: true, photo: true, stage: 1, stashState: 'buried', distance: 0, wrongDigs: 0 }

test('digging is blocked under the mushroom trip even on the exact cache', () => {
  assert.deepEqual(resolveDig({ ...known, tripping:true }), { outcome:'tripping', wrongDigs:0 })
  assert.equal(resolveDig(known).outcome,'found')
})

test('the cache cannot be found by accident without permission and the photo', () => {
  assert.equal(resolveDig({ ...known, permission: false }).outcome, 'unknown')
  assert.equal(resolveDig({ ...known, photo: false }).outcome, 'unknown')
  assert.equal(resolveDig(known).outcome, 'found')
})

test('misses accumulate up to five without consuming the shovel', () => {
  let state = known
  for (let i = 1; i <= 6; i++) {
    const result = resolveDig({ ...state, distance: 20 })
    assert.equal(result.outcome, 'miss')
    assert.equal(result.wrongDigs, Math.min(i, 5))
    state = { ...state, wrongDigs: result.wrongDigs }
  }
  assert.equal(resolveDig(state).outcome, 'found')
})
