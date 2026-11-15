import { Graphics, Text } from 'pixi.js'

export const DETENTION_WIDTH = 1200, DETENTION_HEIGHT = 640
export const DETENTION_ENTRY = { x: 105, y: 98 }
export const DETENTION_TAP = { x: 42, y: 104 }
export const DETENTION_DOOR = { x: 122, y: 170 }
export const DETENTION_SHOVEL = { x: 344, y: 530 }
export const DETENTION_EVIDENCE = { x: 575, y: 175 }
export const DETENTION_EXIT = { x: 1150, y: 443 }
export const DETENTION_HIDING = [{x:127,y:447}, {x:592,y:300}, {x:1046,y:215}, {x:700,y:535}]

// The cell door opens after the guard has entered; other openings are permanent.
export function detentionWalls(open = false) {
  return [
    {x:16,y:16,w:1168,h:8}, {x:16,y:16,w:8,h:608}, {x:1176,y:16,w:8,h:608}, {x:16,y:616,w:1168,h:8},
    {x:16,y:152,w:88,h:8}, {x:140,y:152,w:80,h:8}, ...(!open ? [{x:104,y:152,w:36,h:8}] : []),
    {x:216,y:16,w:8,h:144}, {x:224,y:152,w:80,h:8}, {x:350,y:152,w:90,h:8},
    {x:440,y:16,w:8,h:144}, {x:704,y:16,w:8,h:144}, {x:440,y:152,w:264,h:8},
    {x:16,y:238,w:244,h:8}, {x:308,y:238,w:252,h:8}, {x:624,y:238,w:176,h:8}, {x:848,y:238,w:336,h:8},
    {x:216,y:246,w:8,h:146}, {x:448,y:246,w:8,h:146}, {x:704,y:246,w:8,h:146}, {x:920,y:246,w:8,h:146},
    {x:16,y:392,w:244,h:8}, {x:308,y:392,w:252,h:8}, {x:624,y:392,w:176,h:8}, {x:848,y:392,w:336,h:8},
    {x:16,y:480,w:280,h:8}, {x:344,y:480,w:296,h:8}, {x:688,y:480,w:496,h:8},
  ]
}

