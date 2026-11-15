import { Graphics, Sprite, Texture } from 'pixi.js'

export const SOCIETY_WIDTH = 768, SOCIETY_HEIGHT = 512
export const SETTLEMENT_WIDTH = 640, SETTLEMENT_HEIGHT = 400
export const SOCIETY_ENTRY = { x: 40, y: 256 }
export const CAPTAIN = { x: 650, y: 93 }
export const SETTLEMENT_FOREST = { x: 35, y: 300 }
export const SETTLEMENT_HOUSE = { x: 386, y: 220 }

// A distinct seated captain: dark uniform, cap, moustache and gold insignia.
export function drawCaptain(world, x, y) {
  const captain=new Graphics()
  captain.rect(x-8,y-16,16,13).fill(0x30252a)
  captain.rect(x-6,y-14,12,10).fill(0xd6a073)
  captain.rect(x-6,y-8,3,2).rect(x+3,y-8,3,2).fill(0x292529)
  captain.rect(x-4,y-5,8,2).fill(0x493027)
  captain.rect(x-8,y-18,16,4).fill(0x29364a).rect(x-9,y-15,18,2).fill(0x1d2634)
  captain.rect(x-2,y-18,4,2).fill(0xe6bd65)
  captain.rect(x-8,y-3,16,7).fill(0x35495b).rect(x-2,y-3,4,7).fill(0xe1d5bb)
  captain.rect(x-7,y-2,2,2).rect(x+5,y-2,2,2).fill(0xd6ac5b)
  captain.rect(x-8,y+4,7,3).rect(x+1,y+4,7,3).fill(0x242832)
  captain.zIndex=y+4; world.addChild(captain)
}

export function buildSettlement({ world, sprite, sheet, collision, depthGroup }) {
  const ground = new Graphics().rect(0, 0, SETTLEMENT_WIDTH, SETTLEMENT_HEIGHT).fill(0x79ad69)
  // The same layered dirt paths and scattered details used in the village.
  const paths = [
    [[0,300],[95,298],[180,302],[248,282],[300,265],[386,265],[386,218]],
  ]
  const road = (points, width, color) => {
    ground.moveTo(points[0][0],points[0][1])
    for (const [x,y] of points.slice(1)) ground.lineTo(x,y)
    ground.stroke({width,color,cap:'round',join:'round'})
  }
  for (const path of paths) road(path,46,0xa77c53)
  for (const path of paths) road(path,38,0xcfa476)
  world.addChild(ground)
  const details = new Graphics()
  for (let y=20;y<390;y+=23) for (let x=15;x<630;x+=29) {
    const n=(x*71+y*19)%37
    if(n<6) details.rect(x,y,3,1).fill({color:0x4e9755,alpha:.45}).rect(x+2,y-2,1,3).fill({color:0x5a9e54,alpha:.5})
    else if(n===9) details.rect(x,y,2,2).fill(0xe5d997).rect(x+3,y+1,1,1).fill(0xe9bba0)
  }
  for(let x=20;x<180;x+=29) details.rect(x,300+(x%3)*3,3,1).fill({color:0x9e7857,alpha:.48})
  world.addChild(details)
  // Assemble the facade from the same nine house tiles as the village houses.
  const hx=224, hy=15, scale=4, tileSize=16*scale
  world.addChild(new Graphics().ellipse(320,209,112,11).fill({color:0x334f3b,alpha:.2}))
  depthGroup(207,()=>{
    world.addChild(new Graphics().rect(360,145,56,62).fill(0x946243))
    for(let row=0;row<3;row++) for(let col=0;col<3;col++) sprite(sheet,hx+col*tileSize,hy+row*tileSize,col,4+row,scale,false)
    const door=new Graphics().rect(365,159,42,48).fill(0x563d35).rect(368,162,36,45).fill(0x925d3e)
    door.rect(371,165,30,37).fill(0xa77750).rect(395,183,2,3).fill(0xe6c27d)
    world.addChild(door)
  })
  collision.addRect({x:hx,y:hy+18,w:tileSize*3,h:tileSize*3-18})
  for (const [x,y,scale] of [[60,90,2],[130,145,1.8],[510,80,2.2],[575,180,2],[475,300,1.8],[80,370,1.8],[590,365,2]]) {
    world.addChild(new Graphics().ellipse(x,y,14,5).fill({color:0x31513a,alpha:.24}))
    depthGroup(y,()=>{ sprite(sheet,x-8*scale,y-32*scale,4,0,scale,false); sprite(sheet,x-8*scale,y-16*scale,4,1,scale,false) })
    collision.addRect({x:x-5,y:y-12,w:10,h:10})
  }
  depthGroup(285, () => sprite(sheet,72,264,11,6,1.35,false))
  collision.addRect({x:80,y:278,w:5,h:7})
}

