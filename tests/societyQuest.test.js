import test from 'node:test'
import assert from 'node:assert/strict'
import { forestRoad, behindTree, forestTrees } from '../src/game/forestMap.js'
import { createTail, updateTail, createChairs, advanceChairs, sitDown, inShadow, SEATS } from '../src/game/societyQuest.js'

test('forest paths stay connected at bends and the cache branch', () => {
  for (const [x,y] of [[144,208],[144,224],[144,304],[320,304],[320,208],[496,208],[496,336],[496,448],[576,448]]) assert.equal(forestRoad(x,y),true)
  assert.equal(forestRoad(288,272),false)
  const tree=forestTrees[0]; assert.equal(behindTree({x:tree.x+8,y:tree.y+30}),true)
})
test('tail reaches home after investigating the stash, and carrying retries skip the dig', () => {
  for (const mode of ['buried','empty','carrying']) {
    const tail=createTail(mode); let result
    for(let i=0;i<4000 && !result;i++) result=updateTail(tail,50,{x:tail.x+90,y:tail.y},false)
    assert.equal(result,'success'); assert.equal(tail.dug,true)
    if(mode==='carrying') assert.equal(tail.digging,0)
    else assert.ok(tail.digging>=2600)
  }
})
test('tail fails when spotted or when the player loses sight', () => {
  const seen=createTail();seen.elapsed=5600;assert.equal(updateTail(seen,50,{x:850,y:224},false),'seen')
  const hidden=createTail();hidden.elapsed=5600;assert.equal(updateTail(hidden,50,{x:850,y:224},true),null)
  const lost=createTail();let result;for(let i=0;i<25&&!result;i++)result=updateTail(lost,50,{x:100,y:224},false);assert.equal(result,'lost')
})
test('shadows and all musical chair rounds have playable success and failure paths', () => {
  assert.equal(inShadow({x:72,y:110}),true);assert.equal(inShadow({x:72,y:224}),false)
  const game=createChairs(); assert.equal(sitDown(game,SEATS[0]),false)
  for(let round=1;round<=3;round++) { for(let i=0;i<130;i++)advanceChairs(game,50);assert.equal(game.phase,'stop'); assert.equal(sitDown(game,SEATS[0]),round===3?'won':'next') }
  const failed=createChairs();for(let i=0;i<130;i++)advanceChairs(failed,50);let outcome;for(let i=0;i<60;i++)outcome=advanceChairs(failed,50);assert.equal(outcome,'failed')
})
