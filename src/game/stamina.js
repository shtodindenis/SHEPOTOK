export const STAMINA_MAX = 100
export const STAMINA_RESTART = 25
export const SPRINT_MULTIPLIER = 1.6
const DRAIN_PER_SECOND = 20, RECOVERY_PER_SECOND = 14

export function updateStamina(value, exhausted, sprinting, deltaMs) {
  const seconds = Math.max(0, Math.min(deltaMs, 50)) / 1000
  const next = Math.max(0, Math.min(STAMINA_MAX, value + (sprinting ? -DRAIN_PER_SECOND : RECOVERY_PER_SECOND) * seconds))
  return { value: next, exhausted: next <= 0 || (exhausted && next < STAMINA_RESTART) }
}
