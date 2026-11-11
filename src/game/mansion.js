import { Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { MANSION_WIDTH, MANSION_HEIGHT, FLOOR_HEIGHT, MANSION_WALLS, MANSION_FURNITURE, MANSION_STAIRS } from './mansionLayout.js'

export function buildMansion({world, sprite, furniture, interior, mansionDecor}) {
  const base=new Graphics().rect(0,0,MANSION_WIDTH,MANSION_HEIGHT).fill(0x211c25)
  world.addChild(base)
  for(let floor=0;floor<2;floor++) {
    const o=floor*FLOOR_HEIGHT
    for(let y=24;y<432;y+=16) for(let x=16;x<752;x+=16) {
      const tile=sprite(furniture,x,y+o,8,2,1,false)
      tile.tint=y>=184&&y<264 ? 0xbca18a : [0xc5aa8c,0xb9a080,0xc7ac91][Math.floor(x/256)]
    }
    const decor=new Graphics()
    // Rich carpets establish each room and the continuous central gallery.
    decor.rect(27,o+195,714,58).fill(0x583238).rect(31,o+199,706,50).fill(0x873f43)
    decor.rect(35,o+203,698,42).stroke({width:1,color:0xc59169})
    for(let x=52;x<732;x+=28) decor.poly([x,o+224,x+6,o+217,x+12,o+224,x+6,o+231]).stroke({width:1,color:0xc38b69,alpha:.65})
    for(const [x,y,w,h,c] of [[38,72,174,76,0x604d4e],[285,78,194,69,0x465353],[542,73,180,74,0x744b43],[48,338,154,64,0x655452],[291,338,180,63,0x635053],[546,340,174,63,0x6b5c51]]) {
      decor.rect(x,o+y,w,h).fill(0x4a3433).rect(x+3,o+y+3,w-6,h-6).fill(c).rect(x+7,o+y+7,w-14,h-14).stroke({width:1,color:0xba9774})
    }
    // Room thresholds and brass trim.
    for(const x of [120,368,624]) for(const y of [176,264]) decor.rect(x,o+y,32,8).fill(0x91694f).rect(x,o+y+2,32,2).fill(0xd2af7d)
    // Staircase and banister, at the end of each gallery.
    decor.rect(692,o+188,52,70).fill(0x503b32).rect(697,o+192,42,62).fill(0x9b7654)
    for(let y=196;y<251;y+=7) decor.rect(699,o+y,38,2).fill(0xd3ad7d)
    decor.rect(693,o+190,4,66).fill(0x392b2a).rect(741,o+190,3,66).fill(0x392b2a)
    // Wall sconces and a pair of portrait frames in the gallery.
    for(const x of [185,330,490,610]) {
      decor.rect(x,o+187,9,4).fill(0x4b3530).rect(x+3,o+184,3,5).fill(0xe4b96b).rect(x+4,o+181,1,3).fill(0xffe5a0)
    }
    for(const x of [295,458]) decor.rect(x,o+26,20,16).fill(0x50362e).rect(x+2,o+28,16,12).fill(0xb99a6d).rect(x+4,o+30,12,8).fill(0x675456)
    // Windows, curtains, framed panels and door jambs make the architecture legible.
    for(const x of [115,365,615]) {
      decor.rect(x-18,o+24,36,15).fill(0x473333).rect(x-15,o+26,30,10).fill(0x9bb4ad)
      decor.rect(x-2,o+26,4,10).fill(0xd8c9a1).rect(x-15,o+30,30,2).fill(0xd8c9a1)
      decor.rect(x-18,o+24,5,16).fill(0x884e49).rect(x+13,o+24,5,16).fill(0x884e49)
    }
    for(const x of [120,368,624]) for(const y of [176,264]) {
      decor.rect(x-3,o+y-3,3,14).fill(0xc49b71).rect(x+32,o+y-3,3,14).fill(0xc49b71)
    }
    // Occasional floor details keep the rooms from looking like empty boxes.
    for(const [x,y] of [[230,56],[478,80],[228,364],[492,378],[724,360]]) {
      decor.circle(x,o+y,7).fill(0x506a4a).circle(x-4,o+y-4,5).fill(0x739066).circle(x+4,o+y-6,5).fill(0x5b8358)
      decor.rect(x-4,o+y+5,8,7).fill(0xa36b50)
    }
    world.addChild(decor)
    // Small framed paintings from Ritpop's CC0 interior sheet.
    if(mansionDecor) for(const [x,y,col] of [[200,45,0],[460,46,1],[710,46,2],[210,294,1],[470,294,2],[718,294,0]]) {
      const painting=new Sprite(new Texture({source:mansionDecor.source,frame:new Rectangle(304+col*16,8,16,16)}))
      painting.x=x;painting.y=o+y;painting.zIndex=o+y+16;world.addChild(painting)
    }
  }
  for(const wall of MANSION_WALLS) {
    const g=new Graphics().rect(wall.x,wall.y,wall.w,wall.h).fill(0x4a3330)
    if(wall.w>wall.h) g.rect(wall.x,wall.y,wall.w,Math.min(3,wall.h)).fill(0xb99a72).rect(wall.x,wall.y+wall.h-3,wall.w,3).fill(0x715044)
    else g.rect(wall.x,wall.y,3,wall.h).fill(0x98755d).rect(wall.x+wall.w-2,wall.y,2,wall.h).fill(0x342725)
    g.zIndex=wall.y+wall.h; world.addChild(g)
  }
  for(const item of MANSION_FURNITURE) {
    const {x,y,w,h,kind}=item, g=new Graphics()
    g.ellipse(x+w/2,y+h+1,w/2,3).fill({color:0x21191b,alpha:.3})
    const frame=(c=0x59392e)=>g.rect(x,y,w,h).fill(0x3c2a28).rect(x+2,y+2,w-4,h-4).fill(c).rect(x+4,y+4,w-8,h-8).stroke({width:1,color:0xad835e})
    if(kind==='bed') {
      frame(0x76554b); g.rect(x+5,y+5,w-10,h-10).fill(0xb89f8d).rect(x+6,y+15,w-12,h-20).fill(0x8d5555)
      g.rect(x+8,y+6,w/2-10,8).fill(0xe5d8bd).rect(x+w/2+2,y+6,w/2-10,8).fill(0xe5d8bd).rect(x+6,y+h-8,w-12,3).fill(0xc8947f)
    } else if(kind==='sofa') {
      frame(0x5a3035);g.rect(x+4,y+4,w-8,h-10).fill(0x9b5b59).rect(x+6,y+h-10,w-12,5).fill(0xbd7e70)
      for(let a=x+18;a<x+w-4;a+=20) g.rect(a,y+5,1,h-16).fill(0x754143)
    } else if(kind==='fireplace') {
      frame(0x806259);g.rect(x+5,y+6,w-10,h-10).fill(0x302729).rect(x+9,y+11,w-18,h-15).fill(0xa65739).rect(x+12,y+9,5,7).fill(0xe5ad60)
      g.rect(x+2,y+1,w-4,3).fill(0xc4a184)
    } else if(kind==='armchair') {
      frame(0x6c4241);g.rect(x+5,y+4,w-10,h-9).fill(0xb0786a).rect(x+5,y+h-10,w-10,4).fill(0xc9947d)
    } else if(kind==='globe') {
      g.rect(x+w/2-2,y+15,4,h-16).fill(0x7b593b).rect(x+6,y+h-4,w-12,4).fill(0x684a36)
      g.circle(x+w/2,y+10,9).fill(0x486d70).circle(x+w/2-3,y+8,3).fill(0xb9ae79).rect(x+w/2+1,y+10,4,3).fill(0xaca16d)
    } else if(kind==='mirror') {
      frame(0x9f7d5e);g.rect(x+5,y+4,w-10,h-8).fill(0x9db3ac).rect(x+7,y+6,2,h-13).fill(0xd2d6bc)
    } else if(kind==='toilet') {
      frame(0xaaa99a);g.ellipse(x+w/2,y+h/2,w/3,h/3).fill(0xe6e2d0).ellipse(x+w/2,y+h/2,w/5,h/5).fill(0xa8b9b1)
    } else if(kind==='plant') {
      g.rect(x+8,y+h-9,w-16,8).fill(0x9a6550).circle(x+w/2,y+10,9).fill(0x456d4d).circle(x+w/2-6,y+12,5).fill(0x638d5a).circle(x+w/2+5,y+7,5).fill(0x719967)
    } else if(kind==='bath') {
      frame(0x9b9990);g.rect(x+5,y+5,w-10,h-10).fill(0xd2d1bd).rect(x+9,y+9,w-18,h-18).fill(0x9bb2aa).rect(x+w-12,y+6,4,4).fill(0xd2ad6a)
    } else if(kind==='sink') {
      frame(0x888c83);g.ellipse(x+w/2,y+h/2,w/3,h/3).fill(0xd5d3bd).circle(x+w/2,y+4,2).fill(0xc8a467)
    } else if(kind==='bookcase') {
      frame(0x694b3a); for(let row=0;row<2;row++) { g.rect(x+5,y+7+row*8,w-10,2).fill(0xba9065); for(let i=0;i<Math.floor((w-12)/7);i++) g.rect(x+6+i*7,y+3+row*8,5,5).fill([0x804f50,0x637a6d,0xa08455,0x596474][i%4]) }
    } else if(kind==='wardrobe'||kind==='cabinet') {
      frame(0x76513c);g.rect(x+w/2,y+3,2,h-6).fill(0x4b302a).rect(x+w/2-5,y+h/2,2,3).fill(0xe0bb73).rect(x+w/2+4,y+h/2,2,3).fill(0xe0bb73)
    } else if(kind==='kitchen') {
      frame(0x8d745b); for(let a=x+5;a<x+w-8;a+=16) g.rect(a,y+5,12,h-10).fill(0xb3a38a).rect(a+3,y+8,5,5).fill(0x8a8e80)
    } else {
      frame(kind==='dining'?0x936345:0x805b41)
      if(kind==='dining') {g.rect(x+8,y+7,w-16,h-14).fill(0xc9ac87); for(let a=x+15;a<x+w-8;a+=19) g.circle(a,y+h/2,4).fill(0xebe0c6)}
      else {g.rect(x+8,y+6,w-16,2).fill({color:0xd7b084,alpha:.5});if(kind==='desk')g.rect(x+w-20,y+7,12,8).fill(0xe5d2a8).rect(x+w-18,y+9,7,1).fill(0x806658)}
    }
    if(kind==='dining') {
      for(const dx of [14,38,62]) { g.rect(x+dx,y-9,12,7).fill(0x4b302b).rect(x+dx+2,y-8,8,5).fill(0x9b6960); g.rect(x+dx,y+h+2,12,7).fill(0x4b302b).rect(x+dx+2,y+h+3,8,5).fill(0x9b6960) }
    }
    if(kind==='desk') {g.rect(x+8,y+8,7,7).fill(0x638276).rect(x+10,y+5,3,4).fill(0xe7c67e);g.rect(x+23,y+10,11,7).fill(0xd7c29c)}
    g.zIndex=y+h; world.addChild(g)
    // Small familiar tiles blend the new furniture with the existing game assets.
    if(kind==='table' && w>=45) { const prop=sprite(interior,x+w/2-8,y+2,16,12,.8,false);prop.zIndex=y+h+1 }
  }
}
export function addMansionLighting(world) {
  const canvas=document.createElement('canvas');canvas.width=MANSION_WIDTH;canvas.height=MANSION_HEIGHT
  const ctx=canvas.getContext('2d');ctx.fillStyle='#bcb1a2';ctx.fillRect(0,0,canvas.width,canvas.height)
  for(const floor of [0,1]) for(const [x,y] of [[128,100],[370,100],[650,100],[120,350],[375,350],[650,350],[185,210],[490,210]]) {
    const yy=y+floor*FLOOR_HEIGHT, glow=ctx.createRadialGradient(x,yy,4,x,yy,95)
    glow.addColorStop(0,'rgba(255,228,185,.8)');glow.addColorStop(1,'rgba(255,228,185,0)');ctx.fillStyle=glow;ctx.fillRect(x-95,yy-95,190,190)
  }
  const light=new Sprite(Texture.from(canvas));light.blendMode='multiply';light.zIndex=100000;world.addChild(light)
}
