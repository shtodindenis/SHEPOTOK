import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GameScreen = 'title' | 'game' | 'diving' | 'slots' | 'gallery' | 'achievements'
  | 'battle-ready' | 'battle' | 'ambulance' | 'sleep' | 'arthouse_walk' | 'evidence_scene'
  | 'witch_attack' | 'ominous' | 'scare' | 'ending'
export type GameLocation = 'home' | 'village' | 'hut' | 'forest' | 'river' | 'society'
  | 'society_village' | 'mansion' | 'detention'
export type SlotMode = 'save' | 'load'

// Transient interface state lives separately from persistent story progress.
// DOM nodes, timers, Pixi objects and keyboard state remain in the controller.
export const useInterfaceStore = defineStore('interface', () => {
  const screen = ref<GameScreen>('title')
  const location = ref<GameLocation>('home')
  const sound = ref(true)
  const showFps = ref(false)
  const fps = ref<number | null>(null)
  const near = ref('')
  const transitionActive = ref(false)
  const slotMode = ref<SlotMode>('load')
  const slotNotice = ref('')
  const slotFromGame = ref(false)
  const coords = ref({ x: 1, y: 1 })
  return { screen, location, sound, showFps, fps, near, transitionActive, slotMode, slotNotice, slotFromGame, coords }
})
