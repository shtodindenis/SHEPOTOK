import { endings } from './story.js'
import { achievements } from './achievements.js'

const SAVE_KEY = 'shepotok-save'
const ENDINGS_KEY = 'shepotok-endings'
const ACHIEVEMENTS_KEY = 'shepotok-achievements'
const EPISODE_RESULT_KEY = 'shepotok-episode-1-result'
const ENDING_CAUSES_KEY = 'shepotok-ending-causes'

export function writeEndingCause(id, cause) {
  if (typeof id !== 'string' || typeof cause !== 'string') return
  try {
    const parsed=JSON.parse(localStorage.getItem(ENDING_CAUSES_KEY) || '{}')
    const records=parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    const causes=Array.isArray(records[id]) ? records[id].filter(value => typeof value === 'string') : []
    records[id]=[...new Set([...causes,cause])]
    localStorage.setItem(ENDING_CAUSES_KEY,JSON.stringify(records))
  } catch { /* Gameplay continues without storage. */ }
}

export function writeEpisodeResult(member) {
  try { localStorage.setItem(EPISODE_RESULT_KEY, JSON.stringify({ completed:true, societyMember:!!member })) } catch { /* Gameplay continues without storage. */ }
}
export function readEpisodeResult() {
  try {
    const value=JSON.parse(localStorage.getItem(EPISODE_RESULT_KEY))
    return value?.completed === true && typeof value.societyMember === 'boolean' ? value : null
  } catch { return null }
}

function validateSave(data) {
    if (!data || !Number.isInteger(data.stage) || data.stage < 0 || data.stage >= 4 ||
        !['home', 'village', 'hut', 'forest', 'river', 'society', 'society_village', 'mansion', 'detention'].includes(data.location) ||
        !Number.isFinite(data.player?.x) || !Number.isFinite(data.player?.y)) return null
    // Before the new digging rules, a miss broke the shovel. If the player
    // never ate a mushroom, they could not have spent it on the wolf instead.
    const legacyMiss = data.rulesVersion !== 2 && data.stage === 1 && data.stashState !== 'witch' && data.shovel === true && data.shovelUsed === true && Number.isInteger(data.wrongDigs) && data.wrongDigs > 0 && !data.trip && !data.mushroomUsed && !data.wolfDefeated
    return {
      ...data,
      // Saves from before the shovel had a durability flag had already used it at stage 2.
      shovelUsed: legacyMiss ? false : typeof data.shovelUsed === 'boolean' ? data.shovelUsed : data.stage >= 2,
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
    return Array.isArray(stored) ? [...new Set(stored.map(id => id === 'crime' ? 'prison' : id).filter(id => endings.some(item => item.id === id)))] : []
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
