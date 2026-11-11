// Both floors share one coordinate system; all geometry and interaction points live here.
export const MANSION_WIDTH = 768, MANSION_HEIGHT = 896, FLOOR_HEIGHT = 448
export const MANSION_ENTRY = { x: 45, y: 224 }
export const MANSION_STAIRS = [{x:720,y:224},{x:720,y:672}]
export const MANSION_CHAIR = { x: 684, y: 546 }
const floorWalls = (o) => [
  {x:0,y:o,w:768,h:24},{x:0,y:o+432,w:768,h:16},
  {x:0,y:o+24,w:16,h:408},{x:752,y:o+24,w:16,h:408},
  ...[256,512].flatMap(x=>[{x,y:o+24,w:8,h:152},{x,y:o+272,w:8,h:160}]),
  ...[16,264,520].flatMap(x=>[
    {x,y:o+176,w:88,h:8},{x:x+136,y:o+176,w:96,h:8},
    {x,y:o+264,w:88,h:8},{x:x+136,y:o+264,w:96,h:8},
  ]),
]
export const MANSION_WALLS = [...floorWalls(0),...floorWalls(FLOOR_HEIGHT)]
// Furniture has one footprint, shared by drawing, collision and hiding interactions.
const furniture = [
  // Floor 1: living room, library, dining room / entrance, servants' room, kitchen.
  [112,42,32,24,'fireplace'],[160,100,27,28,'armchair'],[34,42,72,30,'sofa'],[160,42,55,25,'bookcase'],[64,108,46,22,'table'],[188,112,28,28,'plant'],
  [280,113,28,25,'globe'],[450,105,25,26,'armchair'],[280,40,64,26,'bookcase'],[424,40,62,26,'bookcase'],[330,98,70,26,'desk'],[460,110,22,28,'plant'],
  [540,44,62,25,'cabinet'],[625,89,78,38,'dining'],[710,44,28,25,'cabinet'],
  [150,290,22,24,'mirror'],[35,292,58,26,'wardrobe'],[155,365,45,24,'table'],[207,294,26,27,'plant'],
  [372,290,35,25,'cabinet'],[290,290,48,42,'bed'],[431,289,54,25,'wardrobe'],[335,369,55,24,'table'],
  [540,350,35,27,'cabinet'],[540,290,90,25,'kitchen'],[655,290,64,25,'kitchen'],[610,361,68,28,'table'],
  // Floor 2: guest bedroom, gallery, study / bath, master bedroom, dressing room.
  [100,490,28,23,'cabinet'],[35,490,55,47,'bed'],[158,490,55,26,'wardrobe'],[64,555,44,23,'table'],
  [282,489,62,26,'bookcase'],[427,489,58,26,'cabinet'],[329,553,70,26,'table'],
  [607,490,22,20,'globe'],[540,490,59,26,'bookcase'],[634,504,90,28,'desk'],[541,552,53,26,'wardrobe'],
  [171,790,26,27,'toilet'],[37,739,78,34,'bath'],[168,740,45,25,'cabinet'],[76,811,36,24,'sink'],
  [365,740,32,24,'mirror'],[285,740,70,48,'bed'],[426,740,54,26,'wardrobe'],[370,817,48,24,'table'],
  [540,740,60,26,'wardrobe'],[650,740,64,26,'cabinet'],[580,813,65,24,'sofa'],
]
export const MANSION_FURNITURE = furniture.map(([x,y,w,h,kind])=>({x,y,w,h,kind}))
export const MANSION_DETAIL_COLLISIONS = [
  ...[0,1].flatMap(floor => [[230,56],[478,80],[228,364],[492,378],[724,360]].map(([x,y]) => ({x:x-4,y:y+4+floor*FLOOR_HEIGHT,w:8,h:8}))),
  ...[14,38,62].flatMap(dx => [{x:625+dx,y:80,w:12,h:7},{x:625+dx,y:129,w:12,h:7}]),
]
export const MANSION_HIDING = [
  {x:60,y:325,label:'СПРЯТАТЬСЯ В ШКАФУ'}, {x:87,y:137,label:'СПРЯТАТЬСЯ ПОД СТОЛОМ'},
  {x:359,y:132,label:'СПРЯТАТЬСЯ ПОД СТОЛОМ'}, {x:665,y:136,label:'СПРЯТАТЬСЯ ПОД СТОЛОМ'},
  {x:457,y:322,label:'СПРЯТАТЬСЯ В ШКАФУ'}, {x:643,y:397,label:'СПРЯТАТЬСЯ ПОД СТОЛОМ'},
  {x:185,y:523,label:'СПРЯТАТЬСЯ В ШКАФУ'}, {x:68,y:545,label:'СПРЯТАТЬСЯ ПОД КРОВАТЬЮ'},
  {x:567,y:585,label:'СПРЯТАТЬСЯ В ШКАФУ'}, {x:640,y:541,label:'СПРЯТАТЬСЯ ПОД СТОЛОМ'},
  {x:453,y:773,label:'СПРЯТАТЬСЯ В ШКАФУ'}, {x:320,y:795,label:'СПРЯТАТЬСЯ ПОД КРОВАТЬЮ'},
  {x:570,y:773,label:'СПРЯТАТЬСЯ В ШКАФУ'},
]
export const PATROL_ROUTE = [
  {x:380,y:224},{x:128,y:224},{x:128,y:150},{x:128,y:224},
  {x:128,y:300},{x:128,y:224},{x:376,y:224},{x:376,y:150},
  {x:376,y:224},{x:640,y:224},{x:640,y:150},{x:640,y:224},{x:700,y:224},
]
export function createMansionPatrol(floor=0) { return { x:380,y:224+floor*FLOOR_HEIGHT,target:1,floor } }
export function advanceMansionPatrol(patrol, delta, move) {
  const target=PATROL_ROUTE[patrol.target], tx=target.x, ty=target.y+patrol.floor*FLOOR_HEIGHT
  const dx=tx-patrol.x, dy=ty-patrol.y, distance=Math.hypot(dx,dy), step=Math.min(distance,Math.min(delta,50)*.032)
  if(distance>0) move(patrol,dx/distance*step,dy/distance*step)
  if(Math.hypot(tx-patrol.x,ty-patrol.y)<1) {
    if(patrol.target===PATROL_ROUTE.length-1) { patrol.floor=1-patrol.floor; patrol.y=224+patrol.floor*FLOOR_HEIGHT }
    patrol.target=(patrol.target+1)%PATROL_ROUTE.length
  }
}
