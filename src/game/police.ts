import { Graphics } from 'pixi.js'

// Original pixel figures used both in the forest arrest and at the crime scene.
export function drawPolice() {
  const g = new Graphics()
  g.rect(-6,-16,12,4).fill(0x162c49).rect(-8,-13,16,3).fill(0x24476b)
    .rect(-4,-12,8,7).fill(0xd7a47c).rect(-3,-10,2,2).rect(2,-10,2,2).fill(0x25272c)
    .rect(-6,-5,12,9).fill(0x284d79).rect(-8,-4,3,8).rect(5,-4,3,8).fill(0x24436b)
    .rect(-5,4,4,5).rect(1,4,4,5).fill(0x172b48).rect(-5,8,4,2).rect(1,8,4,2).fill(0x171a20)
    .rect(-1,-14,2,2).fill(0xe4c16a).rect(1,-3,2,2).fill(0xe2c05e).rect(-6,2,12,2).fill(0x222630)
  return g
}

export function drawPoliceCar() {
  const g = new Graphics()
  g.ellipse(0,8,31,6).fill({color:0x202b30,alpha:.35})
    .rect(-29,-8,58,16).fill(0xdee3df).rect(-24,-16,39,9).fill(0xe7eae4)
    .rect(-20,-14,13,7).rect(-3,-14,14,7).fill(0x7895a4)
    .rect(-29,0,58,5).fill(0x315c91).rect(-24,5,11,9).rect(14,5,11,9).fill(0x1c2329)
    .rect(-22,7,7,5).rect(16,7,7,5).fill(0x89949a)
    .rect(-8,-20,8,4).fill(0xd74440).rect(0,-20,8,4).fill(0x438aca)
    .rect(-28,-6,5,4).rect(24,-6,5,4).fill(0xe7ca77)
  return g
}
