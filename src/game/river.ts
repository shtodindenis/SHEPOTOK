import { Graphics, Sprite } from 'pixi.js'
export const RIVER_WIDTH=640, RIVER_HEIGHT=384, RIVER_ENTRY={x:320,y:55}
export const RIVER_ROD={x:205,y:200}, RIVER_FISHER={x:456,y:225}, SHORE_Y=260
export function canFishAtRiver(p) { return p.y>=215 && p.y<=255 }
export function buildRiver({world,sprite,sheet,dungeon,collision,depthGroup,scene,riverBoat,fishingRod}) {
  const g=new Graphics().rect(0,0,640,384).fill(0x719f60)
  g.moveTo(320,0).lineTo(322,90).lineTo(300,150).lineTo(305,250).stroke({width:30,color:0x97794f,cap:'round',join:'round'})
  g.moveTo(320,0).lineTo(322,90).lineTo(300,150).lineTo(305,250).stroke({width:22,color:0xb89a6d,cap:'round',join:'round'})
  g.rect(0,258,640,126).fill(0x387d8e).rect(0,260,640,4).fill(0xb8b08a)
  for(let y=275;y<380;y+=19) for(let x=(y%3)*14;x<640;x+=65) g.rect(x,y,23,2).fill({color:0x9bced0,alpha:.28}).rect(x+25,y+3,8,1).fill({color:0x98c4c0,alpha:.3})
  for(let x=12;x<630;x+=33) { const y=245+(x*7)%7; g.rect(x,y,4,2).fill(0x8d7f5d).rect(x+8,y+4,2,2).fill(0xd6cba2) }
  for(let y=35;y<240;y+=22) for(let x=18;x<630;x+=29) {
    const n=(x*19+y*23)%43
    if(n<7) g.rect(x,y,3,1).fill({color:0x498a50,alpha:.6}).rect(x+2,y-2,1,3).fill({color:0x609b58,alpha:.7})
    else if(n===9) g.rect(x,y,2,2).fill(0xd9d9a1)
  }
  // Reeds along the shore break up the edge without blocking access.
  for(const x of [24,29,158,163,364,369,565,570]) g.rect(x,250,2,9).fill(0x638a53).rect(x-1,247,3,4).fill(0x6a563c)
  world.addChild(g)
  for(const [i,[x,y]] of [[35,135],[85,125],[135,150],[200,110],[255,100],[380,105],[435,115],[500,130],[570,100],[620,145],[55,230],[125,225],[535,210],[605,225]].entries()) {
    const scale=[1.7,2,2.1][i%3], left=x-8*scale,top=y-32*scale
    world.addChild(new Graphics().ellipse(x,y-2,12*scale,4*scale).fill({color:0x31543a,alpha:.24}))
    depthGroup(y-2*scale,()=>{ for(let row=0;row<2;row++){ const t=sprite(sheet,left,top+row*16*scale,i%4===0?3:4,row,scale,false);t.tint=[0xffffff,0xd1e9c3,0xe0e8bf][i%3] } })
    collision.addRect({x:x-3.5*scale,y:y-10*scale,w:7*scale,h:8*scale})
  }
  // A moored boat, with water continuing to the lower edge of the scene.
  world.addChild(new Graphics().ellipse(485,279,37,7).fill({color:0x244e59,alpha:.28}))
  const boat=new Sprite(riverBoat);boat.x=452;boat.y=255;boat.width=66;boat.height=27;boat.zIndex=280;world.addChild(boat)
  depthGroup(RIVER_FISHER.y+4,()=>sprite(dungeon,RIVER_FISHER.x-8,RIVER_FISHER.y-15,2,8,1.25,false))
  collision.addRect({x:RIVER_FISHER.x-6,y:RIVER_FISHER.y-6,w:12,h:10})
  if(!scene.rodTaken) {
    const rod=new Sprite(fishingRod);rod.anchor.set(.5);rod.x=RIVER_ROD.x;rod.y=RIVER_ROD.y-2;rod.width=25;rod.height=25;rod.zIndex=RIVER_ROD.y+5;world.addChild(rod)
  }
  collision.addRect({x:0,y:SHORE_Y,w:640,h:124})
}
