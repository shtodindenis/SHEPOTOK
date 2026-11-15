import test from 'node:test'
import assert from 'node:assert/strict'
import { startDetention, validDetention, openCell, findDetentionShovel, chooseEvidence, canLeaveDetention } from '../src/game/detentionState.js'

test('cannabis escape requires the evidence choice and it cannot be changed', () => {
  let state = startDetention('cannabis')
  assert.equal(canLeaveDetention(state), false)
  state = openCell(state)
  assert.equal(canLeaveDetention(state), false)
  assert.equal(chooseEvidence(state, 'cannabis').choice, null)
  state = findDetentionShovel(state)
  const taken = chooseEvidence(state, 'cannabis')
  assert.equal(canLeaveDetention(taken), true)
  assert.equal(taken.alarm, true)
  assert.deepEqual(chooseEvidence(taken, 'shovel'), taken)
  assert.equal(validDetention(taken), true)
  assert.equal(validDetention({ ...taken, alarm: false }), false)
  const left = chooseEvidence(state, 'shovel')
  assert.equal(left.alarm, false)
  assert.equal(canLeaveDetention(left), true)
})

test('mushroom arrest never gives access to the second shovel', () => {
  const state = openCell(startDetention('mushrooms'))
  assert.equal(canLeaveDetention(state), true)
  assert.deepEqual(findDetentionShovel(state), state)
  assert.equal(validDetention({ ...state, shovelFound: true }), false)
})
