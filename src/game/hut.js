import { Graphics, Sprite, Texture } from 'pixi.js'

export const HUT_SCALE = 0.625, HUT_WIDTH = 320, HUT_HEIGHT = 200
export const HUT_WALLS = [{x:248,y:32,w:8,h:92}, {x:248,y:188,w:8,h:116}]
export const HUT_FURNITURE = [
  {x:55,y:40,w:48,h:30}, {x:154,y:40,w:48,h:30},
  {x:420,y:56,w:54,h:35}, {x:287,y:40,w:48,h:27},
]
export const HUT_LIGHTS = [[83,38,70], [301,38,70], [454,54,70], [263,210,65], [488,160,65]]

export function buildHut({ world, sprite, interior, furniture, dungeon, sheet, caves, collision, scene, character }) {
  world.addChild(new Graphics().rect(0,0,512,320).fill(0x17151b).rect(16,32,480,272).fill(0x594232))
  for (let y=32;y<304;y+=16) for (let x=16;x<496;x+=16) {
    const tile=sprite(furniture,x,y,8,2,1,false)
    tile.tint=x<248 ? 0xb2977b : 0x8d7771
  }
  const floor=new Graphics()
  floor.rect(56,196,116,62).fill(0x493933).rect(60,200,108,54).fill(0x705145)
  floor.rect(306,176,150,92).fill(0x40262d).rect(310,180,142,84).fill(0x603039)
  // Ritual circle and five-pointed sigil are woven into the dark rug.
  floor.circle(381,224,35).stroke({width:2,color:0xb67862}).circle(381,224,29).stroke({width:1,color:0x9e665b})
  floor.poly([381,195,398,248,354,215,408,215,364,248,381,195]).stroke({width:2,color:0xa86d5f})
  world.addChild(floor)
  const walls=new Graphics().rect(8,16,496,16).fill(0x4a3631).rect(8,16,496,5).fill(0x80614b)
  walls.rect(8,32,8,272).fill(0x4a3631).rect(496,32,8,272).fill(0x4a3631).rect(8,304,496,8).fill(0x4a3631)
  world.addChild(walls)
  for (const r of HUT_WALLS) {
    for(let y=r.y;y<r.y+r.h;y+=8) {
      const h=Math.min(8,r.y+r.h-y), wall=new Graphics().rect(r.x,y,r.w,h).fill(0x503b34)
      wall.rect(r.x,y,r.w,2).fill(0x755748); wall.zIndex=y+h; world.addChild(wall)
    }
    collision.addRect(r)
  }
  const beam=new Graphics().rect(240,124,24,6).fill(0x87624b).rect(244,130,4,58).fill(0x6b4a3b).rect(256,130,4,58).fill(0x6b4a3b)
  beam.zIndex=126; world.addChild(beam)
  function furnishing(x,y,col,row) { const item=sprite(interior,x,y,col,row,1.5,false); item.zIndex=y+24 }
  for(const [x,y,col,row] of [[55,40,12,13],[79,40,13,13],[154,40,12,13],[178,40,13,13],[287,40,12,13],[311,40,13,13]]) furnishing(x,y,col,row)
  for(const r of HUT_FURNITURE) collision.addRect(r)
  if (!scene.shovel) { const shovel=sprite(sheet,35,91,8,10,1.5,false); shovel.zIndex=115 }
  // Altar table, bottles and photograph.
  const altar=new Graphics().rect(420,56,54,35).fill(0x402c29).rect(422,57,50,22).fill(0x795044).rect(425,60,44,16).fill(0x916653)
  altar.rect(426,82,5,9).fill(0x2b2023).rect(463,82,5,9).fill(0x2b2023)
  altar.zIndex=91; world.addChild(altar)
  const props=new Graphics()
  // Icon, eye and hanging occult symbols on the back wall.
  props.rect(350,34,30,27).fill(0x4b3029).rect(353,37,24,21).fill(0x99734c).rect(356,40,18,15).fill(0x422c3a)
  props.circle(365,47,5).fill(0xcca56b).circle(365,47,2).fill(0x30232b)
  props.circle(406,45,9).stroke({width:2,color:0xa26d55}).moveTo(406,36).lineTo(406,54).moveTo(397,45).lineTo(415,45).stroke({width:1,color:0xa26d55})
  // Bottles, corks and coloured liquids on the shelf and altar.
  for(const [x,y,c] of [[292,44,0x648878],[302,43,0x8d526a],[314,44,0x68818d],[427,63,0x659685],[439,62,0x98586f],[460,63,0x9b8755]]) {
    props.rect(x+2,y-3,3,4).fill(0xb69a71).rect(x+1,y,5,8).fill(0xb5aa8c).rect(x+2,y+3,3,4).fill(c)
  }
  if (!scene.note) props.rect(448,66,10,7).fill(0xd5c4a0).rect(450,68,6,3).fill(0x6e785f)
  // Skulls and bones, with the downloaded Kenney dungeon bones nearby.
  for(const [x,y] of [[342,235],[412,229],[286,72]]) {
    props.rect(x,y,12,9).fill(0xc6b79a).rect(x+2,y-3,8,3).fill(0xd8c9a6).rect(x+2,y+3,3,3).fill(0x30282b).rect(x+7,y+3,3,3).fill(0x30282b).rect(x+3,y+9,6,2).fill(0x9f8a74)
  }
  props.zIndex=250; world.addChild(props)
  const bones=sprite(caves,397,252,2,2,1.3,false); bones.zIndex=253
  character(380,91,true)
  const door=new Graphics().rect(102,284,36,20).fill(0x382a27).rect(105,287,30,17).fill(0x805a40).rect(119,288,2,15).fill(0x4a352e).rect(125,295,2,2).fill(0xd2aa6e)
  door.zIndex=304; world.addChild(door)
  const candles=new Graphics()
  for(const [x,y] of HUT_LIGHTS) {
    // A bracket supports each wall candle; the others sit on furniture.
    if (x === 263 || x === 488) candles.rect(x-4,y+7,8,3).fill(0x9b7653).rect(x-2,y+10,4,3).fill(0x604436)
    candles.rect(x-2,y,4,8).fill(0xd1b897).rect(x-1,y-3,2,3).fill(0xff8b32).rect(x,y-5,1,3).fill(0xffd781)
  }
  candles.zIndex=400; world.addChild(candles)
}

