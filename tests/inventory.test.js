import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileInventory } from '../src/game/inventory.js'

test('items enter the first free slot and remaining items keep their positions', () => {
  let slots=reconcileInventory([],['photo'])
  assert.deepEqual(slots,['photo',null,null,null,null,null])
  slots=reconcileInventory(slots,['photo','shovel'])
  assert.deepEqual(slots,['photo','shovel',null,null,null,null])
  slots=reconcileInventory(slots,['shovel'])
  slots=reconcileInventory(slots,['shovel','treasure'])
  assert.deepEqual(slots,['treasure','shovel',null,null,null,null])
  assert.deepEqual(reconcileInventory(slots,['shovel']),[null,'shovel',null,null,null,null])
})
test('restore removes stale and duplicate items and fills missing slots', () => {
  assert.deepEqual(reconcileInventory(['rag','rag','invalid',null,'photo'],['shovel','photo']),['shovel',null,null,null,'photo',null])
})
