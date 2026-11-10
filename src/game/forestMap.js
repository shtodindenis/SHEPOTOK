export const FOREST_WIDTH = 960, FOREST_HEIGHT = 640
export const FOREST_ENTRY = { x: 40, y: 224 }, FOREST_EAST = { x: 920, y: 224 }
export const STASH = { x: 592, y: 464 }, CAMP = { x: 192, y: 520 }

// Straight segments form a narrow, winding trail and the side path to the cache.
export const MAIN_TRAIL = [
  {x:0,y:224},{x:160,y:224},{x:160,y:320},{x:336,y:320},
  {x:336,y:208},{x:512,y:208},{x:512,y:352},{x:704,y:352},
  {x:704,y:224},{x:960,y:224},
]
export const CACHE_TRAIL = [{x:512,y:352},{x:512,y:464},{x:592,y:464}]
function nearRoute(x, y, points, radius) {
  return points.slice(1).some((b, i) => {
    const a = points[i], dx = b.x-a.x, dy = b.y-a.y
    const t = Math.max(0, Math.min(1, ((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)))
    return Math.hypot(x-(a.x+t*dx), y-(a.y+t*dy)) <= radius
  })
}
export function forestRoad(x, y) { return nearRoute(x+8, y+8, MAIN_TRAIL, 23) || nearRoute(x+8, y+8, CACHE_TRAIL, 23) }
export const forestTrees = []
for (let row = 0; row < 19; row++) for (let col = 0; col < 29; col++) {
  const x = 8 + col*33 + (row%2)*8, y = 20 + row*32 + (col%3)*2
  const centerX=x+8, feetY=y+28
  const safeRoute = nearRoute(centerX, feetY, MAIN_TRAIL, 38) || nearRoute(centerX, feetY, CACHE_TRAIL, 38)
  const campAccess = nearRoute(centerX, feetY, [{x:160,y:320},{x:160,y:440},{x:192,y:520}], 30)
  const clearing = Math.hypot(centerX-STASH.x, feetY-STASH.y)<66 || Math.hypot(centerX-CAMP.x, feetY-CAMP.y)<82
  const entry = Math.hypot(centerX-180, feetY-190)<28
  if (!safeRoute && !campAccess && !clearing && !entry && (col*7+row*11)%9 !== 0)
    forestTrees.push({x,y,col:(col*3+row*5)%7===0?3:4})
}
export function behindTree(player) {
  return forestTrees.some(t => Math.abs(player.x-(t.x+8))<25 && player.y>=t.y+8 && player.y<=t.y+50)
}
