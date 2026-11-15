export interface PersistedSave { stage: number; location: string; player: { x: number; y: number }; [key: string]: any }

import { endings } from './story.ts'
import { achievements } from './achievements.ts'

const SAVE_KEY = 'shepotok-save'
const ENDINGS_KEY = 'shepotok-endings'
const ACHIEVEMENTS_KEY = 'shepotok-achievements'
const EPISODE_RESULT_KEY = 'shepotok-episode-1-result'
const ENDING_CAUSES_KEY = 'shepotok-ending-causes'

// Storage can be unavailable (private mode, quota, disabled access), and saved
// JSON can be damaged. Keep these failures at the persistence boundary.
function readJson(key: string, fallback: any = null): any {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch { return fallback }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export function writeEndingCause(id: string, cause: string) {
  if (typeof id !== 'string' || typeof cause !== 'string') return
  const parsed = readJson(ENDING_CAUSES_KEY, {})
  const records = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  const causes = Array.isArray(records[id]) ? records[id].filter((value: unknown) => typeof value === 'string') : []
  records[id] = [...new Set([...causes, cause])]
  writeJson(ENDING_CAUSES_KEY, records)
}

export function writeEpisodeResult(member: boolean) {
  writeJson(EPISODE_RESULT_KEY, { completed: true, societyMember: !!member })
}
export function readEpisodeResult() {
  const value = readJson(EPISODE_RESULT_KEY)
  return value?.completed === true && typeof value.societyMember === 'boolean' ? value : null
}

function validateSave(data: PersistedSave | null): PersistedSave | null {
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
  return validateSave(readJson(SAVE_KEY))
}

export function writeSave(data: unknown) {
  writeJson(SAVE_KEY, data)
}

const SLOT_COUNT = 5
const slotKey = (index: number) => `shepotok-slot-${index + 1}`

export function readSlots() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const stored = readJson(slotKey(index))
    const data = validateSave(stored?.data)
    return data && Number.isFinite(stored.savedAt) ? { data, savedAt: stored.savedAt } : null
  })
}
export function writeSlot(index: number, data: PersistedSave) {
  if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT || !validateSave(data)) return false
  return writeJson(slotKey(index), { savedAt: Date.now(), data })
}

function readKnownIds(key: string, known: { id: string }[], migrate: (id: string) => string = id => id) {
  const stored = readJson(key, [])
  if (!Array.isArray(stored)) return []
  const valid = new Set(known.map(item => item.id))
  return [...new Set(stored.map(migrate).filter((id: string) => valid.has(id)))]
}

export function readEndings() {
  return readKnownIds(ENDINGS_KEY, endings, id => id === 'crime' ? 'prison' : id)
}

export function writeEndings(ids: string[]) { writeJson(ENDINGS_KEY, ids) }

export function readAchievements() { return readKnownIds(ACHIEVEMENTS_KEY, achievements) }
export function writeAchievements(ids: string[]) { writeJson(ACHIEVEMENTS_KEY, ids) }
