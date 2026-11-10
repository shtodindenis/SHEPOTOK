import { Graphics, Sprite, Texture } from 'pixi.js'

export const HOME_WIDTH = 512, HOME_HEIGHT = 320

// Doorways in the partition walls connect every room to the central hall.
export const HOME_WALLS = [
  { x: 208, y: 32, w: 8, h: 48 }, { x: 208, y: 112, w: 8, h: 128 }, { x: 208, y: 272, w: 8, h: 32 },
  { x: 296, y: 32, w: 8, h: 48 }, { x: 296, y: 112, w: 8, h: 128 }, { x: 296, y: 272, w: 8, h: 32 },
  { x: 16, y: 152, w: 192, h: 8 }, { x: 304, y: 152, w: 192, h: 8 },
]

export function buildHome({ world, sprite, interior, furniture, dungeon, collision, scene, depthGroup }) {
  const g = new Graphics()
  g.rect(0, 0, 512, 320).fill(0x292d35)
  g.rect(16, 32, 480, 272).fill(0x936a4c)
  world.addChild(g)
  for (let y = 32; y < 304; y += 16) for (let x = 16; x < 496; x += 16) {
    const tile = sprite(furniture, x, y, 8, 2, 1, false)
    if (x >= 304 && y >= 160) tile.tint = 0xc2c8c1
    else if (x >= 216 && x < 296) tile.tint = 0xc9ad90
    else if (x >= 304) tile.tint = 0xe2cda9
    else tile.tint = 0xe2c3a2
  }
  const decor = new Graphics()
  // Rugs and bath tiles ground the furniture and distinguish the rooms.
  decor.rect(51, 82, 112, 48).fill(0x986b60).rect(55, 86, 104, 40).fill(0xb78674)
  decor.rect(40, 208, 125, 55).fill(0x735e55).rect(44, 212, 117, 47).fill(0x9c7763)
  // A narrow runner leaves the passage openings and wooden floor visible.
  decor.rect(236, 48, 40, 236).fill(0x765448)
  decor.rect(239, 51, 34, 230).fill(0xa77e68)
  decor.rect(242, 54, 28, 224).fill(0xb68c72)
  world.addChild(decor)
  const wall = new Graphics()
  wall.rect(8, 16, 496, 16).fill(0x725341).rect(8, 16, 496, 5).fill(0xc5a581)
  wall.rect(8, 32, 8, 272).fill(0x725341).rect(496, 32, 8, 272).fill(0x725341)
  wall.rect(8, 304, 496, 8).fill(0x725341)
  world.addChild(wall)
  for (const r of HOME_WALLS) {
    // Short sections let long vertical walls sort at the player's local position.
    for (let y=r.y; y<r.y+r.h; y+=8) {
      const height=Math.min(8,r.y+r.h-y)
      const section=new Graphics().rect(r.x,y,r.w,height).fill(0x755847)
      if (y===r.y) section.rect(r.x,y,r.w,Math.min(3,height)).fill(0xc7a581)
      section.zIndex=y+height; world.addChild(section)
    }
    collision.addRect(r)
  }
  function item(x,y,col,row,scale=1,solid=true) {
    const object = sprite(interior,x,y,col,row,scale,false)
    object.zIndex = y + 16*scale
    if (solid) collision.addRect({x:x+2,y:y+5,w:16*scale-4,h:16*scale-5})
  }
  // Furniture uses the same 1.5x pixel scale, with larger pieces built from matching tiles.
  const furnishing = (x, y, col, row, scale = 1.5) => item(x, y, col, row, scale)
  const table = (x, y) => { for (let col = 0; col < 3; col++) furnishing(x + col * 24, y, col, 0) }
  // Bedroom
  depthGroup(80, () => sprite(furniture, 38, 40, 14, 3, 2.5, false))
  collision.addRect({x:42,y:45,w:32,h:33})
  furnishing(83, 42, 10, 3)
  furnishing(137, 39, 12, 13); furnishing(161, 39, 13, 13)
  furnishing(181, 114, 16, 0, 1.25)
  item(111, 34, 16, 12, 1, false)
  // Kitchen cabinets and a continuous worktop.
  for (const [x, col] of [[320,0],[344,4],[368,8],[392,6],[416,2]]) furnishing(x, 40, col, 12)
  // Refrigerator: a tall, two-door appliance with a handle and a shaded side.
  const fridge = new Graphics()
  fridge.rect(458,39,26,36).fill(0x7f847e).rect(460,39,22,33).fill(0xd4d9c8)
  fridge.rect(462,41,18,11).fill(0xe8e9d9).rect(462,54,18,16).fill(0xe2e4d5)
  fridge.rect(464,44,2,5).fill(0x89928a).rect(464,57,2,7).fill(0x89928a)
  fridge.zIndex = 75; world.addChild(fridge); collision.addRect({x:458,y:42,w:26,h:33})
  table(358, 96)
  furnishing(330, 94, 2, 2); furnishing(434, 94, 3, 2)
  // Living room: sofa facing a television across the coffee table.
  for (const [i, col] of [4, 5, 7].entries()) furnishing(37 + i * 24, 172, col, 6)
  table(65, 221)
  furnishing(165, 172, 16, 0, 1.5)
  const television = new Graphics()
  television.rect(48, 268, 52, 25).fill(0x3d302d)
  television.rect(50, 270, 48, 20).fill(0x1d2428)
  television.rect(53, 272, 42, 15).fill(0x526e70)
  television.rect(56, 274, 17, 2).fill(0x88a5a0)
  television.rect(90, 287, 3, 1).fill(0xb8d0b6)
  television.rect(68, 293, 12, 2).fill(0x302a28)
  television.rect(62, 295, 24, 3).fill(0x745342)
  television.zIndex = 296; world.addChild(television)
  collision.addRect({x:48,y:269,w:52,h:27})
  if (scene.stage === 2) depthGroup(252, () => { sprite(dungeon,149,221,8,9,1.2,false); sprite(dungeon,146,233,0,6,1.2,false) })
  else furnishing(149, 224, 17, 3, 1.2)
  // Bathroom fixtures and a bath mat.
  const mat = new Graphics().rect(351,205,32,13).fill(0x77928a).rect(354,208,26,7).fill(0x9fb2a2)
  world.addChild(mat)
  const tub = new Graphics()
  tub.rect(320,171,70,29).fill(0x777b7b).rect(322,171,66,25).fill(0xd9e1d8)
  tub.rect(326,175,58,17).fill(0x91b3b3).rect(378,173,5,4).fill(0xf6f4dc)
  tub.zIndex=200; world.addChild(tub)
  const sink = new Graphics()
  sink.rect(436,171,31,22).fill(0xa4b1aa).rect(439,172,25,17).fill(0xe3e8da)
  sink.ellipse(451,180,7,4).fill(0x8eacac).rect(449,172,4,3).fill(0x696d6b)
  sink.zIndex=193; world.addChild(sink)
  const toilet = new Graphics()
  toilet.rect(451,218,22,27).fill(0x89948e).rect(453,219,18,23).fill(0xe4e9dd)
  toilet.ellipse(462,231,6,7).fill(0xb5c7c1).ellipse(462,231,4,5).fill(0xdce5dc)
  toilet.zIndex=245; world.addChild(toilet)
  collision.addRect({x:320,y:171,w:70,h:29}); collision.addRect({x:436,y:171,w:31,h:22}); collision.addRect({x:451,y:218,w:22,h:27})
  if (!scene.ragTaken) {
    const rag = new Graphics().rect(400,251,13,8).fill(0x8aa7a1).rect(402,250,10,6).fill(0xd0e0d2)
    rag.rect(404,251,6,1).fill(0xf2f0da).rect(408,255,4,2).fill(0xa7c4b9)
    rag.zIndex=259; world.addChild(rag)
  }
  furnishing(320, 263, 12, 15, 1.5); item(350, 265, 16, 2, 1, false)
  // Wooden front door sits in the lower wall and shares its palette.
  const door = new Graphics()
  door.rect(237, 284, 38, 20).fill(0x4e382f).rect(240, 286, 32, 18).fill(0x8b5c3d)
  door.rect(242, 288, 12, 14).fill(0xb48054).rect(258, 288, 12, 14).fill(0xb48054)
  door.rect(244, 290, 8, 10).fill(0x805439).rect(260, 290, 8, 10).fill(0x805439)
  door.rect(252, 295, 2, 2).fill(0xe6c07e).rect(258, 295, 2, 2).fill(0xe6c07e)
  door.zIndex=304; world.addChild(door)

}

