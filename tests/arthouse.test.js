import test from 'node:test'
import assert from 'node:assert/strict'
import { startArthouse, eatArthouseMushroom, sleepArthouse, requiredMushrooms, capacityForDay, validArthouse } from '../src/game/arthouse.js'

test('minimum consumption leaves one mushroom on day five', () => {
  let state=startArthouse(0), next=1
  for (let day=1;day<=4;day++) {
    for(let i=0;i<requiredMushrooms(day);i++) state=eatArthouseMushroom(state,next++)
    state=sleepArthouse(state)
    assert.equal(state.day,day+1)
  }
  assert.equal(state.consumed.length,15)
  state=eatArthouseMushroom(state,15)
  assert.equal(sleepArthouse(state).death,'exhaustion')
  assert.equal(validArthouse(state),true)
})

test('a mushroom is lethal only when the bar was already full', () => {
  let state=startArthouse(0)
  for(let i=1;i<=capacityForDay(1);i++) state=eatArthouseMushroom(state,i)
  assert.equal(state.death,null)
  assert.equal(eatArthouseMushroom(state,4).death,'overdose')
  assert.equal(sleepArthouse(startArthouse(0)).death,'exhaustion')
})