export function buildDetention({ world, collision, sprite, dungeon, scene }) {
  const floor = new Graphics().rect(0,0,1200,640).fill(0x171d1d).rect(16,16,1168,608).fill(0x586660)
  for (let y=24;y<616;y+=16) for(let x=24;x<1176;x+=16) {
    const shade=((x/16+y/16)%2) ? 0x596a63 : 0x62716a
    floor.rect(x,y,15,15).fill(shade)
    if ((x*7+y*3)%113 < 6) floor.rect(x+3,y+4,4,1).fill({color:0x344641,alpha:.55})
  }
  floor.rect(24,24,192,128).fill({color:0x87918a,alpha:.13})
  floor.rect(24,161,1152,77).fill({color:0x343e3d,alpha:.25})
  floor.rect(24,401,1152,79).fill({color:0x343e3d,alpha:.25})
  floor.rect(448,24,248,128).fill({color:0x908f77,alpha:.12})
  // Grout, wear and drains keep the institutional floor from reading as a flat grid.
  for (let y=33;y<610;y+=31) for (let x=30;x<1170;x+=43) {
    const n=(x*29+y*17)%13
    if(n<4) floor.rect(x,y,5+n,1).rect(x+3,y+2,2,1).fill({color:0x303d38,alpha:.35})
  }
  for (const x of [250,402,640]) {
    floor.rect(x,211,22,9).fill(0x3a4944).rect(x+2,213,18,5).fill(0x7d8c80)
    for(let dx=4;dx<19;dx+=4) floor.rect(x+dx,213,1,5).fill(0x394843)
  }
  world.addChild(floor)
  const walls = new Graphics()
  for (const r of detentionWalls(scene.detention?.cellOpen)) {
    walls.rect(r.x,r.y,r.w,r.h).fill(0x303d3b).rect(r.x,r.y,r.w,Math.min(3,r.h)).fill(0x7f9187)
    collision.addRect(r)
  }
  world.addChild(walls)
  const props = new Graphics()
  // Bunks, bedding, toilet and tap in the cell.
  for (const y of [35,70]) {
    props.rect(144,y,58,24).fill(0x303c3d).rect(147,y+3,52,17).fill(0x89918a)
      .rect(150,y+5,13,12).fill(0xc8c9b6).rect(168,y+5,28,12).fill(0x728078)
  }
  collision.addRect({x:144,y:35,w:58,h:24}); collision.addRect({x:144,y:70,w:58,h:24})
  props.rect(27,91,30,24).fill(0x475450).rect(30,94,24,16).fill(0xc3c5b3)
    .ellipse(42,101,8,5).fill(0x6b7770).rect(40,85,4,10).fill(0xa7b4a8).rect(42,84,9,3).fill(0xa7b4a8)
  if(scene.detention?.cellOpen) props.ellipse(69,125,37,12).fill({color:0x82bbc2,alpha:.55})
  // Cell bars, desk, lockers and evidence grille.
  props.rect(104,148,36,4).fill(0xa2b0a3)
  for(let x=106;x<140;x+=7) props.rect(x,126,2,28).fill(0xa2b0a3)
  props.rect(257,35,65,28).fill(0x4b4740).rect(260,38,59,21).fill(0x887d64)
  props.rect(265,40,15,10).fill(0xd5d1b5).rect(282,39,12,12).fill(0x39494a)
    .rect(285,42,6,5).fill(0x94ad98).rect(298,43,14,2).fill(0x454e47)
    .rect(278,65,24,12).fill(0x3e4d47).rect(282,68,16,7).fill(0x9a8c70)
  props.rect(340,31,37,52).fill(0x3d504a).rect(344,34,14,44).fill(0x71847a).rect(360,34,14,44).fill(0x71847a)
  props.rect(355,50,2,4).rect(369,50,2,4).fill(0xc0c7ae)
  props.rect(540,122,64,30).fill(0x49544c).rect(543,125,58,24).fill(0x69786a)
  if (scene.detention?.cause === 'cannabis' && scene.detention.choice !== 'cannabis') props.rect(568,136,15,13).fill(0x9ba668).rect(571,133,9,4).fill(0xd1c89e)
  if (scene.detention?.choice === 'cannabis') props.rect(566,126,3,19).fill(0xac8155).rect(562,144,11,5).fill(0xb2b9aa)
  for(let x=542;x<604;x+=8) props.rect(x,122,2,37).fill(0xa0ada1)
  for (const [x,y] of [[625,43],[653,43],[625,75],[653,75]]) {
    props.rect(x,y,22,21).fill(0x6e5945).rect(x+2,y+2,18,17).fill(0x9b815e)
      .moveTo(x+3,y+3).lineTo(x+19,y+18).moveTo(x+19,y+3).lineTo(x+3,y+18).stroke({width:1,color:0x625341})
  }
  props.rect(324,520,45,18).fill(0x4e584a)
  if (scene.detention?.cause === 'cannabis' && !scene.detention.shovelFound) props.rect(344,506,3,23).fill(0xac8155).rect(340,527,10,6).fill(0xb2b9aa)
  // Corridor benches, institutional signs, pipework and small service details.
  for (const [x,y] of [[350,215],[720,215],[385,459],[945,459]]) {
    props.rect(x,y,58,8).fill(0x33433e).rect(x+2,y+1,54,4).fill(0x8b806b)
      .rect(x+6,y+8,4,4).rect(x+48,y+8,4,4).fill(0x3b4842)
  }
  for (const [x,y] of [[120,180],[755,180],[140,418],[930,418]]) {
    props.rect(x,y,30,17).fill(0x3c4b45).rect(x+2,y+2,26,13).fill(0xb8aa72)
      .rect(x+5,y+5,18,1).rect(x+5,y+8,14,1).fill(0x5b604c)
  }
  for (const [x,y] of [[272,250],[812,250],[272,405],[812,405]]) {
    props.rect(x,y,23,4).fill(0xd0b65a)
    for(let dx=0;dx<23;dx+=8) props.rect(x+dx,y,3,4).fill(0x433d2d)
  }
  props.rect(25,145,79,3).fill(0x869489).rect(27,137,3,11).fill(0x869489)
    .rect(381,27,26,18).fill(0x384844).rect(384,30,20,12).fill(0x9cae9c)
    .rect(393,31,2,7).rect(394,37,5,2).fill(0x34423b)
  for(const [x,y] of [[780,40],[1015,50],[1030,265],[505,345],[185,550],[760,550]]) {
    props.rect(x,y,38,29).fill(0x43514a).rect(x+3,y+3,32,23).fill(0x758478)
      .rect(x+6,y+7,26,2).rect(x+6,y+14,26,2).fill(0x55675b)
  }
  // Wall lights and contrasting signs.
  for(const x of [68,288,506,642]) props.rect(x,20,35,5).fill(0xd6dcb8).rect(x+3,25,29,2).fill({color:0xeef6cb,alpha:.45})
  props.rect(27,35,48,25).fill(0x3c4c47).rect(30,38,42,19).fill(0x748178)
  for(let x=33;x<70;x+=8) props.rect(x,38,2,19).fill(0xa8b4a8)
  props.rect(37,59,26,3).fill(0x4b5d54)
  props.rect(184,113,16,25).fill(0x445249).rect(187,116,10,18).fill(0x8c9586)
  props.rect(245,178,23,14).fill(0x44534c).rect(248,181,17,8).fill(0xc4ad5e)
  props.rect(461,180,23,14).fill(0x44534c).rect(464,183,17,8).fill(0xc4ad5e)
  props.rect(1100,419,62,17).fill(0xc2a647).rect(1106,424,50,7).fill(0x655c32)
  for(const {x,y} of DETENTION_HIDING) {
    props.rect(x-24,y-12,48,22).fill(0x364640).rect(x-21,y-10,42,16).fill(0x758276)
      .rect(x-18,y-7,36,2).fill(0xa2ad99).rect(x-18,y+1,36,2).fill(0x4b5d52)
  }
  props.zIndex=170; world.addChild(props)
  const label = (value,x,y) => { const t=new Text({text:value,style:{fontFamily:'Arial',fontSize:8,fontWeight:'bold',fill:0xe3dfbd}}); t.x=x;t.y=y;t.zIndex=171;world.addChild(t) }
  label('КАМЕРА',70,28); label('ДЕЖУРНАЯ',268,26); label('РАСПИСАНИЕ',245,178); label('ВЕЩДОКИ',520,26); label('ВЫХОД',1115,424); label('ХОЗБЛОК',300,505)
  // Евсобий в костюме петуха: гребень, клюв, бородка, крылья и хвост.
  const rooster = new Graphics()
  rooster.rect(78,59,20,20).fill(0xe7ddbd).rect(76,64,3,13).rect(98,64,3,13).fill(0xc8bc9d)
    .rect(80,79,5,5).rect(92,79,5,5).fill(0xe6a347)
    .rect(79,52,18,12).fill(0xf0e5c7).rect(83,54,3,3).rect(91,54,3,3).fill(0x302f2a)
    .rect(85,58,6,4).fill(0xe9a12c).rect(88,62,3,5).fill(0xbd392e)
    .rect(82,46,4,7).rect(87,44,4,9).rect(92,47,4,6).fill(0xd74a38)
    .rect(100,62,5,12).fill(0x754741).rect(104,58,4,13).fill(0x9a5f50)
  rooster.zIndex=90; world.addChild(rooster)
}
