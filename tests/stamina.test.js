import test from 'node:test'
import assert from 'node:assert/strict'
import { STAMINA_MAX, STAMINA_RESTART, updateStamina } from '../src/game/stamina.js'

test('running consumes stamina, exhaustion stops sprinting until recovery', () => {
  let state={value:STAMINA_MAX,exhausted:false}
  for(let i=0;i<100;i++) state=updateStamina(state.value,state.exhausted,true,50)
  assert.equal(state.value,0); assert.equal(state.exhausted,true)
  while(state.value < STAMINA_RESTART - 1) state=updateStamina(state.value,state.exhausted,false,50)
  assert.equal(state.exhausted,true)
  while(state.value < STAMINA_RESTART) state=updateStamina(state.value,state.exhausted,false,50)
  assert.equal(state.exhausted,false)
  for(let i=0;i<300;i++) state=updateStamina(state.value,state.exhausted,false,50)
  assert.equal(state.value,STAMINA_MAX)
})

test('stamina caps elapsed time so a stalled frame does not empty the bar', () => {
  assert.equal(updateStamina(100,false,true,10000).value,99)
})
