import test from 'node:test'
import assert from 'node:assert/strict'
import { createSkillCheck, directionFromEvent, HIT_COUNT } from '../src/game/skillCheck.js'

test('five correct timed directions defeat the wolf', () => {
  let wins = 0, losses = 0
  const game = createSkillCheck(() => wins++, () => losses++)
  game.start()
  for (let i = 0; i < HIT_COUNT; i++) { game.update(900); game.attempt(game.direction.value.id) }
  assert.equal(game.hits.value, 5); assert.equal(wins, 1); assert.equal(losses, 0); assert.equal(game.active.value, false)
})

test('a wrong direction, an early strike or a timeout loses immediately', () => {
  for (const attempt of [g => { g.update(900); g.attempt('left') }, g => g.attempt('up'), g => g.update(1800)]) {
    let wins = 0, losses = 0
    const game = createSkillCheck(() => wins++, () => losses++, () => 0)
    game.start(); attempt(game); game.attempt('up'); game.update(1800)
    assert.equal(losses, 1); assert.equal(wins, 0); assert.equal(game.active.value, false)
  }
})

test('WASD and arrow keys map to the same directions, including a Russian layout', () => {
  assert.equal(directionFromEvent({ code: 'KeyW', key: 'ц' }), 'up')
  assert.equal(directionFromEvent({ code: 'ArrowRight', key: 'ArrowRight' }), 'right')
  assert.equal(directionFromEvent({ code: '', key: 'ф' }), 'left')
})

test('each strike chooses a fresh random direction', () => {
  const values = [0, .26, .51, .76, 0]; let index = 0
  const game = createSkillCheck(() => {}, () => {}, () => values[index++])
  game.start()
  const seen = []
  for (let i = 0; i < HIT_COUNT; i++) { seen.push(game.direction.value.id); game.update(900); game.attempt(game.direction.value.id) }
  assert.deepEqual(seen, ['up', 'right', 'left', 'down', 'up'])
})
