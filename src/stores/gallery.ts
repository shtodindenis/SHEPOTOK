import { defineStore } from 'pinia'
import { ref } from 'vue'
import { achievements } from '../game/achievements.ts'
import { readAchievements, readEndings, writeAchievements, writeEndings } from '../game/storage.ts'

export const useGalleryStore = defineStore('gallery', () => {
  const unlocked = ref<string[]>(readEndings())
  const achievementUnlocked = ref<string[]>(readAchievements())
  // Existing ending records prove these achievements even in older saves.
  for (const [ending, achievement] of [['diver', 'diver'], ['curse', 'inhalation']]) {
    if (unlocked.value.includes(ending) && !achievementUnlocked.value.includes(achievement)) achievementUnlocked.value.push(achievement)
  }
  writeAchievements(achievementUnlocked.value)

  function unlockEnding(id: string) {
    if (!unlocked.value.includes(id)) unlocked.value = [...unlocked.value, id]
    writeEndings(unlocked.value)
  }
  function unlockAchievement(id: string) {
    if (achievementUnlocked.value.includes(id)) return null
    const item = achievements.find(entry => entry.id === id)
    if (!item) return null
    achievementUnlocked.value = [...achievementUnlocked.value, id]
    writeAchievements(achievementUnlocked.value)
    return item
  }
  return { unlocked, achievementUnlocked, unlockEnding, unlockAchievement }
})
