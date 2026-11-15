import {chromium} from 'playwright-core'
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-angle=swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}})
p.on('pageerror',e=>console.log('ERROR',e.message))
const detention={cause:'cannabis',cellOpen:true,cellRemaining:12000,shovelFound:true,choice:null,alarm:false,guardTime:0,quizIndex:0,quizCorrect:true,quizDone:false}
const arthouse={phase:'day',day:3,eaten:2,consumed:[0,1,2,3,4,5],mayo:[0,0,0,0,0,0,0,0],death:null}
const base={stage:1,shovel:true,shovelUsed:false,shovelPermission:true,note:true,mushroomUsed:true,firstMushroom:0,stashState:'buried',forestVersion:5,homeVersion:1,hutVersion:2,villageVersion:1,societyVersion:1}
for(const [name,s] of [
 ['sizo-kamera',{...base,stage:2,note:false,shovel:true,shovelUsed:true,location:'detention',player:{x:105,y:98},detention:{...detention,cellOpen:false,shovelFound:false},stashState:'evidence'}],
 ['sizo-veshdoki',{...base,stage:2,note:false,shovel:true,shovelUsed:true,location:'detention',player:{x:575,y:183},detention,stashState:'evidence'}],
 ['sizo-koridor',{...base,stage:2,note:false,shovel:true,shovelUsed:true,location:'detention',player:{x:592,y:300},detention,stashState:'evidence'}],
 ['arthouse-derevnya',{...base,location:'village',player:{x:306,y:170},trip:true,arthouse}],
 ['arthouse-les',{...base,location:'forest',player:{x:700,y:275},trip:true,arthouse}],
]){await p.goto('http://localhost:5173/');await p.evaluate(s=>localStorage.setItem('shepotok-save',JSON.stringify(s)),s);await p.getByText('ПРОДОЛЖИТЬ').click();await p.waitForTimeout(1300);await p.screenshot({path:`${name}.png`})}
await b.close()
