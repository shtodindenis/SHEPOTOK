import test from 'node:test'
import assert from 'node:assert/strict'
import { getBikeHint, getQuestHint } from '../src/game/hints.js'

test('active society tasks take priority over the main quest', () => {
  assert.equal(getQuestHint({ questState: 'tail', questStatus: 'СТАТУС', stage: 0, witchAngry: true }), 'СТАТУС')
  assert.match(getQuestHint({ questState: 'tail_ready', location: 'forest' }), /ВОСТОЧНОМУ/)
})

test('quest and bike hints reflect progress', () => {
  assert.match(getQuestHint({ stage: 1, shovel: true, note: true }), /ФОТОГРАФИИ/)
  assert.match(getBikeHint({ bikeQuest: true, droppedRag: {} }), /ВЫБРОШЕННУЮ/)
  assert.equal(getBikeHint({ bikeQuest: true, bikeClean: true }), '')
})
