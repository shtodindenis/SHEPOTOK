import test from 'node:test'
import assert from 'node:assert/strict'
import { createSkillCheck, directionFromEvent, DIRECTIONS } from '../src/game/skillCheck.js'

test('five correct timed directions defeat the wolf', () => {
  let wins = 0, losses = 0
  const game = createSkillCheck(() => wins++, () => losses++)
  game.start()
  for (const { id } of DIRECTIONS) { game.update(900); game.attempt(id) }
  assert.equal(game.hits.value, 5); assert.equal(wins, 1); assert.equal(losses, 0); assert.equal(game.active.value, false)
})

test('a wrong direction, an early strike or a timeout loses immediately', () => {
  for (const attempt of [g => { g.update(900); g.attempt('left') }, g => g.attempt('up'), g => g.update(1800)]) {
    let wins = 0, losses = 0
    const game = createSkillCheck(() => wins++, () => losses++)
    game.start(); attempt(game); game.attempt('up'); game.update(1800)
    assert.equal(losses, 1); assert.equal(wins, 0); assert.equal(game.active.value, false)
  }
})

test('WASD and arrow keys map to the same directions, including a Russian layout', () => {
  assert.equal(directionFromEvent({ code: 'KeyW', key: 'ц' }), 'up')
  assert.equal(directionFromEvent({ code: 'ArrowRight', key: 'ArrowRight' }), 'right')
  assert.equal(directionFromEvent({ code: '', key: 'ф' }), 'left')
})
