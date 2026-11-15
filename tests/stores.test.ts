import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope } from 'vue'
import { createSaveData, createSceneSnapshot } from '../src/game/gameSnapshot.ts'
import { useInventory } from '../src/game/useInventory.ts'
import { useSessionStore } from '../src/stores/session.ts'
import { useGalleryStore } from '../src/stores/gallery.ts'
import { createPinia, setActivePinia, storeToRefs } from 'pinia'
import { useInterfaceStore } from '../src/stores/interface.ts'
import { useProgressStore } from '../src/stores/progress.ts'

test('game and interface state are shared within a Pinia instance and isolated between instances', () => {
  setActivePinia(createPinia())
  const progress = useProgressStore()
  const ui = useInterfaceStore()
  const refs = storeToRefs(progress)
  refs.shovel.value = true
  ui.screen = 'game'
  assert.equal(useProgressStore().shovel, true)
  assert.equal(useInterfaceStore().screen, 'game')
  setActivePinia(createPinia())
  assert.equal(useProgressStore().shovel, false)
  assert.equal(useInterfaceStore().screen, 'title')
})


test('inventory follows story ownership and clears a removed selection', () => {
  setActivePinia(createPinia())
  const progress = useProgressStore()
  const session = useSessionStore()
  const scope = effectScope()
  const inventory = scope.run(() => useInventory())
  progress.shovel = true
  assert.equal(progress.inventory[0], 'shovel')
  progress.selectedInventorySlot = 0
  session.droppedItems = { shovel: { location: 'forest', x: 1, y: 2 } }
  assert.equal(progress.inventory[0], null)
  assert.equal(progress.selectedInventorySlot, -1)
  assert.equal(inventory.hasFishingRod.value, false)
  scope.stop()
})

test('gallery store persists achievements and ending migration', () => {
  const data = new Map([['shepotok-endings', JSON.stringify(['diver'])]])
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } as unknown as Storage
  try {
    setActivePinia(createPinia())
    const gallery = useGalleryStore()
    assert.ok(gallery.achievementUnlocked.includes('diver'))
    assert.equal(gallery.unlockAchievement('trip').id, 'trip')
    assert.equal(gallery.unlockAchievement('trip'), null)
    gallery.unlockEnding('wolf')
    assert.deepEqual(JSON.parse(data.get('shepotok-endings')), ['diver', 'wolf'])
    assert.ok(JSON.parse(data.get('shepotok-achievements')).includes('trip'))
  } finally { globalThis.localStorage = previous }
})


test('snapshot keeps the established save fields and makes a copy of the player', () => {
  setActivePinia(createPinia())
  const progress = useProgressStore(), session = useSessionStore()
  progress.shovel = true
  session.riverRodGone = true
  const point = { x: 20, y: 30 }
  const save = createSaveData(progress, session, 'forest', point, null)
  point.x = 99
  assert.equal(save.player.x, 20)
  assert.equal(save.rulesVersion, 2)
  assert.equal(save.forestVersion, 5)
  assert.equal(save.shovel, true)
  assert.equal(save.riverRodGone, true)
  assert.equal(createSceneSnapshot(progress, session, 'forest', false).rodTaken, true)
})
