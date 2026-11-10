import { Graphics, Sprite } from 'pixi.js'

export const VILLAGE_WIDTH = 1152, VILLAGE_HEIGHT = 576
export const VILLAGE = {
  home: {x:108,y:172}, hut: {x:846,y:160}, mansion: {x:950,y:486},
  bike: {x:151,y:195}, forest: {x:1123,y:300}, well: {x:450,y:263}, neighbor: {x:401,y:289}, sign: {x:207,y:286},
}
export const HOUSES = [
  {x:52,y:90,kind:'home'}, {x:250,y:65}, {x:535,y:80}, {x:790,y:78,kind:'hut'},
  {x:100,y:382}, {x:335,y:390}, {x:580,y:385}, {x:870,y:380,scale:2,kind:'mansion'},
]
export const OTHER_DOORS = HOUSES.filter(h => !h.kind).map(h => ({x:h.x+56,y:h.y+80}))
const TREE_POSITIONS = [[8,40],[163,30],[360,38],[454,52],[660,22],[721,82],[916,40],[1040,61],[1100,128],
  [20,195],[195,205],[332,178],[660,179],[986,189],[1065,212],
  [20,360],[237,360],[284,482],[475,390],[750,378],[795,488],[1040,410],[1100,480],[25,510],[555,510],[970,520]]
// Keep each trunk at its original position while the canopy grows upward.
export const VILLAGE_TREES = TREE_POSITIONS.map(([x,y], i) => ({
  x:x+8, y:y+32, scale:[1.82, 2, 2.18, 2, 1.9, 2.08][i % 6],
  tint:[0xffffff, 0xd9f1d2, 0xebf1d3, 0xd4e9d5][i % 4], flip:i % 3 === 1, pattern:i % 3,
}))
export const VILLAGE_MUSHROOMS = [[225,175],[236,133],[485,192],[722,227],[1000,350],[267,492],[497,480],[740,435]]
export const VILLAGE_SOLIDS = [
  {x:VILLAGE.sign.x-3,y:VILLAGE.sign.y-7,w:6,h:7},
  ...VILLAGE_MUSHROOMS.map(([x,y])=>({x:x+2,y:y+10,w:12,h:5})),
  ...HOUSES.map(h => ({x:h.x,y:h.y+6,w:48*(h.scale || 1.5),h:48*(h.scale || 1.5)-6})),
  ...VILLAGE_TREES.map(({x,y,scale}) => ({x:x-3.5*scale,y:y-10*scale,w:7*scale,h:8*scale})),
  {x:130,y:175,w:43,h:17},
  {x:VILLAGE.well.x-19,y:VILLAGE.well.y-8,w:38,h:23},
]


