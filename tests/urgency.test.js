import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceUrgency, createUrgency, resolveUrgencyCheck, validUrgency, CHECK_DURATION } from '../src/game/urgency.js'
import { advanceEscort, createTail } from '../src/game/societyQuest.js'

test('the timer and random checks use five to fifteen second intervals and narrower zones over time', () => {
  const run=createUrgency(()=>0); assert.equal(run.remaining,60000); assert.equal(run.next,5000)
  assert.equal(advanceUrgency(run,5001,()=>0),'check'); assert.ok(validUrgency(run)); const initial=run.check.width
  run.check.elapsed=0; resolveUrgencyCheck(run,()=>.999); assert.ok(run.next>=14990 && run.next<15000)
  run.elapsed=60000; run.next=0; advanceUrgency(run,1,()=>.5); assert.ok(run.check.width<initial); assert.ok(Math.abs(run.check.width-.12)<.0001)
})
test('perfect, normal, missed and unanswered checks adjust time correctly', () => {
  for(const [cursor,expected,change] of [[.5,'perfect',5000],[.6,'hit',0],[.8,'miss',-5000]]) {
    const run=createUrgency(); run.check={elapsed:CHECK_DURATION*cursor,center:.5,width:.3}
    assert.equal(resolveUrgencyCheck(run,()=>0),expected); assert.equal(run.remaining,60000+change)
  }
  const run=createUrgency(); run.check={elapsed:CHECK_DURATION-1,center:.5,width:.3}
  advanceUrgency(run,1,()=>0); assert.equal(run.feedback,'miss'); assert.equal(run.remaining,54999)
  run.remaining=1; assert.equal(advanceUrgency(run,1),'expired')
})
test('urgency checkpoints validate saved timers and rotating checks', () => {
  const run=createUrgency(()=>0); assert.ok(validUrgency(run)); run.check={elapsed:100,center:.5,width:.2}; assert.ok(validUrgency(run))
  assert.ok(!validUrgency({...run,remaining:0})); assert.ok(!validUrgency({...run,check:{...run.check,width:1}}))
})
test('friendly escort waits for the player and follows the same route without stealth penalties', () => {
  const escort=createTail('buried',0); escort.elapsed=7000
  assert.equal(advanceEscort(escort,50,{x:0,y:0}),'waiting')
  let dug=false,arrived=false
  for(let i=0;i<6000&&!arrived;i++) { const result=advanceEscort(escort,50,{x:escort.x,y:escort.y}); dug ||= result==='dug'; arrived=result==='arrived' }
  assert.ok(dug); assert.ok(arrived); assert.equal(escort.dug,true)
})
