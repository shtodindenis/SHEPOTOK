import { endings } from './story.js'
import { achievements } from './achievements.js'

const SAVE_KEY = 'shepotok-save'
const ENDINGS_KEY = 'shepotok-endings'
const ACHIEVEMENTS_KEY = 'shepotok-achievements'

function validateSave(data) {
    if (!data || !Number.isInteger(data.stage) || data.stage < 0 || data.stage >= 4 ||
        !['home', 'village', 'hut', 'forest', 'river', 'society', 'society_village', 'mansion'].includes(data.location) ||
        !Number.isFinite(data.player?.x) || !Number.isFinite(data.player?.y)) return null
    return {
      ...data,
      // Saves from before the shovel had a durability flag had already used it at stage 2.
      shovelUsed: typeof data.shovelUsed === 'boolean' ? data.shovelUsed : data.stage >= 2,
      wolfDefeated: !!data.wolfDefeated,
    }
}

export function readSave() {
  try { return validateSave(JSON.parse(localStorage.getItem(SAVE_KEY))) } catch { return null }
}

export function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch { /* Storage can be unavailable. */ }
}

export function readSlots() {
  return Array.from({ length: 5 }, (_, index) => {
    try {
      const stored = JSON.parse(localStorage.getItem(`shepotok-slot-${index + 1}`)), data = validateSave(stored?.data)
      return data && Number.isFinite(stored.savedAt) ? { data, savedAt:stored.savedAt } : null
    } catch { return null }
  })
}
export function writeSlot(index, data) {
  if (!Number.isInteger(index) || index < 0 || index >= 5 || !validateSave(data)) return false
  try { localStorage.setItem(`shepotok-slot-${index + 1}`, JSON.stringify({ savedAt: Date.now(), data })); return true } catch { return false }
}

export function readEndings() {
  try {
    const stored = JSON.parse(localStorage.getItem(ENDINGS_KEY) || '[]')
    return Array.isArray(stored) ? [...new Set(stored.filter(id => endings.some(item => item.id === id)))] : []
  } catch { return [] }
}

export function writeEndings(ids) {
  try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(ids)) } catch { /* Gameplay continues without storage. */ }
}

export function readAchievements() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]')
    return Array.isArray(stored) ? [...new Set(stored.filter(id => achievements.some(item => item.id === id)))] : []
  } catch { return [] }
}
export function writeAchievements(ids) {
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids)) } catch { /* Gameplay continues without storage. */ }
}