const ROOMS = [
  {x:16,y:32,w:232,h:192}, {x:256,y:32,w:248,h:192}, {x:512,y:32,w:240,h:192,captain:true},
  {x:16,y:288,w:232,h:208}, {x:256,y:288,w:248,h:208}, {x:512,y:288,w:240,h:208},
]
export function buildSocietyHouse({ world, sprite, interior, furniture, dungeon, collision, depthGroup, scene }) {
  world.addChild(new Graphics().rect(0,0,SOCIETY_WIDTH,SOCIETY_HEIGHT).fill(0x282832))
  for(let y=32;y<496;y+=16) for(let x=16;x<752;x+=16) {
    const tile=sprite(furniture,x,y,8,2,1,false); tile.tint=(y>=224 && y<288)?0xc5a17f:0xe2c3a2
  }
  const decor=new Graphics().rect(16,239,736,34).fill(0x785044).rect(16,243,736,26).fill(0xa67660)
  for(const room of ROOMS) {
    decor.rect(room.x+24,room.y+75,142,75).fill(room.captain?0x75413e:0x8d655b)
    decor.rect(room.x+28,room.y+79,134,67).fill(room.captain?0xa65e4c:0xb68872)
  }
  world.addChild(decor)
  const walls=[{x:8,y:16,w:752,h:16},{x:8,y:32,w:8,h:464},{x:752,y:32,w:8,h:464},{x:8,y:496,w:752,h:8},
    {x:248,y:32,w:8,h:192},{x:504,y:32,w:8,h:192},{x:248,y:288,w:8,h:208},{x:504,y:288,w:8,h:208}]
  for (const x of [16,256,512]) {
    walls.push({x,y:224,w:72,h:8},{x:x+104,y:224,w:(x===16?136: x===256?152:136),h:8})
    walls.push({x,y:280,w:72,h:8},{x:x+104,y:280,w:(x===16?136: x===256?152:136),h:8})
  }
  for(const r of walls) {
    for(let y=r.y;y<r.y+r.h;y+=8) { const h=Math.min(8,r.y+r.h-y); const wall=new Graphics().rect(r.x,y,r.w,h).fill(0x755847); if(y===r.y) wall.rect(r.x,y,r.w,Math.min(3,h)).fill(0xc7a581); wall.zIndex=y+h; world.addChild(wall) }
    collision.addRect(r)
  }
  for (const x of [16,256,512]) for (const y of [224,280]) {
    const threshold=new Graphics().rect(x+72,y,32,8).fill(0x987153).rect(x+74,y+2,28,3).fill(0xc49a72)
    threshold.zIndex=y+8; world.addChild(threshold)
  }
  function furnishing(x,y,col,row,scale=1.5) { const item=sprite(interior,x,y,col,row,scale,false); item.zIndex=y+16*scale; collision.addRect({x:x+2,y:y+5,w:16*scale-4,h:16*scale-5}) }
  for (const [i,room] of ROOMS.entries()) {
    const bx=room.x+28, by=room.y+20, cx=room.captain?CAPTAIN.x:room.x+92, cy=room.captain?CAPTAIN.y:room.y+60
    depthGroup(by+40,()=>sprite(furniture,bx,by,14,3,room.captain?3:2.5,false))
    collision.addRect({x:bx+4,y:by+5,w:room.captain?42:32,h:room.captain?42:33})
    if (room.captain) {
      // A private suite: a broad patterned carpet, desk, display cabinet and gold trim.
      const suite=new Graphics()
      suite.rect(535,119,184,75).fill(0x572f36).rect(539,123,176,67).fill(0x9c3f3f)
      suite.rect(544,128,166,57).stroke({width:2,color:0xd5a55e})
      suite.rect(622,46,34,20).fill(0x533a2d).rect(625,48,28,14).fill(0x986643)
      suite.rect(628,50,22,9).fill(0xc89b64)
      suite.rect(693,39,34,44).fill(0x5b3a30).rect(697,43,26,36).fill(0x936647)
      suite.rect(701,47,18,13).fill(0x394a4a).rect(701,63,18,12).fill(0x433b37)
      suite.rect(704,48,4,8).fill(0xd8ba79).rect(712,49,4,7).fill(0x9a6150)
      suite.rect(580,35,36,5).fill(0x70423b).rect(582,40,5,22).fill(0x8e3e3c).rect(609,40,5,22).fill(0x8e3e3c)
      suite.rect(587,41,22,17).fill(0x8cabb0).rect(597,41,2,17).fill(0xead6ae)
      suite.zIndex=1; world.addChild(suite)
      collision.addRect({x:622,y:46,w:34,h:20}); collision.addRect({x:693,y:39,w:34,h:44})
      furnishing(725,160,16,0,1.25)
    } else {
      furnishing(room.x+75,room.y+17,10,3); furnishing(room.x+166,room.y+12,12,13); furnishing(room.x+190,room.y+12,13,13)
      furnishing(room.x+185,room.y+110,16,0,1.25)
    }
    const chair=sprite(furniture,cx-12,cy-12,19,2,1.5,false); chair.tint=room.captain?0xef2929:0xff4444; chair.zIndex=cy+2
    collision.addRect({x:cx-8,y:cy-5,w:16,h:12})
    if (room.captain) drawCaptain(world,cx,cy)
    else { const person=sprite(dungeon,cx-10,cy-18,i%4,7,1.25,false); person.zIndex=cy+4; person.scale.y=.95 }
  }
  if(scene.societyProgress===3) { const chair=sprite(furniture,704,125,19,2,1.3,false); chair.tint=0xff4444; chair.zIndex=146 }
  const door=new Graphics().rect(12,240,8,32).fill(0x50382d).rect(14,243,5,26).fill(0xb0835a); door.zIndex=273; world.addChild(door)
}

