import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCollection, normalizeDroppedItems } from '../src/game/saveNormalization.ts'

test('collection migration filters invalid items and restores legacy fish', () => {
  const collection = normalizeCollection({ giver: 'captain', collected: [1, 1, 2, -1, 30], crucians: 2 }, 16)
  assert.deepEqual(collection.collected, [1, 2])
  assert.deepEqual(collection.fish, ['crucian', 'crucian'])
  assert.equal(normalizeCollection({ giver: 'other', collected: [] }, 16), null)
  assert.deepEqual(normalizeCollection({ giver: 'witch', collected: [], fish: ['roach', 'bad'] }, 16).fish, ['roach'])
})

test('old society drops migrate without mutating the source save', () => {
  const rag = { location: 'society', x: 1, y: 2 }
  const items = { shovel: { location: 'society', x: 3, y: 4 }, photo: { location: 'forest', x: 5, y: 6 }, invalid: { location: 'home', x: 1, y: 1 } }
  const result = normalizeDroppedItems(rag, items, 0, { x: 100, y: 200 })
  assert.deepEqual(result.droppedRag, { location: 'society', x: 116, y: 200 })
  assert.deepEqual(result.droppedItems.shovel, { location: 'society', x: 116, y: 200 })
  assert.deepEqual(result.droppedItems.photo, items.photo)
  assert.equal(result.droppedItems.invalid, undefined)
  assert.equal(items.shovel.x, 3)
  assert.equal(rag.x, 1)
})
