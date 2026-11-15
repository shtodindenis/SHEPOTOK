import { Graphics } from 'pixi.js'

// Use the same artwork for the original cloth and its dropped version.
export function drawRag() {
  const rag = new Graphics()
  rag.poly([-9,-6,-6,-9,5,-9,8,-6,7,2,-7,3,-9,0]).fill(0x583d38)
  rag.poly([-7,-6,-5,-8,4,-8,6,-6,6,0,-6,1,-7,-1]).fill(0xc66f56)
  rag.rect(-5,-7,9,2).fill(0xeaa17d).rect(-6,-4,11,2).fill(0xdc8b6b)
  rag.rect(-4,-1,8,1).fill(0x9d5348).rect(3,-6,2,2).fill(0xf6c39e)
  return rag
}
