import test from 'node:test'
import assert from 'node:assert/strict'
import { getWorldBounds } from '../src/game/worldBounds.ts'

const dimensions = { settlementWidth: 600, settlementHeight: 400, societyWidth: 800, societyHeight: 300,
  forestWidth: 960, forestHeight: 640, riverWidth: 500, villageWidth: 1000, villageHeight: 500,
  detentionWidth: 1200, detentionHeight: 600, mapWidth: 768, mapHeight: 896 }

test('forest boundary opens only after the trip or wolf victory', () => {
  assert.equal(getWorldBounds({ location: 'forest' }, dimensions).maxX, 895)
  assert.equal(getWorldBounds({ location: 'forest', trip: true }, dimensions).maxX, 950)
  assert.equal(getWorldBounds({ location: 'forest', wolfDefeated: true }, dimensions).maxX, 950)
})

test('chair game confines the player and mansion uses map dimensions', () => {
  assert.deepEqual(getWorldBounds({ location: 'society', questState: 'chairs' }, dimensions), { minX: 520, maxX: 744, minY: 40, maxY: 214 })
  assert.equal(getWorldBounds({ location: 'mansion' }, dimensions).maxY, 871)
})
