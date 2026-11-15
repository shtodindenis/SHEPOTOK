import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileInventory } from '../src/game/inventory.ts'

test('river and mansion rods keep independent inventory slots', () => {
  const slots=reconcileInventory(['rod',null,null,null,null,null],['rod','mansionRod'])
  assert.deepEqual(slots.slice(0,2),['rod','mansionRod'])
  assert.deepEqual(reconcileInventory(slots,['mansionRod']).slice(0,2),[null,'mansionRod'])
})

test('items enter the first free slot and remaining items keep their positions', () => {
  let slots: (string | null)[]=reconcileInventory([],['photo'])
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
