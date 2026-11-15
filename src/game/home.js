import { Graphics, Rectangle, Sprite, Texture } from 'pixi.js'

export const HOME_WIDTH = 512, HOME_HEIGHT = 320

// Doorways in the partition walls connect every room to the central hall.
export const HOME_WALLS = [
  { x: 208, y: 32, w: 8, h: 48 }, { x: 208, y: 112, w: 8, h: 128 }, { x: 208, y: 272, w: 8, h: 32 },
  { x: 296, y: 32, w: 8, h: 48 }, { x: 296, y: 112, w: 8, h: 128 }, { x: 296, y: 272, w: 8, h: 32 },
  { x: 16, y: 152, w: 192, h: 8 }, { x: 304, y: 152, w: 192, h: 8 },
]

export function buildHome({ world, sprite, interior, furniture, dungeon, collision, scene, depthGroup, homeDecor }) {
  const g = new Graphics()
  g.rect(0, 0, 512, 320).fill(0x292d35)
  g.rect(16, 32, 480, 272).fill(0x936a4c)
  world.addChild(g)
  if (!scene.collection?.basket) {
    // Pixel-stepped wicker, a curved handle and a dark rim match the furniture outlines.
    const basket = new Graphics()
    basket.ellipse(185,131,11,3).fill({color:0x30241f,alpha:.28})
    basket.rect(179,110,12,2).fill(0x53371f).rect(177,112,3,6).fill(0x53371f)
    basket.rect(190,112,3,6).fill(0x53371f).rect(180,111,10,1).fill(0xc19050)
    basket.rect(178,113,1,4).fill(0xc19050).rect(191,113,1,4).fill(0xc19050)
    basket.poly([174,117,196,117,195,127,193,130,177,130,175,127]).fill(0x4d321e)
    basket.poly([176,119,194,119,193,126,192,128,178,128,177,126]).fill(0xb77c3e)
    basket.rect(175,116,20,3).fill(0x644124).rect(177,116,16,1).fill(0xd9a75e)
    basket.rect(177,121,16,1).fill(0x79502b).rect(178,125,14,1).fill(0x79502b)
    for (const x of [179,184,189]) basket.rect(x,119,2,2).fill(0xe2b36e).rect(x+2,122,2,3).fill(0xd39a53).rect(x,126,2,2).fill(0xd39a53)
    basket.rect(178,129,14,1).fill(0x7a502b)
    basket.zIndex=131; world.addChild(basket)
    collision.addRect({x:176,y:120,w:18,h:10})
  }
  // Room-specific floors are drawn on the same pixel grid as the furniture.
  const floor = new Graphics()
  for (let y = 32; y < 304; y += 8) for (let x = 16; x < 496; x += 16) {
    const bath = x >= 304 && y >= 160
    const hall = x >= 216 && x < 296
    const kitchen = x >= 304 && y < 152
    if (bath) {
      if (y % 16) continue
      const shade = ((x / 16 + y / 16) % 2) ? 0xb5c4b9 : 0xc4d0c3
      floor.rect(x,y,16,16).fill(shade).rect(x,y,16,1).fill(0x94a79c).rect(x,y,1,16).fill(0x94a79c)
      floor.rect(x+2,y+2,5,1).fill({color:0xf5f1dd,alpha:.45})
      floor.rect(x+14,y+14,1,1).fill({color:0x718b82,alpha:.26})
    } else {
      const base = hall ? 0x9e7355 : kitchen ? 0xb28962 : y < 152 ? 0xa8795a : 0x966a50
      floor.rect(x,y,16,8).fill(base).rect(x,y+7,16,1).fill({color:0x503d35,alpha:.13})
      const seam = (Math.floor(y/8)%2 ? 8 : 0)
      floor.rect(x+seam,y,1,7).fill({color:0x593f33,alpha:.12})
      floor.rect(x+2,y+1,8,1).fill({color:0xf4c596,alpha:.07})
    }
  }
  world.addChild(floor)
  const decor = new Graphics()
  // Woven rugs have a dark binding, inset border and a restrained repeating motif.
  function rug(x,y,w,h,outer,inner,accent) {
    decor.rect(x+2,y+3,w,h).fill({color:0x302a29,alpha:.25})
    decor.rect(x,y,w,h).fill(outer).rect(x+3,y+3,w-6,h-6).fill(inner)
    decor.rect(x+6,y+6,w-12,1).fill(accent).rect(x+6,y+h-7,w-12,1).fill(accent)
    decor.rect(x+6,y+6,1,h-12).fill(accent).rect(x+w-7,y+6,1,h-12).fill(accent)
    for (let px=x+14; px<x+w-10; px+=16) {
      decor.rect(px,y+9,4,2).fill({color:accent,alpha:.7}).rect(px,y+h-11,4,2).fill({color:accent,alpha:.7})
    }
    for (let px=x+20; px<x+w-15; px+=24) {
      decor.poly([px,y+h/2-4,px+4,y+h/2,px,y+h/2+4,px-4,y+h/2]).fill({color:accent,alpha:.48})
      decor.rect(px-1,y+h/2-1,2,2).fill(outer)
    }
  }
  rug(51,82,112,48,0x644741,0xa86c5c,0xe4bd8d)
  rug(29,208,125,55,0x4d4c45,0x817260,0xd6b58a)
  rug(357,88,100,45,0x685247,0x9c7960,0xd9b692)
  rug(236,48,40,236,0x5f4a40,0x986e59,0xd9ae84)
  // Thresholds make the four openings legible without adding obstacles.
  for (const [x,y] of [[208,80],[208,240],[296,80],[296,240]]) {
    decor.rect(x,y,8,32).fill({color:0x563e32,alpha:.3})
    decor.rect(x+3,y,2,32).fill({color:0xe5bd8d,alpha:.32})
  }
  world.addChild(decor)
  const wall = new Graphics()
  wall.rect(8, 16, 496, 16).fill(0x725341).rect(8, 16, 496, 5).fill(0xc5a581)
  wall.rect(8, 32, 8, 272).fill(0x725341).rect(496, 32, 8, 272).fill(0x725341)
  wall.rect(8, 304, 496, 8).fill(0x725341)
  // Skirting and doorway casings give the thin partition walls a finished edge.
  wall.rect(16,32,480,3).fill(0x5b4033).rect(16,35,480,2).fill(0xc99f78)
  wall.rect(16,301,221,3).fill(0xb38a65).rect(275,301,221,3).fill(0xb38a65)
  wall.rect(16,32,2,272).fill(0x4d3931).rect(494,32,2,272).fill(0x4d3931)
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
  // Each end of the frame sorts at its own floor position, not as one tall object.
  for (const [x,y] of [[208,80],[208,240],[296,80],[296,240]]) {
    for (const capY of [y-3, y+31]) {
      const trim = new Graphics()
      trim.rect(x-2,capY,12,4).fill(0x4d382e).rect(x-2,capY,12,1).fill(0xd7b18a)
      trim.zIndex=capY+4; trim.label='home-doorway-trim'; world.addChild(trim)
    }
  }
  // Windows sit on the outer wall, above the furniture and clear of every route.
  const windows = new Graphics()
  for (const x of [92, 390]) {
    windows.rect(x-2,17,40,18).fill(0x4d3932).rect(x,18,36,14).fill(0xd7bd91)
    windows.rect(x+3,20,30,10).fill(0x77999a).rect(x+4,20,28,4).fill(0xaac4b2)
    windows.rect(x+17,20,2,10).fill(0xe0c49b).rect(x+3,25,30,2).fill(0xe0c49b)
    windows.rect(x-3,31,42,3).fill(0xd6b28a)
    windows.rect(x-4,18,5,13).fill(0x9c594b).rect(x+35,18,5,13).fill(0x9c594b)
    windows.rect(x-3,20,2,8).fill(0xc6866b).rect(x+36,20,2,8).fill(0xc6866b)
  }
  windows.zIndex=36; world.addChild(windows)
  // These sprites are cropped from JIK-A-4's CC0 MetroCity interior set.
  function metro(frame, x, y, w, h, depth) {
    if (!homeDecor) return
    const piece = new Sprite(new Texture({source:homeDecor.source,frame:new Rectangle(...frame)}))
    piece.x=x; piece.y=y; piece.width=w; piece.height=h; piece.zIndex=depth
    world.addChild(piece)
  }
  // Bedroom
  metro([176,0,28,42], 38,39,38,42,80)
  collision.addRect({x:42,y:45,w:32,h:33})
  metro([128,128,22,30], 83,39,24,27,66)
  collision.addRect({x:85,y:47,w:20,h:19})
  metro([0,128,20,41], 137,34,23,30,64)
  metro([0,128,20,41], 161,34,23,30,64)
  collision.addRect({x:139,y:44,w:20,h:19}); collision.addRect({x:163,y:44,w:20,h:19})
  metro([336,0,20,43], 27,100,20,33,134)
  collision.addRect({x:29,y:119,w:16,h:15})
  metro([448,192,14,17], 111,34,13,15,50)
  // Kitchen appliances and cabinets share the MetroCity palette and outlines.
  for (const [x, frame] of [[320,[256,128,33,34]],[344,[320,128,33,34]],[392,[256,128,33,34]],[416,[320,128,33,34]]]) {
    metro(frame,x,38,24,27,65)
    collision.addRect({x:x+2,y:45,w:20,h:19})
  }
  metro([256,0,34,35], 368,38,24,27,65)
  collision.addRect({x:370,y:45,w:20,h:19})
  metro([448,128,18,20], 418,39,15,13,66)
  metro([384,128,24,48], 458,35,26,40,75)
  collision.addRect({x:458,y:42,w:26,h:33})
  metro([0,192,46,33],370,94,72,26,120)
  collision.addRect({x:372,y:101,w:68,h:19})
  metro([64,192,14,23],342,94,20,24,118)
  metro([128,192,14,23],446,94,20,24,118)
  collision.addRect({x:344,y:99,w:16,h:19}); collision.addRect({x:448,y:99,w:16,h:19})
  // Living room: sofa facing a television across the coffee table.
  // Upholstered sofa: separate back, cushions, seat, arms and feet read at game scale.
  const sofa = new Graphics()
  sofa.rect(52,191,68,7).fill({color:0x30231d,alpha:.25})
  sofa.rect(52,171,68,23).fill(0x3c3930)
  sofa.rect(55,172,62,9).fill(0x59705b).rect(57,173,58,2).fill(0x91a487)
  sofa.rect(55,181,62,10).fill(0x758d70).rect(57,182,58,2).fill(0xa1b294)
  for (const x of [57,76,95]) {
    sofa.rect(x,174,18,6).fill(0x758e73).rect(x+1,174,16,1).fill(0xb5c5a3)
    sofa.rect(x+1,183,16,5).fill(0x849b7e).rect(x+2,183,14,1).fill(0xb4c3a3)
  }
  sofa.rect(50,176,6,17).fill(0x3c3930).rect(51,177,4,12).fill(0x6d846a)
  sofa.rect(116,176,6,17).fill(0x3c3930).rect(117,177,4,12).fill(0x6d846a)
  sofa.rect(55,191,62,3).fill(0x53674f).rect(56,194,6,3).fill(0x573e2d).rect(110,194,6,3).fill(0x573e2d)
  sofa.zIndex=197; world.addChild(sofa)
  collision.addRect({x:52,y:177,w:68,h:19})
  metro([192,192,46,30],50,219,72,26,245)
  collision.addRect({x:52,y:226,w:68,h:19})
  metro([336,0,20,43], 165,158,24,38,196)
  collision.addRect({x:167,y:177,w:20,h:19})
  metro([320,192,48,27],60,267,52,29,296)
  collision.addRect({x:60,y:269,w:52,h:27})
  if (scene.stage === 2) {
    depthGroup(252, () => { sprite(dungeon,149,221,8,9,1.2,false); sprite(dungeon,146,233,0,6,1.2,false) })
    collision.addRect({x:151,y:232,w:16,h:16})
  }
  else { metro([128,128,22,30],149,221,20,27,247); collision.addRect({x:151,y:229,w:15,h:14}) }
  // Bathroom fixtures and a bath mat.
  const mat = new Graphics().rect(339,205,32,13).fill(0x536f6a).rect(341,207,28,9).fill(0x91b5a7).rect(344,209,22,1).fill(0xc4d6be).rect(344,213,22,1).fill(0xc4d6be)
  world.addChild(mat)
  metro([0,0,66,33], 320,168,70,34,200)
  metro([112,0,26,28], 436,167,31,27,194)
  metro([80,0,18,39], 451,213,22,34,247)
  metro([144,0,26,18], 436,155,31,18,170)
  collision.addRect({x:320,y:171,w:70,h:29}); collision.addRect({x:436,y:171,w:31,h:22}); collision.addRect({x:451,y:218,w:22,h:27})
  if (!scene.ragTaken) {
    // A warm, outlined cloth stays legible against the cool bathroom tiles.
    const rag = new Graphics()
    rag.poly([398,252,401,249,412,249,415,252,414,260,400,261,398,258]).fill(0x583d38)
    rag.poly([400,252,402,250,411,250,413,252,413,258,401,259,400,257]).fill(0xc66f56)
    rag.rect(402,251,9,2).fill(0xeaa17d).rect(401,254,11,2).fill(0xdc8b6b)
    rag.rect(403,257,8,1).fill(0x9d5348).rect(410,252,2,2).fill(0xf6c39e)
    rag.zIndex=261; world.addChild(rag)
  }
  metro([384,192,35,39],454,256,24,31,287)
  collision.addRect({x:456,y:268,w:20,h:19})
  metro([128,256,30,7],421,264,23,6,274)
  collision.addRect({x:421,y:264,w:23,h:6})
  // Storage and side furniture use the same illustrated set as the bed and sofa.
  metro([64,128,37,30],92,123,48,24,147)
  collision.addRect({x:93,y:136,w:46,h:11})
  metro([208,0,36,43],167,253,30,40,293)
  collision.addRect({x:170,y:271,w:24,h:22})
  metro([128,128,22,30],22,168,21,27,195)
  collision.addRect({x:23,y:177,w:19,h:18})
  metro([384,192,35,39],319,256,30,33,289)
  collision.addRect({x:320,y:268,w:28,h:21})
  metro([64,128,37,30],320,122,40,23,145)
  collision.addRect({x:321,y:133,w:38,h:12})
  metro([56,64,16,19],26,160,12,14,195)
  const laundryObjects=new Graphics()
  laundryObjects.rect(324,260,8,5).fill(0xd9e0cc).rect(325,258,6,2).fill(0xf1ead3)
  laundryObjects.rect(338,260,5,5).fill(0x72978f).rect(339,258,3,2).fill(0xd4e7da)
  laundryObjects.zIndex=289; world.addChild(laundryObjects)
  metro([56,64,16,19],88,34,12,14,66)
  // A clock and framed pictures hang at the room edge rather than in the walkway.
  for (const [x,y] of [[20,84],[20,220],[484,96],[484,206]])
    metro([448,192,14,17],x,y,8,13,y+13)
  // A few small items sit on the new furniture, without changing its collision.
  const tableObjects = new Graphics()
  tableObjects.rect(385,99,9,6).fill(0xe8ddc6).rect(387,100,5,3).fill(0xf9eddb)
  tableObjects.rect(400,100,4,4).fill(0x728d7f).rect(404,101,2,2).fill(0xc9c2a5)
  tableObjects.zIndex=121; world.addChild(tableObjects)
  const coffeeObjects = new Graphics()
  coffeeObjects.rect(63,224,11,6).fill(0x75504a).rect(64,224,9,1).fill(0xd3a97b)
  coffeeObjects.rect(87,225,5,4).fill(0xe8d9bd).rect(92,226,2,2).fill(0xd3bb97)
  coffeeObjects.zIndex=246; world.addChild(coffeeObjects)
  const toiletries = new Graphics()
  toiletries.rect(378,171,5,3).fill(0xe6d3b3).rect(379,171,3,1).fill(0xfff1d4)
  toiletries.rect(462,163,3,5).fill(0x7da59c).rect(463,161,1,2).fill(0xe7dfc6)
  toiletries.zIndex=202; world.addChild(toiletries)

  // Wooden front door sits in the lower wall and shares its palette.
  const door = new Graphics()
  door.rect(237, 284, 38, 20).fill(0x4e382f).rect(240, 286, 32, 18).fill(0x8b5c3d)
  door.rect(242, 288, 12, 14).fill(0xb48054).rect(258, 288, 12, 14).fill(0xb48054)
  door.rect(244, 290, 8, 10).fill(0x805439).rect(260, 290, 8, 10).fill(0x805439)
  door.rect(252, 295, 2, 2).fill(0xe6c07e).rect(258, 295, 2, 2).fill(0xe6c07e)
  door.zIndex=304; world.addChild(door)

}