export function buildVillage({world, sprite, sheet, dungeon, collision, depthGroup, bike, scene}) {
  const ground = new Graphics().rect(0,0,VILLAGE_WIDTH,VILLAGE_HEIGHT).fill(0x7cb968)
  // Broad, meandering lane with narrower paths leading to each doorstep.
  const road = (points, width, color) => {
    ground.moveTo(points[0][0],points[0][1])
    for (let i=1;i<points.length;i++) ground.lineTo(points[i][0],points[i][1])
    ground.stroke({width,color,cap:'round',join:'round'})
  }
  const paths = [{ points:[[0,300],[120,297],[240,307],[370,302],[520,314],[660,303],[800,309],[940,296],[1152,300]], width:49 }]
  for (const [x,y,join] of [[108,163,297],[306,138,305],[591,153,310],[846,151,306]]) {
    paths.push({points:[[x,y],[x-4,(y+join)/2],[x+3,join]], width:17})
  }
  // Southern doorsteps connect around the side of each building.
  for (const [doorX,doorY,sideX,topY] of [[156,454,187,370],[391,462,422,378],[636,457,667,373],[950,476,986,368]]) {
    paths.push({points:[[doorX,doorY],[sideX,doorY+2],[sideX,topY],[sideX-6,308]], width:17})
  }
  // Draw every outline first, then the shared surface, so intersections merge.
  for (const path of paths) road(path.points, path.width+6, 0xa77c53)
  for (const path of paths) road(path.points, path.width, 0xcfa476)
  world.addChild(ground)
  const detail = new Graphics()
  // Small grass tufts, flowers, and stones soften the flat terrain and path.
  for(let y=22;y<VILLAGE_HEIGHT-12;y+=23) for(let x=15;x<VILLAGE_WIDTH-10;x+=29) {
    const n=(x*71+y*19)%37
    if (n<6) detail.rect(x,y,3,1).fill({color:0x4e9755,alpha:.45}).rect(x+2,y-2,1,3).fill({color:0x5a9e54,alpha:.5})
    else if(n===9) detail.rect(x,y,2,2).fill(0xe5d997).rect(x+3,y+1,1,1).fill(0xe9bba0)
  }
  for(let x=30;x<1120;x+=41) { const y=301+Math.round(7*Math.sin(x/85)); detail.rect(x,y,3,1).fill({color:0x9e7857,alpha:.4}); detail.rect(x+10,y+9,2,1).fill({color:0xf0cda1,alpha:.5}) }
  world.addChild(detail)
  // Houses share the same scale and have a solid footprint and visible door.
  for (const h of HOUSES) {
    const scale=h.scale || 1.5, size=16*scale
    const shadow=new Graphics().ellipse(h.x+size*1.55,h.y+size*3+3,size*1.7,7).fill({color:0x334f3b,alpha:.18})
    world.addChild(shadow)
    depthGroup(h.y+size*3, () => {
    const base=h.kind==='hut'?4:0
    for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
      const tile=sprite(sheet,h.x+col*size,h.y+row*size,base+col,4+row,scale,false)
      if (!h.kind && h.x===535) tile.tint=0xe8d5c2
    }
    const dx=h.x+size*2.1, dy=h.y+size*2.05, dw=size*.66, dh=size*.95
    const door=new Graphics().rect(dx-2,dy-2,dw+4,dh+2).fill(0x563d35).rect(dx,dy,dw,dh).fill(h.kind==='hut'?0x7f5142:0x925d3e)
    door.rect(dx+3,dy+3,dw-6,dh-5).fill(0xa77750).rect(dx+dw-4,dy+dh*.55,2,2).fill(0xe6c27d)
    world.addChild(door)
    })
  }
  // The parked pit bike is a single depth-sorted object; the dirt can be washed off.
  const bikeShadow = new Graphics().ellipse(152,190,24,5).fill({color:0x354b3c,alpha:.24})
  world.addChild(bikeShadow)
  depthGroup(193, () => {
    const vehicle = new Sprite(bike); vehicle.x=130; vehicle.y=169; vehicle.width=44; vehicle.height=23; world.addChild(vehicle)
    if (!scene.bikeClean) {
      const stains = new Graphics()
      stains.rect(139,175,8,4).fill(0x67594a).rect(140,176,6,2).fill(0xf3efdb).rect(142,175,2,5).fill(0xf3efdb)
      stains.rect(154,179,8,4).fill(0x67594a).rect(155,180,6,2).fill(0xe6e2cf).rect(157,179,2,5).fill(0xe6e2cf)
      stains.rect(165,183,5,3).fill(0x67594a).rect(166,184,3,2).fill(0xf4efdc)
      world.addChild(stains)
    }
  })
  // Stone well with a timber canopy, water and bucket, leaving its south side accessible.
  const w=VILLAGE.well
  depthGroup(w.y+15, () => {
  const well=new Graphics()
  well.ellipse(w.x+2,w.y+15,25,8).fill({color:0x354b3c,alpha:.25})
  well.ellipse(w.x,w.y+9,19,12).fill(0x6e7770).ellipse(w.x,w.y+6,19,11).fill(0xa3a397)
  well.ellipse(w.x,w.y+4,13,7).fill(0x424f50).ellipse(w.x,w.y+4,10,5).fill(0x719ca2)
  well.rect(w.x-17,w.y-19,4,26).fill(0x714d35).rect(w.x+13,w.y-19,4,26).fill(0x714d35)
  well.poly([w.x-22,w.y-18,w.x,w.y-29,w.x+22,w.y-18,w.x+19,w.y-14,w.x-19,w.y-14]).fill(0x8d5340)
  well.poly([w.x-17,w.y-19,w.x,w.y-27,w.x+16,w.y-19]).fill(0xbe7958)
  well.rect(w.x-1,w.y-15,2,16).fill(0xc7ad80).rect(w.x-4,w.y,8,6).fill(0x926e4e)
  world.addChild(well)
  })
  depthGroup(VILLAGE.neighbor.y+4, () => sprite(dungeon,VILLAGE.neighbor.x-8,VILLAGE.neighbor.y-15,2,8,1,false))
  depthGroup(VILLAGE.sign.y, () => sprite(sheet,VILLAGE.sign.x-8,VILLAGE.sign.y-17,11,6,1,false))
  // Trees and gardens are placed away from main routes and doorsteps.
  for(const [x,y] of VILLAGE_MUSHROOMS)
    depthGroup(y+16, () => sprite(sheet,x,y,5,2,1,false))
  for(const tree of VILLAGE_TREES) {
    const {x,y,scale,tint,flip,pattern} = tree
    const left=Math.round(x-8*scale), top=Math.round(y-32*scale)
    const sh=new Graphics().ellipse(x+2,y-3,12*scale,4*scale).fill({color:0x3b6142,alpha:.25}); world.addChild(sh)
    depthGroup(y-2*scale, () => {
    for (const [row, offset] of [[0,0],[1,16]]) {
      const tile=sprite(sheet,left,top+offset*scale,4,row,scale,false)
      tile.tint=tint
      if(flip) { tile.scale.x=-scale; tile.x=left+16*scale }
    }
    // Small leaf clusters vary the pixel pattern as well as the tint.
    const leaves=new Graphics(), marks = [
      [[6,9],[10,16]], [[4,13],[9,19]], [[8,8],[5,17],[10,20]],
    ][pattern]
    for(const [mx,my] of marks) leaves.rect(left+(flip?15-mx:mx)*scale,top+my*scale,scale,scale).fill({color:0xb9df94,alpha:.48})
    world.addChild(leaves)
    })
  }
  for (const rect of VILLAGE_SOLIDS) collision.addRect(rect)
}

export function addVillageSunlight(world) {
  const sun = new Graphics()
  sun.rect(0,0,VILLAGE_WIDTH,VILLAGE_HEIGHT).fill({color:0xffe3ad,alpha:.07})
  // Subtle broad bands suggest low afternoon sun without hiding the pixel art.
  sun.poly([0,0,400,0,135,576,0,576]).fill({color:0xffefc9,alpha:.045})
  sun.poly([380,0,690,0,430,576,175,576]).fill({color:0xffefc9,alpha:.025})
  sun.zIndex = 100000; world.addChild(sun)
}
