export const FOREST_WIDTH = 960, FOREST_HEIGHT = 640
export const FOREST_ENTRY = { x: 40, y: 224 }, FOREST_EAST = { x: 920, y: 224 }
export const RIVER_PATH_ENTRY = {x:880,y:604}
export const CAMP = { x: 192, y: 520 }
// Each spot is below its own tree, well away from the entrance and camp.
export const STASH_SPOTS = [
  {x:572,y:405}, {x:630,y:540}, {x:700,y:405}, {x:770,y:540},
  {x:798,y:405}, {x:680,y:570}, {x:820,y:570},
]
export const STASH = STASH_SPOTS[0]
export const stashAt = index => STASH_SPOTS[Number.isInteger(index) && index >= 0 && index < STASH_SPOTS.length ? index : 0]
export const MAIN_TRAIL = [
  {x:0,y:224},{x:160,y:224},{x:160,y:320},{x:336,y:320},
  {x:336,y:208},{x:512,y:208},{x:512,y:352},{x:704,y:352},
  {x:704,y:224},{x:960,y:224},
]
export const CACHE_TRAIL = [{x:512,y:352},{x:512,y:464},{x:850,y:464}]
export const RIVER_TRAIL = [{x:840,y:224},{x:880,y:270},{x:880,y:604}]
export const SIDE_TRAILS = [
  RIVER_TRAIL,
  [{x:336,y:208},{x:365,y:160},{x:415,y:145}],
  [{x:704,y:224},{x:750,y:190},{x:802,y:192}],
]
export const FOREST_PATHS = [MAIN_TRAIL,CACHE_TRAIL,...SIDE_TRAILS]
export function nearRoute(x, y, points, radius) {
  return points.slice(1).some((b, i) => {
    const a = points[i], dx = b.x-a.x, dy = b.y-a.y
    const t = Math.max(0, Math.min(1, ((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)))
    return Math.hypot(x-(a.x+t*dx), y-(a.y+t*dy)) <= radius
  })
}
export function forestRoad(x, y) { return FOREST_PATHS.some((path,i) => nearRoute(x+8,y+8,path,i===0?17:12)) }
export const forestTrees = []
for (let row=0;row<16;row++) for(let col=0;col<24;col++) {
  const x=18+col*40+(row%2)*13+((row*17+col*11)%13)-6, y=40+row*38+(col%3)*3+((row*7+col*13)%11)-5
  const safe=FOREST_PATHS.some((path,i)=>nearRoute(x,y,path,i===0?37:31)) || STASH_SPOTS.some(p=>nearRoute(x,y,[{x:p.x,y:464},p],24))
  const clearing=Math.hypot(x-CAMP.x,y-CAMP.y)<45 || STASH_SPOTS.some(p=>Math.hypot(x-p.x,y-p.y)<35)
  if (!safe && !clearing && (col*7+row*11)%8!==0 && x<945 && y<630) {
    const n=col*7+row*11
    forestTrees.push({x:x-8,y:y-32,scale:[1.65,1.9,2.1,1.8][n%4],tint:[0xffffff,0xcde9c5,0xe0e8bf,0xb9d9bd][n%4],col:n%5===0?3:4,flip:n%3===0})
  }
}
// Put the landmark trunk on the far side of its dig point, clear of the trail.
for (const [i,p] of STASH_SPOTS.entries()) forestTrees.push({x:p.x-8,y:p.y+(p.y>464 ? 1 : -56),scale:2.1,tint:[0xe5e8bf,0xcde9c5,0xffffff][i%3],col:i%2?3:4,flip:i%2===1, landmark:true})
export const FOREST_SOLIDS = forestTrees.map(t=>({x:t.x+8-3.5*t.scale,y:t.y+32-10*t.scale,w:7*t.scale,h:8*t.scale}))
// A small set of visible fly agarics, each offering the same one-time effect.
export const FOREST_MUSHROOMS = [
  {x:180,y:184}, {x:282,y:277}, {x:365,y:238}, {x:478,y:244},
  {x:554,y:312}, {x:654,y:385}, {x:748,y:180}, {x:865,y:245},
]
export const FOREST_LOGS = []
for(let y=55;y<600;y+=59) for(let x=35;x<930;x+=71) {
  if ((x*7+y*3)%11>7 || FOREST_PATHS.some(path=>nearRoute(x+8,y+12,path,35)) ||
      Math.hypot(x-CAMP.x,y-CAMP.y)<80 || STASH_SPOTS.some(p=>Math.hypot(x-p.x,y-p.y)<45) ||
      FOREST_MUSHROOMS.some(p=>Math.hypot(x-p.x,y-p.y)<30) ||
      FOREST_SOLIDS.some(r=>x+17>=r.x-2 && x<=r.x+r.w+2 && y+17>=r.y-2 && y<=r.y+r.h+2)) continue
  FOREST_LOGS.push({x,y})
}
export const FOREST_PROP_SOLIDS = [
  ...FOREST_MUSHROOMS.map(({x,y})=>({x:x+2,y:y+10,w:12,h:5})),
  ...FOREST_LOGS.map(({x,y})=>({x:x+2,y:y+9,w:13,h:6})),
]
export function behindTree(player) {
  return forestTrees.some(t => Math.abs(player.x-(t.x+8))<25 && player.y>=t.y+8 && player.y<=t.y+50)
}
export function stashRoute(index) {
  const p=stashAt(index), route=[{x:512,y:464},{x:p.x,y:464}]
  if (p.y!==464) route.push({x:p.x,y:p.y})
  return route
}
