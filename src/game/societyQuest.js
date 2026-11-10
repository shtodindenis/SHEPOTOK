export const QUEST_STATES = ['none','tail_ready','tail','report1','heist_ready','heist','report2','chairs','done']
const RETURN_ROUTE = [{x:512,y:464},{x:512,y:352},{x:512,y:208},{x:336,y:208},{x:336,y:320},{x:160,y:320},{x:160,y:224},{x:35,y:224}]
export const TAIL_ROUTE = [{x:704,y:224},{x:704,y:352},{x:512,y:352},{x:512,y:464},{x:592,y:464},...RETURN_ROUTE]
export { inMansionShadow as inShadow } from './mansionLayout.js'
export const SEATS = [{x:136,y:116},{x:160,y:116},{x:184,y:116}]
export function createTail(mode = 'buried') { return { x:850, y:224, waypoint:0, elapsed:0, digging:0, dug:mode === 'carrying', lost:0, mode, route:mode === 'carrying' ? [{x:704,y:224},{x:704,y:352},{x:512,y:352},...RETURN_ROUTE.slice(2)] : TAIL_ROUTE } }
export function updateTail(tail, dt, player, hidden) {
  dt = Math.min(dt, 50); tail.elapsed += dt
  if (tail.waypoint === 5 && !tail.dug) { tail.digging += dt; if (tail.digging >= 2600) tail.dug = true }
  else {
    const target = tail.route[tail.waypoint], dx = target.x-tail.x, dy = target.y-tail.y, d = Math.hypot(dx,dy), step = dt * .018
    if (d <= step) { tail.x=target.x; tail.y=target.y; tail.waypoint++ } else { tail.x+=dx/d*step; tail.y+=dy/d*step }
  }
  const dx = Math.abs(player.x-tail.x), dy = Math.abs(player.y-tail.y), distance = Math.hypot(dx,dy)
  tail.lost = dx > 150 || dy > 82 ? tail.lost + dt : 0
  if (tail.lost >= 1000) return 'lost'
  if (tail.elapsed % 7500 > 5600 && distance < 60 && !hidden) return 'seen'
  if (tail.waypoint >= tail.route.length) return dx > 150 || dy > 82 ? 'lost' : 'success'
  return null
}
export function createChairs() { return { round:1, phase:'music', elapsed:0, angle:0 } }
export function advanceChairs(game, dt) {
  game.elapsed += Math.min(dt, 50); game.angle += Math.min(dt,50)*.0014
  if (game.phase === 'music' && game.elapsed >= 6500) { game.phase='stop'; game.elapsed=0; return 'stopped' }
  if (game.phase === 'stop' && game.elapsed >= 3000) return 'failed'
  return null
}
export function sitDown(game, player) {
  if (game.phase !== 'stop' || !SEATS.slice(0,4-game.round).some(s => Math.hypot(s.x-player.x,s.y-player.y)<25)) return false
  if (game.round === 3) return 'won'
  game.round++; game.phase='music'; game.elapsed=0; return 'next'
}
