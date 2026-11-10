import test from 'node:test'
import assert from 'node:assert/strict'
import { startFishing, updateFishing, hookFish } from '../src/game/fishing.js'
import { canFishAtRiver } from '../src/game/river.js'
test('cast requires the shore and a bite must be hooked in time', () => {
  assert.equal(canFishAtRiver({y:214}),false);assert.equal(canFishAtRiver({y:230}),true)
  const f=startFishing('river',100); assert.equal(hookFish(f),false)
  updateFishing(f,50); assert.equal(updateFishing(f,50),'bite');assert.equal(hookFish(f),true)
  assert.equal(f.phase,'reeling')
})
test('balancing catches a fish and pressure grows as progress increases', () => {
  const f=startFishing('river',0);updateFishing(f,1);hookFish(f)
  let result; for(let i=0;i<300&&!result;i++) {f.holding=f.tension<.48;result=updateFishing(f,50)}
  assert.equal(result,'caught')
  const low={...f,phase:'reeling',progress:0,tension:.5,holding:false},high={...low,progress:.9}
  updateFishing(low,50);updateFishing(high,50);assert.ok(high.tension<low.tension)
})
test('well fishing triggers after five seconds and ordinary fish escape at extremes', () => {
  const well=startFishing('well'); for(let i=0;i<99;i++) assert.equal(updateFishing(well,50),null)
  assert.equal(updateFishing(well,50),'well-fall')
  const f=startFishing('river',0);updateFishing(f,1);hookFish(f);f.holding=true
  let result;for(let i=0;i<100&&!result;i++) result=updateFishing(f,50)
  assert.equal(result,'escaped')
})
