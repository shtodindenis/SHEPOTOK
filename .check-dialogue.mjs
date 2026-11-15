import fs from 'node:fs'
import {conversations,endings} from './src/game/story.js'
const code=fs.readFileSync('./src/game/useGame.js','utf8'); const ids=[...code.matchAll(/speak\('([^']+)'/g)].map(x=>x[1]); const missing=[...new Set(ids.filter(x=>!conversations[x]))];console.log('missing conversations:',missing);console.log('ending IDs:',endings.map(x=>x.id).join(', '))