export function addSocietyLighting(world) {
  const canvas=document.createElement('canvas'); canvas.width=SOCIETY_WIDTH; canvas.height=SOCIETY_HEIGHT
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#999396'; ctx.fillRect(0,0,canvas.width,canvas.height)
  const fixtures=new Graphics()
  for(const room of ROOMS) {
    const x=room.x+room.w/2, y=room.y+67
    ctx.save(); ctx.beginPath(); ctx.rect(room.x,room.y,room.w,room.h); ctx.clip()
    const glow=ctx.createRadialGradient(x,y,4,x,y,145); glow.addColorStop(0,room.captain?'rgba(255,221,164,.98)':'rgba(255,238,206,.94)'); glow.addColorStop(.38,'rgba(244,209,170,.62)'); glow.addColorStop(1,'rgba(218,173,143,0)'); ctx.fillStyle=glow; ctx.fillRect(room.x,room.y,room.w,room.h); ctx.restore()
    const lampY=room.y+9
    fixtures.circle(x,lampY,6).fill({color:0xffd894,alpha:.12}).circle(x,lampY,3).fill({color:0xffe9b5,alpha:.8}).circle(x,lampY,1).fill(0xfff6d5)
  }
  for(const x of [120,320,520,700]) { const glow=ctx.createRadialGradient(x,256,2,x,256,85); glow.addColorStop(0,'rgba(255,230,192,.7)'); glow.addColorStop(1,'rgba(255,220,180,0)'); ctx.fillStyle=glow; ctx.fillRect(x-85,232,170,48); fixtures.circle(x,248,2).fill({color:0xffe4ab,alpha:.7}) }
  fixtures.zIndex=99999; world.addChild(fixtures)
  const light=new Sprite(Texture.from(canvas)); light.blendMode='multiply'; light.zIndex=100000; world.addChild(light)
}
