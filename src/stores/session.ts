import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ArrestState } from '../game/arrest.ts'
import type { ArthouseState } from '../game/arthouse.ts'
import type { DetentionState } from '../game/detentionState.ts'
import type { FishingState } from '../game/fishing.ts'
import type { UrgencyState } from '../game/urgency.ts'
import type { QuizCheckpoint } from '../game/wellQuiz.ts'
import { STAMINA_MAX } from '../game/stamina.ts'

export interface CollectionState {
  giver: 'witch' | 'captain'
  basket: boolean
  bucket: boolean
  collected: number[]
  fish: string[]
  crucians: number
  arrested: boolean
  completed?: boolean
}
export interface DroppedItem { location: string; x: number; y: number }

// Mutable state of the current run. Serialization and legacy migration remain
// explicit in the game controller; no automatic Pinia persistence is used.
export const useSessionStore = defineStore('session', () => {
  const urgency = ref<UrgencyState | null>(null)
  const stamina = ref(STAMINA_MAX)
  const detention = ref<DetentionState | null>(null)
  const arrest = ref<ArrestState | null>(null)
  const arthouse = ref<ArthouseState | null>(null)
  const collection = ref<CollectionState | null>(null)
  const firstMushroom = ref(0)
  const riverRodGone = ref(false)
  const mansionRodTaken = ref(false)
  const mansionRodOwned = ref(false)
  const cursedOnce = ref(false)
  const witchMurder = ref<string | null>(null)
  const witchAngryReason = ref<string | null>(null)
  const photoConfiscated = ref(false)
  const ragConfiscated = ref(false)
  const witchMushroomsArrested = ref(false)
  const pendingFatal = ref<string | null>(null)
  const pendingDiver = ref('')
  const quiz = ref<QuizCheckpoint | null>(null)
  const rodTaken = ref(false)
  const droppedRag = ref<DroppedItem | null>(null)
  const droppedItems = ref<Record<string, DroppedItem>>({})
  const fishing = ref<FishingState | null>(null)
  return { urgency, stamina, detention, arrest, arthouse, collection, firstMushroom,
    riverRodGone, mansionRodTaken, mansionRodOwned, cursedOnce, witchMurder,
    witchAngryReason, photoConfiscated, ragConfiscated, witchMushroomsArrested,
    pendingFatal, pendingDiver, quiz, rodTaken, droppedRag, droppedItems, fishing }
})
