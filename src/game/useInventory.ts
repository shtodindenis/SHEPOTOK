import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProgressStore, type InventoryItem } from '../stores/progress.ts'
import { useSessionStore } from '../stores/session.ts'
import { reconcileInventory } from './inventory.ts'

// Inventory slots are a stable presentation of items owned by the story.
export function useInventory() {
  const { ragTaken, shovel, shovelUsed, note, stashState, questState, inventory, selectedInventorySlot } = storeToRefs(useProgressStore())
  const { droppedItems, rodTaken, mansionRodOwned, collection, riverRodGone, mansionRodTaken } = storeToRefs(useSessionStore())
  const ownedItems = computed<InventoryItem[]>(() => {
    const items: (InventoryItem | null)[] = [
      ragTaken.value ? 'rag' : null,
      shovel.value && !shovelUsed.value && !droppedItems.value.shovel ? 'shovel' : null,
      note.value && !droppedItems.value.photo ? 'photo' : null,
      stashState.value === 'player' && !droppedItems.value.treasure ? 'treasure' : null,
      rodTaken.value && !droppedItems.value.rod ? 'rod' : null,
      mansionRodOwned.value && !droppedItems.value.mansionRod ? 'mansionRod' : null,
      collection.value?.basket ? 'basket' : null,
      collection.value?.bucket ? 'bucket' : null,
    ]
    return items.filter((item): item is InventoryItem => item !== null)
  })
  const hasFishingRod = computed(() => inventory.value.includes('rod') || inventory.value.includes('mansionRod'))
  const canSearchMansionForRod = computed(() => questState.value === 'rejected' && collection.value?.giver === 'captain' && !hasFishingRod.value &&
    ((riverRodGone.value && !mansionRodTaken.value) || droppedItems.value.rod?.location === 'mansion' || droppedItems.value.mansionRod?.location === 'mansion'))
  watch(ownedItems, items => {
    const selected = inventory.value[selectedInventorySlot.value]
    inventory.value = reconcileInventory(inventory.value, items)
    if (selected && !inventory.value.includes(selected)) selectedInventorySlot.value = -1
  }, { flush: 'sync' })
  return { ownedItems, hasFishingRod, canSearchMansionForRod }
}
