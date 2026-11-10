export const URGENCY_TIME = 60000
export const CHECK_DURATION = 2600
const interval = random => 5000 + random() * 10000
export function createUrgency(random = Math.random) {
  return { remaining:URGENCY_TIME, elapsed:0, next:interval(random), check:null, feedback:'' }
}
export function validUrgency(value) {
  return value && Number.isFinite(value.remaining) && value.remaining > 0 && value.remaining <= 120000 && Number.isFinite(value.elapsed) && value.elapsed >= 0 && Number.isFinite(value.next) && value.next >= 0 && (!value.check || (Number.isFinite(value.check.elapsed) && value.check.elapsed >= 0 && value.check.elapsed < CHECK_DURATION && Number.isFinite(value.check.center) && value.check.center >= 0 && value.check.center < 1 && Number.isFinite(value.check.width) && value.check.width >= .08 && value.check.width <= .3))
}
export function resolveUrgencyCheck(game, random = Math.random, forcedMiss = false) {
  if (!game.check) return null
  const { elapsed, center, width } = game.check
  const cursor = elapsed / CHECK_DURATION
  const distance = Math.abs(((cursor-center+1.5)%1)-.5)
  const result = forcedMiss || distance > width/2 ? 'miss' : distance <= width/6 ? 'perfect' : 'hit'
  game.remaining = Math.max(0, game.remaining + (result === 'perfect' ? 5000 : result === 'miss' ? -5000 : 0))
  game.feedback = result; game.check = null; game.next = interval(random)
  return result
}
export function advanceUrgency(game, delta, random = Math.random) {
  const dt = Math.max(0, delta)
  game.remaining = Math.max(0, game.remaining-dt); game.elapsed += dt
  if (game.remaining <= 0) return 'expired'
  if (game.check) {
    game.check.elapsed += dt
    if (game.check.elapsed >= CHECK_DURATION) resolveUrgencyCheck(game,random,true)
  } else {
    game.next -= dt
    if (game.next <= 0) {
      game.next = 0
      game.check = { elapsed:0, center:random(), width:.28-.16*Math.min(1,game.elapsed/URGENCY_TIME) }
      game.feedback = ''; return 'check'
    }
  }
  return game.remaining <= 0 ? 'expired' : null
}