export function addHomeLighting(world, actor) {
  const canvas = document.createElement('canvas'); canvas.width=HOME_WIDTH; canvas.height=HOME_HEIGHT
  const ctx=canvas.getContext('2d')
  ctx.fillStyle='#aaa3a0'; ctx.fillRect(0,0,HOME_WIDTH,HOME_HEIGHT)
  // A separate clipped pool of light in each room keeps walls from leaking light.
  for (const [x,y,w,h,lx,ly,r] of [
    [16,32,192,120,112,82,105], [304,32,192,120,400,80,105],
    [16,160,192,144,112,230,108], [304,160,192,144,400,230,105],
    [216,32,80,280,256,113,125], [216,32,80,280,256,260,115],
  ]) {
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip()
    const glow=ctx.createRadialGradient(lx,ly,3,lx,ly,r)
    glow.addColorStop(0,'rgba(255,240,206,.95)'); glow.addColorStop(.32,'rgba(246,218,181,.72)'); glow.addColorStop(1,'rgba(230,191,152,0)')
    ctx.fillStyle=glow; ctx.fillRect(x,y,w,h); ctx.restore()
  }
  const light=new Sprite(Texture.from(canvas)); light.blendMode='multiply'; light.zIndex=100000; world.addChild(light)
  const fixtures=new Graphics()
  for(const [x,y] of [[112,78],[400,76],[112,224],[400,224],[256,110],[256,235]]) {
    fixtures.circle(x,y,4).fill({color:0xffdc98,alpha:.16}).circle(x,y,2).fill({color:0xffe8b7,alpha:.75}).circle(x,y,1).fill(0xfff5d6)
  }
  world.addChildAt(fixtures, world.getChildIndex(actor))
}