export function addHutLighting(world) {
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=320
  const ctx=canvas.getContext('2d')
  ctx.fillStyle='#898078'; ctx.fillRect(0,0,512,320)
  for(const [x,y,r] of HUT_LIGHTS) {
    ctx.save(); ctx.beginPath(); ctx.rect(x<248?16:256,32,x<248?232:240,272); ctx.clip()
    const glow=ctx.createRadialGradient(x,y,1,x,y,r)
    glow.addColorStop(0,'rgba(255,220,180,1)'); glow.addColorStop(.25,'rgba(255,220,180,.7)'); glow.addColorStop(.58,'rgba(255,220,180,.25)'); glow.addColorStop(1,'rgba(255,220,180,0)')
    ctx.fillStyle=glow; ctx.fillRect(x-r,y-r,r*2,r*2); ctx.restore()
  }
  const light=new Sprite(Texture.from(canvas)); light.blendMode='multiply'; light.zIndex=100000; world.addChild(light)
  const glowCanvas=document.createElement('canvas'); glowCanvas.width=512; glowCanvas.height=320
  const glowCtx=glowCanvas.getContext('2d')
  for(const [x,y,r] of HUT_LIGHTS) {
    glowCtx.save(); glowCtx.beginPath(); glowCtx.rect(x<248?16:256,32,x<248?232:240,272); glowCtx.clip()
    const glow=glowCtx.createRadialGradient(x,y,0,x,y,r*.65)
    glow.addColorStop(0,'rgba(255,116,28,.35)'); glow.addColorStop(1,'rgba(255,86,20,0)')
    glowCtx.fillStyle=glow; glowCtx.fillRect(x-r,y-r,r*2,r*2); glowCtx.restore()
  }
  const warm=new Sprite(Texture.from(glowCanvas)); warm.blendMode='add'; warm.zIndex=100001; world.addChild(warm)
}
