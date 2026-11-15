import {FOREST_PATHS, STASH_SPOTS, stashRoute, FOREST_SOLIDS, nearRoute} from './src/game/forestMap.js'
import {createTail} from './src/game/societyQuest.js'
const routes=STASH_SPOTS.map((_,i)=>createTail('buried',i).route)
let a=[]
for(let y=70;y<580;y+=28) for(let x=60;x<900;x+=28){let n={x:x+8,y:y+8};if(FOREST_PATHS.some(p=>nearRoute(n.x,n.y,p,17)) && routes.every(p=>!nearRoute(n.x,n.y,p,26)) && FOREST_SOLIDS.every(r=>n.x<r.x-12||n.x>r.x+r.w+12||n.y<r.y-12||n.y>r.y+r.h+12) && a.every(p=>Math.hypot(x-p.x,y-p.y)>45)) a.push({x,y})}
console.log(a.slice(0,30))