export function addHomeLighting(world) {
  const canvas = document.createElement('canvas')
  canvas.width = HOME_WIDTH; canvas.height = HOME_HEIGHT
  const ctx = canvas.getContext('2d')
  // A restrained ambient tint gives each room depth while preserving the sprite colours.
  ctx.fillStyle = '#c8c2b9'; ctx.fillRect(0, 0, HOME_WIDTH, HOME_HEIGHT)
  const rooms = [
    {rect:[16,32,192,120], base:'#d0c7ba', light:[110,52,125], tone:'warm'},
    {rect:[304,32,192,120], base:'#d4cbbb', light:[405,52,125], tone:'warm'},
    {rect:[16,160,192,144], base:'#c8bcae', light:[80,196,122], tone:'warm'},
    {rect:[304,160,192,144], base:'#c8d2ca', light:[419,200,125], tone:'cool'},
    {rect:[216,32,80,272], base:'#c4b8a8', light:[256,169,175], tone:'warm'},
  ]
  for (const {rect:[x,y,w,h], base, light:[lx,ly,r], tone} of rooms) {
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip()
    ctx.fillStyle=base; ctx.fillRect(x,y,w,h)
    const glow=ctx.createRadialGradient(lx,ly,3,lx,ly,r)
    glow.addColorStop(0,tone === 'cool' ? 'rgba(246,255,249,.80)' : 'rgba(255,245,224,.90)')
    glow.addColorStop(.45,tone === 'cool' ? 'rgba(235,249,241,.32)' : 'rgba(255,234,203,.40)')
    glow.addColorStop(1,'rgba(255,244,224,0)')
    ctx.fillStyle=glow; ctx.fillRect(x,y,w,h)
    ctx.restore()
  }
  const light = new Sprite(Texture.from(canvas))
  light.blendMode='multiply'; light.zIndex=100000; world.addChild(light)

  // A separate, subtle screen layer adds daylight and lamplight without floating bulbs.
  const highlights=document.createElement('canvas')
  highlights.width=HOME_WIDTH; highlights.height=HOME_HEIGHT
  const shine=highlights.getContext('2d')
  function pool(x,y,r,clip,color,alpha) {
    shine.save(); shine.beginPath(); shine.rect(...clip); shine.clip()
    const g=shine.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(${color},${alpha})`)
    g.addColorStop(.45,`rgba(${color},${alpha*.45})`)
    g.addColorStop(1,`rgba(${color},0)`)
    shine.fillStyle=g; shine.fillRect(x-r,y-r,r*2,r*2); shine.restore()
  }
  pool(109,39,94,[16,32,192,120],'255,216,154',.16)
  pool(407,39,96,[304,32,192,120],'255,222,170',.14)
  pool(94,44,45,[16,32,192,120],'255,177,90',.12)
  pool(32,171,57,[16,160,192,144],'255,187,105',.18)
  pool(451,177,66,[304,160,192,144],'205,231,225',.10)
  // Diffuse shafts are clipped to the windowed rooms and fade away from the sill.
  for (const [x,y,clip] of [[109,34,[16,32,192,120]],[407,34,[304,32,192,120]]]) {
    shine.save(); shine.beginPath(); shine.rect(...clip); shine.clip()
    const fade=shine.createLinearGradient(x,y,x+48,y+100)
    fade.addColorStop(0,'rgba(255,224,173,.15)')
    fade.addColorStop(.62,'rgba(255,224,173,.055)')
    fade.addColorStop(1,'rgba(255,224,173,0)')
    shine.fillStyle=fade; shine.beginPath(); shine.moveTo(x-11,y); shine.lineTo(x+12,y)
    shine.lineTo(x+64,y+105); shine.lineTo(x+30,y+105); shine.closePath(); shine.fill()
    shine.restore()
  }
  const bloom=new Sprite(Texture.from(highlights))
  bloom.blendMode='screen'; bloom.zIndex=100001; world.addChild(bloom)
}
