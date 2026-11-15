import test from 'node:test'
import assert from 'node:assert/strict'
import { selectMusic } from '../src/game/musicSelection.ts'

test('music follows menu, forest, stealth and chair phases', () => {
  assert.equal(selectMusic({ screen: 'title' }), 'menu')
  assert.equal(selectMusic({ screen: 'slots', slotFromGame: false }), 'menu')
  assert.equal(selectMusic({ screen: 'slots', slotFromGame: true }), null)
  assert.equal(selectMusic({ screen: 'game', location: 'forest' }), 'forest')
  assert.equal(selectMusic({ screen: 'game', location: 'forest', questState: 'tail' }), 'tail')
  assert.equal(selectMusic({ screen: 'game', questState: 'chairs', chairPhase: 'music' }), 'chairs')
  assert.equal(selectMusic({ screen: 'game', questState: 'chairs', chairPhase: 'stop' }), null)
})
