export function createArrest(cause, player, width) {
  if (!['cannabis', 'mushrooms'].includes(cause)) throw new Error('Unknown arrest cause')
  const offset=player.x + 58 < width - 12 ? 58 : -58
  return { cause, phase:'approach', x:player.x + offset, y:player.y }
}

export function validArrest(value) {
  return !!value && ['cannabis','mushrooms'].includes(value.cause) && ['approach','dialog'].includes(value.phase) && Number.isFinite(value.x) && Number.isFinite(value.y)
}

export function advanceArrest(arrest, player, delta) {
  if (arrest.phase !== 'approach') return false
  const dx=player.x-arrest.x, dy=player.y-arrest.y, distance=Math.hypot(dx,dy)
  if (distance <= 18) { arrest.phase='dialog'; return true }
  const step=Math.min(distance-18, Math.max(0,Math.min(delta,50))*.045)
  arrest.x += dx/distance*step; arrest.y += dy/distance*step
  if (Math.hypot(player.x-arrest.x,player.y-arrest.y) <= 18.01) { arrest.phase='dialog'; return true }
  return false
}
