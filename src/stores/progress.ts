import { defineStore } from 'pinia'
import { ref } from 'vue'

export type InventoryItem = 'rag' | 'shovel' | 'photo' | 'treasure' | 'rod' | 'mansionRod' | 'basket' | 'bucket'
export type StashState = 'buried' | 'witch' | 'player' | 'returned' | 'evidence' | 'smoked'

// The controller owns transitions and save migration; this store owns the
// reactive state shared by those transitions and the UI.
export const useProgressStore = defineStore('progress', () => {
  const stage = ref(0)
  const shovel = ref(false)
  const shovelUsed = ref(false)
  const note = ref(false)
  const trip = ref(false)
  const mushroomUsed = ref(false)
  const wolfDefeated = ref(false)
  const stashIndex = ref(0)
  const stashState = ref<StashState>('buried')
  const societyProgress = ref(0)
  const questState = ref('none')
  const shovelPermission = ref(false)
  const witchAngry = ref(false)
  const wrongDigs = ref(0)
  const wellQuizPassed = ref(false)
  const ragTaken = ref(false)
  const bikeQuest = ref(false)
  const bikeClean = ref(false)
  const selectedInventorySlot = ref(-1)
  const inventory = ref<(InventoryItem | null)[]>(Array(6).fill(null))
  return { stage, shovel, shovelUsed, note, trip, mushroomUsed, wolfDefeated, stashIndex,
    stashState, societyProgress, questState, shovelPermission, witchAngry, wrongDigs,
    wellQuizPassed, ragTaken, bikeQuest, bikeClean, selectedInventorySlot, inventory }
})
