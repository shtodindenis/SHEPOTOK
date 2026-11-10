import test from 'node:test'
import assert from 'node:assert/strict'
import { readSave, writeSave, readEndings, writeEndings } from '../src/game/storage.js'

const data = new Map()
globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
test('older saves infer that the shovel was spent once the stash was dug', () => {
  data.clear(); writeSave({ stage: 1, location: 'forest', shovel: true, player: { x: 40, y: 224 } }); assert.equal(readSave().shovelUsed, false)
  writeSave({ stage: 2, location: 'home', shovel: true, player: { x: 160, y: 135 } }); assert.equal(readSave().shovelUsed, true)
})
test('new location and ending gallery survive a save roundtrip', () => {
  data.clear(); writeSave({ stage: 1, location: 'society', wolfDefeated: true, player: { x: 160, y: 151 } }); assert.equal(readSave().wolfDefeated, true)
  writeEndings(['wolf', 'diver', 'wolf', 'unknown']); assert.deepEqual(readEndings(), ['wolf', 'diver'])
})

test('manual slots are separate from autosave and reject invalid indexes', async () => {
  const {readSlots,writeSlot}=await import('../src/game/storage.js')
  data.clear();const first={stage:1,location:'forest',player:{x:90,y:224},stashState:'witch'};const second={stage:2,location:'mansion',player:{x:45,y:224}}
  writeSave(first);assert.equal(writeSlot(0,second),true);assert.equal(writeSlot(5,first),false)
  assert.equal(readSave().location,'forest');assert.equal(readSlots()[0].data.location,'mansion');assert.equal(readSlots()[1],null)
  data.set('shepotok-slot-2','{bad');assert.equal(readSlots()[1],null)
})

test('explicit unused shovel survives when the witch recovered her own stash', () => {
  data.clear();writeSave({stage:3,location:'hut',shovel:true,shovelUsed:false,stashState:'returned',player:{x:160,y:120}})
  assert.equal(readSave().shovelUsed,false)
})

test('achievements persist independently from save slots and ignore unknown ids', async () => {
  const {readAchievements,writeAchievements}=await import('../src/game/storage.js')
  data.clear();writeAchievements(['thief','trip','thief','not-real']);writeSave({stage:0,location:'home',player:{x:160,y:130}})
  assert.deepEqual(readAchievements(),['thief','trip']);assert.equal(readSave().stage,0)
})

test('pit bike and rag progress survives autosaves and independent manual slots', async () => {
  const {readSlots,writeSlot} = await import('../src/game/storage.js')
  data.clear()
  const dirty={stage:0,location:'village',player:{x:151,y:201},bikeQuest:true,ragTaken:true,bikeClean:false,selectedInventorySlot:0}
  const clean={...dirty,bikeClean:true}
  writeSave(clean); assert.equal(writeSlot(0,dirty),true)
  assert.equal(readSave().bikeClean,true)
  assert.deepEqual([readSlots()[0].data.bikeClean,readSlots()[0].data.ragTaken,readSlots()[0].data.selectedInventorySlot],[false,true,0])
})
